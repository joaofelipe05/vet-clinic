// src/routes/estoque.js
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const itemSchema = z.object({
  nome:          z.string().min(1, 'Nome obrigatório'),
  categoria:     z.enum(['MEDICAMENTO','VACINA','PRODUTO','MATERIAL','SERVICO_CUSTO']).default('PRODUTO'),
  descricao:     z.string().optional().nullable(),
  unidade:       z.string().default('un'),
  quantidade:    z.number().default(0),
  quantidadeMin: z.number().default(5),
  precoCusto:    z.number().optional().nullable(),
  precoVenda:    z.number().optional().nullable(),
  codigoBarras:  z.string().optional().nullable(),
  fabricante:    z.string().optional().nullable(),
})

export async function estoqueRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /estoque — lista com alertas de estoque baixo
  app.get('/', auth, async (request, reply) => {
    const { busca, categoria, alerta } = request.query

    const where = {
      ativo: true,
      ...(categoria && { categoria }),
      ...(alerta === 'true' && {
        // itens abaixo do mínimo
      }),
      ...(busca && {
        OR: [
          { nome:        { contains: busca, mode: 'insensitive' } },
          { fabricante:  { contains: busca, mode: 'insensitive' } },
          { codigoBarras:{ contains: busca } },
        ],
      }),
    }

    const itens = await prisma.itemEstoque.findMany({
      where,
      orderBy: { nome: 'asc' },
    })

    // Marca os que estão com estoque baixo
    const comAlerta = itens.map(i => ({
      ...i,
      estoqueBaixo: i.quantidade <= i.quantidadeMin,
    }))

    // Se filtrou por alerta, retorna só os baixos
    const resultado = alerta === 'true'
      ? comAlerta.filter(i => i.estoqueBaixo)
      : comAlerta

    return reply.send(resultado)
  })

  // GET /estoque/:id
  app.get('/:id', auth, async (request, reply) => {
    const item = await prisma.itemEstoque.findUnique({
      where: { id: request.params.id },
      include: {
        movimentacoes: {
          orderBy: { criadoEm: 'desc' },
          take: 20,
        },
      },
    })
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' })
    return reply.send(item)
  })

  // POST /estoque — cadastrar item
  app.post('/', auth, async (request, reply) => {
    const parse = itemSchema.safeParse(request.body)
    if (!parse.success) return reply.status(400).send({ error: parse.error.errors[0].message })

    const item = await prisma.itemEstoque.create({ data: parse.data })
    return reply.status(201).send(item)
  })

  // PUT /estoque/:id — editar item
  app.put('/:id', auth, async (request, reply) => {
    const parse = itemSchema.partial().safeParse(request.body)
    if (!parse.success) return reply.status(400).send({ error: parse.error.errors[0].message })

    const item = await prisma.itemEstoque.update({
      where: { id: request.params.id },
      data: parse.data,
    })
    return reply.send(item)
  })

  // POST /estoque/:id/movimentar — entrada, ajuste ou perda manual
  app.post('/:id/movimentar', auth, async (request, reply) => {
    const schema = z.object({
      tipo:       z.enum(['ENTRADA','AJUSTE','PERDA']),
      quantidade: z.number().positive(),
      motivo:     z.string().optional(),
    })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.status(400).send({ error: parse.error.errors[0].message })

    const item = await prisma.itemEstoque.findUnique({ where: { id: request.params.id } })
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' })

    const delta = parse.data.tipo === 'ENTRADA'
      ? parse.data.quantidade
      : -parse.data.quantidade

    const [itemAtualizado] = await prisma.$transaction([
      prisma.itemEstoque.update({
        where: { id: request.params.id },
        data: { quantidade: { increment: delta } },
      }),
      prisma.movimentacaoEstoque.create({
        data: {
          itemId:    request.params.id,
          tipo:      parse.data.tipo,
          quantidade: parse.data.quantidade,
          motivo:    parse.data.motivo,
        },
      }),
    ])

    return reply.send(itemAtualizado)
  })

  // ── Itens usados em consulta ──────────────────────────────

  // GET /estoque/consulta/:consultaId — itens usados numa consulta
  app.get('/consulta/:consultaId', auth, async (request, reply) => {
    const itens = await prisma.itemConsulta.findMany({
      where: { consultaId: request.params.consultaId },
      include: { item: true },
      orderBy: { criadoEm: 'asc' },
    })
    return reply.send(itens)
  })

  // POST /estoque/consulta/:consultaId/adicionar — adiciona item à consulta (sem deduzir ainda)
  app.post('/consulta/:consultaId/adicionar', auth, async (request, reply) => {
    const schema = z.object({
      itemId:       z.string().uuid(),
      quantidade:   z.number().positive(),
      precoUnitario:z.number().optional().nullable(),
    })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.status(400).send({ error: parse.error.errors[0].message })

    // Verifica se tem estoque suficiente
    const item = await prisma.itemEstoque.findUnique({ where: { id: parse.data.itemId } })
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' })
    if (item.quantidade < parse.data.quantidade) {
      return reply.status(400).send({ error: `Estoque insuficiente. Disponível: ${item.quantidade} ${item.unidade}` })
    }

    const itemConsulta = await prisma.itemConsulta.create({
      data: {
        consultaId:    request.params.consultaId,
        itemId:        parse.data.itemId,
        quantidade:    parse.data.quantidade,
        precoUnitario: parse.data.precoUnitario ?? item.precoVenda,
        confirmado:    false, // aguarda revisão
      },
      include: { item: true },
    })

    return reply.status(201).send(itemConsulta)
  })

  // PATCH /estoque/consulta/:consultaId/confirmar — confirma e deduz do estoque
  app.patch('/consulta/:consultaId/confirmar', auth, async (request, reply) => {
    const itensConsulta = await prisma.itemConsulta.findMany({
      where: { consultaId: request.params.consultaId, confirmado: false },
      include: { item: true },
    })

    if (itensConsulta.length === 0) {
      return reply.send({ mensagem: 'Nenhum item pendente de confirmação.' })
    }

    // Transação: marca como confirmado + deduz estoque + cria movimentação
    await prisma.$transaction([
      // Marca todos como confirmados
      prisma.itemConsulta.updateMany({
        where: { consultaId: request.params.consultaId, confirmado: false },
        data: { confirmado: true },
      }),
      // Deduz cada item do estoque
      ...itensConsulta.map(ic =>
        prisma.itemEstoque.update({
          where: { id: ic.itemId },
          data: { quantidade: { decrement: ic.quantidade } },
        })
      ),
      // Cria movimentação de saída para cada item
      ...itensConsulta.map(ic =>
        prisma.movimentacaoEstoque.create({
          data: {
            itemId:    ic.itemId,
            tipo:      'SAIDA',
            quantidade: ic.quantidade,
            motivo:    `Consulta #${request.params.consultaId.substring(0, 8)}`,
            consultaId: request.params.consultaId,
          },
        })
      ),
    ])

    return reply.send({ mensagem: `${itensConsulta.length} item(ns) confirmado(s) e deduzido(s) do estoque.` })
  })

  // DELETE /estoque/consulta/item/:itemConsultaId — remove item da consulta (se não confirmado)
  app.delete('/consulta/item/:itemConsultaId', auth, async (request, reply) => {
    const ic = await prisma.itemConsulta.findUnique({ where: { id: request.params.itemConsultaId } })
    if (!ic) return reply.status(404).send({ error: 'Item não encontrado.' })
    if (ic.confirmado) return reply.status(400).send({ error: 'Item já confirmado, não pode ser removido.' })

    await prisma.itemConsulta.delete({ where: { id: request.params.itemConsultaId } })
    return reply.send({ mensagem: 'Item removido.' })
  })
}
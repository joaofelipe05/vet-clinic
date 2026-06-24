// src/routes/consultas.js
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'


const prisma = new PrismaClient()

const consultaSchema = z.object({
  
  animalId:      z.string().uuid(),
  dataHora:      z.string(), // ISO datetime
  tipo:          z.enum(['CONSULTA','RETORNO','CIRURGIA','EMERGENCIA','VACINA','EXAME','BANHO_TOSA']).default('CONSULTA'),
  motivoVisita:  z.string().optional().nullable(),
  valor:         z.number().optional().nullable(),
  observacoes:   z.string().optional().nullable(),
})

export async function consultasRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /consultas — agenda do dia ou por período
  app.get('/', auth, async (request, reply) => {
    const { data, animalId, status, pagina = '1', limite = '50' } = request.query

    const where = {
      ...(animalId && { animalId }),
      ...(status   && { status }),
      ...(data && {
        dataHora: {
          gte: new Date(`${data}T00:00:00`),
          lte: new Date(`${data}T23:59:59`),
        },
      }),
    }

    const skip = (Number(pagina) - 1) * Number(limite)

    const consultas = await prisma.consulta.findMany({
      where,
      skip,
      take: Number(limite),
      orderBy: { dataHora: 'asc' },
      include: {
        animal: {
          include: {
            tutor: { select: { nome: true, telefone: true } },
          },
        },
        prontuario: { select: { id: true } }, // apenas saber se tem prontuário
      },
    })

    return reply.send(consultas)
  })

  // GET /consultas/hoje — atalho para agenda do dia
  app.get('/hoje', auth, async (request, reply) => {
    const hoje = new Date().toISOString().split('T')[0]

    const consultas = await prisma.consulta.findMany({
      where: {
        dataHora: {
          gte: new Date(`${hoje}T00:00:00`),
          lte: new Date(`${hoje}T23:59:59`),
        },
      },
      orderBy: { dataHora: 'asc' },
      include: {
        animal: {
          include: { tutor: { select: { nome: true, telefone: true } } },
        },
        prontuario: { select: { id: true } },
      },
    })

    return reply.send(consultas)
  })

  // GET /consultas/:id
  app.get('/:id', auth, async (request, reply) => {
    const consulta = await prisma.consulta.findUnique({
      where: { id: request.params.id },
      include: {
        animal: { include: { tutor: true } },
        veterinario: { select: { nome: true, crmv: true } },
        prontuario: true,
      },
    })

    if (!consulta) return reply.status(404).send({ error: 'Consulta não encontrada.' })
    return reply.send(consulta)
  })

  // POST /consultas — agendar
  app.post('/', auth, async (request, reply) => {
    const parse = consultaSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const consulta = await prisma.consulta.create({
      data: {
        ...parse.data,
        dataHora: new Date(parse.data.dataHora),
        veterinarioId: request.user.sub, // veterinária logada
      },
      include: {
        animal: { include: { tutor: true } },
      },
    })

    return reply.status(201).send(consulta)
  })

  // PATCH /consultas/:id/status — atualizar status
  app.patch('/:id/status', auth, async (request, reply) => {
    const { status } = z.object({
      status: z.enum(['AGENDADA','EM_ATENDIMENTO','CONCLUIDA','CANCELADA','NAO_COMPARECEU']),
    }).parse(request.body)

    const consulta = await prisma.consulta.update({
      where: { id: request.params.id },
      data: { status },
    })
    return reply.send(consulta)
  })

  // PATCH /consultas/:id/pagamento — registrar pagamento
  app.patch('/:id/pagamento', auth, async (request, reply) => {
    const schema = z.object({
      pago:           z.boolean(),
      valor:          z.number().optional(),
      formaPagamento: z.enum(['DINHEIRO','CARTAO_DEBITO','CARTAO_CREDITO','PIX','BOLETO']).optional(),
    })

    const parse = schema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const consulta = await prisma.consulta.update({
      where: { id: request.params.id },
      data: parse.data,
    })
    return reply.send(consulta)
  })

  // PUT /consultas/:id — editar agendamento
  app.put('/:id', auth, async (request, reply) => {
    const parse = consultaSchema.partial().safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const data = {
      ...parse.data,
      ...(parse.data.dataHora && { dataHora: new Date(parse.data.dataHora) }),
    }

    const consulta = await prisma.consulta.update({
      where: { id: request.params.id },
      data,
    })
    return reply.send(consulta)
  })

  // DELETE /consultas/:id — cancelar
  app.delete('/:id', auth, async (request, reply) => {
    await prisma.consulta.update({
      where: { id: request.params.id },
      data: { status: 'CANCELADA' },
    })
    return reply.send({ mensagem: 'Consulta cancelada.' })
  })
}

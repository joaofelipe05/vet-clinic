// src/routes/tutores.js
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const tutorSchema = z.object({
  nome:     z.string().min(2, 'Nome obrigatório'),
  cpf:      z.string().optional().nullable(),
  telefone: z.string().min(8, 'Telefone obrigatório'),
  email:    z.string().email().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade:   z.string().optional().nullable(),
})

export async function tutoresRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /tutores — lista com busca por nome/telefone
  app.get('/', auth, async (request, reply) => {
    const { busca, pagina = '1', limite = '20' } = request.query

    const where = busca
      ? {
          OR: [
            { nome:     { contains: busca, mode: 'insensitive' } },
            { telefone: { contains: busca } },
            { cpf:      { contains: busca } },
          ],
        }
      : {}

    const skip = (Number(pagina) - 1) * Number(limite)

    const [tutores, total] = await Promise.all([
      prisma.tutor.findMany({
        where,
        skip,
        take: Number(limite),
        orderBy: { nome: 'asc' },
        include: { _count: { select: { animais: true } } },
      }),
      prisma.tutor.count({ where }),
    ])

    return reply.send({ tutores, total, pagina: Number(pagina) })
  })

  // GET /tutores/:id — tutor com seus animais
  app.get('/:id', auth, async (request, reply) => {
    const tutor = await prisma.tutor.findUnique({
      where: { id: request.params.id },
      include: {
        animais: {
          where: { ativo: true },
          orderBy: { nome: 'asc' },
        },
      },
    })

    if (!tutor) return reply.status(404).send({ error: 'Tutor não encontrado.' })
    return reply.send(tutor)
  })

  // POST /tutores — cadastrar novo tutor
  app.post('/', auth, async (request, reply) => {
    const parse = tutorSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const tutor = await prisma.tutor.create({ data: parse.data })
    return reply.status(201).send(tutor)
  })

  // PUT /tutores/:id — atualizar tutor
  app.put('/:id', auth, async (request, reply) => {
    const parse = tutorSchema.partial().safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const tutor = await prisma.tutor.update({
      where: { id: request.params.id },
      data: parse.data,
    })
    return reply.send(tutor)
  })

  // DELETE /tutores/:id — soft delete (inativa animais)
  app.delete('/:id', auth, async (request, reply) => {
    // Não apaga — inativa os animais para preservar histórico
    await prisma.animal.updateMany({
      where: { tutorId: request.params.id },
      data: { ativo: false },
    })
    await prisma.tutor.delete({ where: { id: request.params.id } })
    return reply.send({ mensagem: 'Tutor removido com sucesso.' })
  })
}

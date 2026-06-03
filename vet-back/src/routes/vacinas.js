// src/routes/vacinas.js
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

export async function vacinasRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /vacinas/alertas — animais com vacina vencida ou a vencer em 30 dias
  app.get('/alertas', auth, async (_request, reply) => {
    const em30dias = new Date()
    em30dias.setDate(em30dias.getDate() + 30)

    const vacinas = await prisma.vacina.findMany({
      where: {
        proximaDose: { lte: em30dias },
        animal: { ativo: true },
      },
      orderBy: { proximaDose: 'asc' },
      include: {
        animal: { include: { tutor: { select: { nome: true, telefone: true } } } },
      },
    })

    return reply.send(vacinas)
  })

  // POST /vacinas
  app.post('/', auth, async (request, reply) => {
    const schema = z.object({
      animalId:      z.string().uuid(),
      nome:          z.string().min(1),
      dataAplicacao: z.string(),
      proximaDose:   z.string().optional().nullable(),
      lote:          z.string().optional().nullable(),
      fabricante:    z.string().optional().nullable(),
      observacoes:   z.string().optional().nullable(),
    })

    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.status(400).send({ error: parse.error.errors[0].message })

    const vacina = await prisma.vacina.create({
      data: {
        ...parse.data,
        dataAplicacao: new Date(parse.data.dataAplicacao),
        proximaDose: parse.data.proximaDose ? new Date(parse.data.proximaDose) : null,
      },
    })
    return reply.status(201).send(vacina)
  })

  // DELETE /vacinas/:id
  app.delete('/:id', auth, async (request, reply) => {
    await prisma.vacina.delete({ where: { id: request.params.id } })
    return reply.send({ mensagem: 'Vacina removida.' })
  })
}

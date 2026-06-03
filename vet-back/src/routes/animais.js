// src/routes/animais.js
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const animalSchema = z.object({
  nome:           z.string().min(1, 'Nome obrigatório'),
  tutorId:        z.string().uuid('Tutor inválido'),
  especie:        z.enum(['CACHORRO','GATO','AVE','REPTIL','ROEDOR','COELHO','OUTRO']).default('OUTRO'),
  raca:           z.string().optional().nullable(),
  sexo:           z.enum(['MACHO','FEMEA']),
  cor:            z.string().optional().nullable(),
  dataNascimento: z.string().optional().nullable(), // ISO date string
  peso:           z.number().optional().nullable(),
  microchip:      z.string().optional().nullable(),
  castrado:       z.boolean().default(false),
  alergias:       z.string().optional().nullable(),
  observacoes:    z.string().optional().nullable(),
})

export async function animaisRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /animais — listagem com busca
  app.get('/', auth, async (request, reply) => {
    const { busca, especie, pagina = '1', limite = '20' } = request.query

    const where = {
      ativo: true,
      ...(especie && { especie }),
      ...(busca && {
        OR: [
          { nome:      { contains: busca, mode: 'insensitive' } },
          { microchip: { contains: busca } },
          { tutor: { nome: { contains: busca, mode: 'insensitive' } } },
        ],
      }),
    }

    const skip = (Number(pagina) - 1) * Number(limite)

    const [animais, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        skip,
        take: Number(limite),
        orderBy: { nome: 'asc' },
        include: { tutor: { select: { id: true, nome: true, telefone: true } } },
      }),
      prisma.animal.count({ where }),
    ])

    return reply.send({ animais, total })
  })

  // GET /animais/:id — animal com histórico completo
  app.get('/:id', auth, async (request, reply) => {
    const animal = await prisma.animal.findUnique({
      where: { id: request.params.id },
      include: {
        tutor: true,
        vacinas: { orderBy: { dataAplicacao: 'desc' } },
        consultas: {
          orderBy: { dataHora: 'desc' },
          take: 20,
          include: { prontuario: true },
        },
      },
    })

    if (!animal) return reply.status(404).send({ error: 'Animal não encontrado.' })
    return reply.send(animal)
  })

  // POST /animais
  app.post('/', auth, async (request, reply) => {
    const parse = animalSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const data = {
      ...parse.data,
      dataNascimento: parse.data.dataNascimento
        ? new Date(parse.data.dataNascimento)
        : null,
    }

    const animal = await prisma.animal.create({ data })
    return reply.status(201).send(animal)
  })

  // PUT /animais/:id
  app.put('/:id', auth, async (request, reply) => {
    const parse = animalSchema.partial().safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const data = {
      ...parse.data,
      ...(parse.data.dataNascimento && {
        dataNascimento: new Date(parse.data.dataNascimento),
      }),
    }

    const animal = await prisma.animal.update({
      where: { id: request.params.id },
      data,
    })
    return reply.send(animal)
  })
}

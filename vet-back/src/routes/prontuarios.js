// src/routes/prontuarios.js
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const prontuarioSchema = z.object({
  consultaId:              z.string().uuid(),
  anamnese:                z.string().optional().nullable(),
  // Sinais vitais
  temperatura:             z.number().optional().nullable(),
  frequenciaCardiaca:      z.number().int().optional().nullable(),
  frequenciaRespiratoria:  z.number().int().optional().nullable(),
  pesoConsulta:            z.number().optional().nullable(),
  mucosas:                 z.string().optional().nullable(),
  hidratacao:              z.string().optional().nullable(),
  linfonodos:              z.string().optional().nullable(),
  ausculta:                z.string().optional().nullable(),
  exameAbdome:             z.string().optional().nullable(),
  exameOrtopedico:         z.string().optional().nullable(),
  outrosAchados:           z.string().optional().nullable(),
  // Diagnóstico e tratamento
  diagnostico:             z.string().optional().nullable(),
  diagnosticoSuspeito:     z.string().optional().nullable(),
  examesSolicitados:       z.string().optional().nullable(),
  resultadosExames:        z.string().optional().nullable(),
  prescricao:              z.string().optional().nullable(),
  tratamento:              z.string().optional().nullable(),
  retorno:                 z.string().optional().nullable(),
  orientacoes:             z.string().optional().nullable(),
})

export async function prontuariosRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /prontuarios/:id
  app.get('/:id', auth, async (request, reply) => {
    const prontuario = await prisma.prontuario.findUnique({
      where: { id: request.params.id },
      include: {
        consulta: {
          include: {
            animal: { include: { tutor: true } },
            veterinario: { select: { nome: true, crmv: true } },
          },
        },
      },
    })

    if (!prontuario) return reply.status(404).send({ error: 'Prontuário não encontrado.' })
    return reply.send(prontuario)
  })

  // GET /prontuarios/consulta/:consultaId — busca pelo id da consulta
  app.get('/consulta/:consultaId', auth, async (request, reply) => {
    const prontuario = await prisma.prontuario.findUnique({
      where: { consultaId: request.params.consultaId },
      include: {
        consulta: {
          include: {
            animal: { include: { tutor: true } },
            veterinario: { select: { nome: true, crmv: true } },
          },
        },
      },
    })

    // Retorna null se não existir (frontend usa para saber se precisa criar ou editar)
    return reply.send(prontuario)
  })

  // POST /prontuarios — criar prontuário
  app.post('/', auth, async (request, reply) => {
    const parse = prontuarioSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    // Verificar se já existe prontuário para essa consulta
    const existente = await prisma.prontuario.findUnique({
      where: { consultaId: parse.data.consultaId },
    })
    if (existente) {
      return reply.status(409).send({ error: 'Já existe prontuário para esta consulta. Use PUT para atualizar.' })
    }

    // Marcar consulta como "em atendimento" automaticamente
    await prisma.consulta.update({
      where: { id: parse.data.consultaId },
      data: { status: 'EM_ATENDIMENTO' },
    })

    const prontuario = await prisma.prontuario.create({ data: parse.data })
    return reply.status(201).send(prontuario)
  })

  // PUT /prontuarios/:id — atualizar (salva rascunho)
  app.put('/:id', auth, async (request, reply) => {
    const parse = prontuarioSchema.partial().safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const prontuario = await prisma.prontuario.update({
      where: { id: request.params.id },
      data: parse.data,
    })
    return reply.send(prontuario)
  })

  // POST /prontuarios/:id/finalizar — conclui a consulta
  app.post('/:id/finalizar', auth, async (request, reply) => {
    const prontuario = await prisma.prontuario.findUnique({
      where: { id: request.params.id },
    })
    if (!prontuario) return reply.status(404).send({ error: 'Prontuário não encontrado.' })

    // Marca consulta como concluída
    await prisma.consulta.update({
      where: { id: prontuario.consultaId },
      data: { status: 'CONCLUIDA' },
    })

    return reply.send({ mensagem: 'Consulta finalizada com sucesso.' })
  })
}

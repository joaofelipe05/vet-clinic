// src/routes/auth.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

export async function authRoutes(app) {
  // POST /auth/login
  app.post('/login', async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email('E-mail inválido'),
      senha: z.string().min(1, 'Senha obrigatória'),
    })

    const parse = bodySchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const { email, senha } = parse.data

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos.' })
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
    if (!senhaCorreta) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos.' })
    }

    const token = app.jwt.sign(
      { sub: usuario.id, nome: usuario.nome },
      { expiresIn: '12h' } // sessão de 12h — suficiente para um dia de trabalho
    )

    return reply.send({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        crmv: usuario.crmv,
      },
    })
  })

  // POST /auth/registrar (use apenas para criar o primeiro usuário)
  app.post('/registrar', async (request, reply) => {
    const bodySchema = z.object({
      nome:  z.string().min(2, 'Nome obrigatório'),
      email: z.string().email('E-mail inválido'),
      senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
      crmv:  z.string().optional(),
    })

    const parse = bodySchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.errors[0].message })
    }

    const { nome, email, senha, crmv } = parse.data

    const jaExiste = await prisma.usuario.findUnique({ where: { email } })
    if (jaExiste) {
      return reply.status(409).send({ error: 'Este e-mail já está cadastrado.' })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, crmv },
    })

    return reply.status(201).send({
      mensagem: 'Usuário criado com sucesso!',
      id: usuario.id,
    })
  })

  // GET /auth/me — retorna dados do usuário logado
  app.get('/me', { onRequest: [app.authenticate] }, async (request, reply) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: request.user.sub },
      select: { id: true, nome: true, email: true, crmv: true, criadoEm: true },
    })
    return reply.send(usuario)
  })
}

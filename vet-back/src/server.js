
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'


import { authRoutes } from './routes/auth.js'
import { tutoresRoutes } from './routes/tutores.js'
import { animaisRoutes } from './routes/animais.js'
import { consultasRoutes } from './routes/consultas.js'
import { prontuariosRoutes } from './routes/prontuarios.js'
import { vacinasRoutes } from './routes/vacinas.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { pdfRoutes } from './routes/pdf.js'
import { relatoriosRoutes } from './routes/relatorios.js'
import { estoqueRoutes } from './routes/estoque.js'
import { documentosRoutes } from './routes/documentos.js'
const app = Fastify({ logger: true })

// 1. CORS
await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})

// 2. JWT
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-troque-em-producao',
})

// 3. AUTH DECORATOR (ANTES DAS ROTAS)
app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Token inválido ou expirado.' })
  }
})

// 4. ROTAS (UMA SÓ VEZ)
app.register(authRoutes, { prefix: '/auth' })
app.register(tutoresRoutes, { prefix: '/tutores' })
app.register(animaisRoutes, { prefix: '/animais' })
app.register(consultasRoutes, { prefix: '/consultas' })
app.register(prontuariosRoutes, { prefix: '/prontuarios' })
app.register(vacinasRoutes, { prefix: '/vacinas' })
app.register(dashboardRoutes, { prefix: '/dashboard' })
app.register(pdfRoutes, { prefix: '/pdf' })
app.register(relatoriosRoutes, { prefix: '/relatorios' })
app.register(estoqueRoutes, { prefix: '/estoque' })
app.register(documentosRoutes, { prefix: '/documentos' })


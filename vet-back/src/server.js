// src/server.js
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
import { estoqueRoutes }    from './routes/estoque.js'
import { documentosRoutes } from './routes/documentos.js'

const app = Fastify({ logger: true })

// ── Plugins ────────────────────────────────────────────────
await app.register(cors, {
  origin: [
    'http://localhost:5173',
    'https://vet-clinic-i3q2.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-troque-em-producao',
})

// ── Decorator de autenticação (reutilizado nas rotas) ──────
app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: 'Token inválido ou expirado.' })
  }
})

// ── Rotas ──────────────────────────────────────────────────
app.register(authRoutes,       { prefix: '/auth' })
app.register(tutoresRoutes,    { prefix: '/tutores' })
app.register(animaisRoutes,    { prefix: '/animais' })
app.register(consultasRoutes,  { prefix: '/consultas' })
app.register(prontuariosRoutes,{ prefix: '/prontuarios' })
app.register(vacinasRoutes,    { prefix: '/vacinas' })
app.register(dashboardRoutes,  { prefix: '/dashboard' })
app.register(pdfRoutes,        { prefix: '/pdf' })
app.register(relatoriosRoutes, { prefix: '/relatorios' })
app.register(estoqueRoutes,    { prefix: '/estoque' })
app.register(documentosRoutes, { prefix: '/documentos' })

// ── Health check ───────────────────────────────────────────
app.get('/health', () => ({ status: 'ok', sistema: 'Clínica Veterinária' }))

// ── Iniciar servidor ───────────────────────────────────────
const PORT = Number(process.env.PORT) || 3333

try {
  await app.listen({ port: PORT, host: '0.0.0.0' }) // 0.0.0.0 = acessível na rede local
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`)
  console.log(`📋 Na rede local: http://SEU_IP_LOCAL:${PORT}\n`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

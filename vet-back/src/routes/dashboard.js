// src/routes/dashboard.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function dashboardRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /dashboard — resumo geral da clínica
  app.get('/', auth, async (_request, reply) => {
    const hoje = new Date()
    const inicioDia  = new Date(hoje.setHours(0, 0, 0, 0))
    const fimDia     = new Date(hoje.setHours(23, 59, 59, 999))
    const inicioMes  = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const em30dias   = new Date(); em30dias.setDate(em30dias.getDate() + 30)

    const [
      consultasHoje,
      consultasMes,
      totalAnimais,
      totalTutores,
      vacinasAlerta,
      faturamentoMes,
      proximasConsultas,
    ] = await Promise.all([
      // Consultas de hoje
      prisma.consulta.count({ where: { dataHora: { gte: inicioDia, lte: fimDia } } }),

      // Consultas do mês
      prisma.consulta.count({ where: { dataHora: { gte: inicioMes }, status: { not: 'CANCELADA' } } }),

      // Total de pacientes ativos
      prisma.animal.count({ where: { ativo: true } }),

      // Total de tutores
      prisma.tutor.count(),

      // Vacinas a vencer em 30 dias
      prisma.vacina.count({
        where: { proximaDose: { lte: em30dias }, animal: { ativo: true } },
      }),

      // Faturamento do mês
      prisma.consulta.aggregate({
        where: { dataHora: { gte: inicioMes }, pago: true },
        _sum: { valor: true },
      }),

      // Próximas consultas (agenda)
      prisma.consulta.findMany({
        where: {
          dataHora: { gte: new Date() },
          status: { in: ['AGENDADA', 'EM_ATENDIMENTO'] },
        },
        orderBy: { dataHora: 'asc' },
        take: 8,
        include: {
          animal: { include: { tutor: { select: { nome: true } } } },
        },
      }),
    ])

    return reply.send({
      consultasHoje,
      consultasMes,
      totalAnimais,
      totalTutores,
      vacinasAlerta,
      faturamentoMes: faturamentoMes._sum.valor ?? 0,
      proximasConsultas,
    })
  })
}

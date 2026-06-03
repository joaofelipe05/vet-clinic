// src/routes/relatorios.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function relatoriosRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // GET /relatorios?inicio=2025-01-01&fim=2025-12-31
  app.get('/', auth, async (request, reply) => {
    const { inicio, fim } = request.query

    const dataInicio = inicio ? new Date(`${inicio}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const dataFim    = fim    ? new Date(`${fim}T23:59:59`)    : new Date()

    const where = {
      dataHora: { gte: dataInicio, lte: dataFim },
      status: { not: 'CANCELADA' },
    }

    const [
      totalConsultas,
      consultasPorTipo,
      consultasPorStatus,
      faturamentoBruto,
      faturamentoRecebido,
      totalPacientesAtendidos,
      animaisMaisAtendidos,
      consultasPorDia,
      cancelamentos,
    ] = await Promise.all([

      // Total de consultas no período
      prisma.consulta.count({ where }),

      // Agrupado por tipo
      prisma.consulta.groupBy({
        by: ['tipo'],
        where,
        _count: { tipo: true },
        orderBy: { _count: { tipo: 'desc' } },
      }),

      // Agrupado por status
      prisma.consulta.groupBy({
        by: ['status'],
        where: { dataHora: { gte: dataInicio, lte: dataFim } },
        _count: { status: true },
      }),

      // Faturamento bruto (todos com valor)
      prisma.consulta.aggregate({
        where: { ...where, valor: { not: null } },
        _sum: { valor: true },
        _avg: { valor: true },
      }),

      // Faturamento recebido (pagos)
      prisma.consulta.aggregate({
        where: { ...where, pago: true },
        _sum: { valor: true },
      }),

      // Pacientes únicos atendidos
      prisma.consulta.findMany({
        where,
        select: { animalId: true },
        distinct: ['animalId'],
      }),

      // Top 10 animais mais atendidos
      prisma.consulta.groupBy({
        by: ['animalId'],
        where,
        _count: { animalId: true },
        orderBy: { _count: { animalId: 'desc' } },
        take: 10,
      }),

      // Consultas por dia (para gráfico)
      prisma.$queryRaw`
        SELECT
          DATE("dataHora") as dia,
          COUNT(*)::int as total
        FROM consultas
        WHERE "dataHora" >= ${dataInicio}
          AND "dataHora" <= ${dataFim}
          AND status != 'CANCELADA'
        GROUP BY DATE("dataHora")
        ORDER BY dia ASC
      `,

      // Total de cancelamentos
      prisma.consulta.count({
        where: {
          dataHora: { gte: dataInicio, lte: dataFim },
          status: 'CANCELADA',
        },
      }),
    ])

    // Busca nomes dos animais mais atendidos
    const idsTop = animaisMaisAtendidos.map(a => a.animalId)
    const animaisDetalhes = await prisma.animal.findMany({
      where: { id: { in: idsTop } },
      select: { id: true, nome: true, especie: true, tutor: { select: { nome: true } } },
    })

    const topAnimais = animaisMaisAtendidos.map(a => {
      const detalhe = animaisDetalhes.find(d => d.id === a.animalId)
      return {
        ...detalhe,
        totalConsultas: a._count.animalId,
      }
    })

    return reply.send({
      periodo: { inicio: dataInicio, fim: dataFim },
      totalConsultas,
      totalPacientesAtendidos: totalPacientesAtendidos.length,
      cancelamentos,
      taxaCancelamento: totalConsultas + cancelamentos > 0
        ? Math.round((cancelamentos / (totalConsultas + cancelamentos)) * 100)
        : 0,
      faturamentoBruto:    faturamentoBruto._sum.valor    ?? 0,
      faturamentoRecebido: faturamentoRecebido._sum.valor ?? 0,
      ticketMedio:         faturamentoBruto._avg.valor    ?? 0,
      consultasPorTipo:    consultasPorTipo.map(c => ({ tipo: c.tipo, total: c._count.tipo })),
      consultasPorStatus:  consultasPorStatus.map(c => ({ status: c.status, total: c._count.status })),
      topAnimais,
      consultasPorDia:     consultasPorDia.map(d => ({
        dia: d.dia,
        total: Number(d.total),
      })),
    })
  })
}
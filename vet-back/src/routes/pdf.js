// src/routes/pdf.js

import { PrismaClient } from '@prisma/client'
import PdfPrinter from 'pdfmake'

const prisma = new PrismaClient()

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  }
}

function formatarData(data) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null
  const hoje = new Date()
  const nasc = new Date(dataNascimento)
  const anos = hoje.getFullYear() - nasc.getFullYear()
  const meses = hoje.getMonth() - nasc.getMonth()
  if (anos === 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

function secao(titulo, conteudo) {
  if (!conteudo) return null
  return [
    { text: titulo, style: 'subtitulo', margin: [0, 10, 0, 2] },
    { text: conteudo, style: 'corpo' },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e0e0e0' }], margin: [0, 4, 0, 0] },
  ]
}

// Função reutilizável para verificar token (header OU query string)
async function verificarToken(app, request, reply) {
  const tokenQuery = request.query?.token
  if (tokenQuery) {
    try {
      request.user = app.jwt.verify(tokenQuery)
      return true
    } catch {
      reply.status(401).send({ error: 'Token inválido.' })
      return false
    }
  }
  try {
    await request.jwtVerify()
    return true
  } catch {
    reply.status(401).send({ error: 'Token inválido ou expirado.' })
    return false
  }
}

export async function pdfRoutes(app) {

  // GET /pdf/prontuario/:prontuarioId
  app.get('/prontuario/:prontuarioId', async (request, reply) => {
    if (!await verificarToken(app, request, reply)) return

    const prontuario = await prisma.prontuario.findUnique({
      where: { id: request.params.prontuarioId },
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

    const { consulta } = prontuario
    const { animal } = consulta
    const { tutor } = animal
    const vet = consulta.veterinario
    const idade = calcularIdade(animal.dataNascimento)

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],

      defaultStyle: { font: 'Roboto' },

      header: {
        columns: [
          {
            stack: [
              { text: 'CLÍNICA VETERINÁRIA', style: 'nomeClinica' },
              { text: vet.crmv ? `CRMV: ${vet.crmv}` : '', style: 'subClinica' },
            ],
            margin: [40, 20, 0, 0],
          },
          {
            text: `Prontuário #${prontuario.id.substring(0, 8).toUpperCase()}`,
            style: 'numeroProntuario',
            alignment: 'right',
            margin: [0, 20, 40, 0],
          },
        ],
      },

      footer: (currentPage, pageCount) => ({
        columns: [
          { text: `Emitido em ${formatarData(new Date())}`, style: 'rodape', margin: [40, 0, 0, 0] },
          { text: `Página ${currentPage}/${pageCount}`, style: 'rodape', alignment: 'right', margin: [0, 0, 40, 0] },
        ],
      }),

      content: [
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'DADOS DO PACIENTE', style: 'tituloSecao', colSpan: 2, fillColor: '#f5f5f5', border: [false, false, false, false] },
                {},
              ],
              [
                {
                  stack: [
                    { text: 'Paciente', style: 'labelCampo' },
                    { text: animal.nome, style: 'valorCampo' },
                    { text: 'Espécie / Raça', style: 'labelCampo', margin: [0, 6, 0, 0] },
                    { text: `${animal.especie} ${animal.raca ? '— ' + animal.raca : ''}`, style: 'valorCampo' },
                    { text: 'Sexo', style: 'labelCampo', margin: [0, 6, 0, 0] },
                    { text: `${animal.sexo}${animal.castrado ? ' (castrado/a)' : ''}`, style: 'valorCampo' },
                  ],
                  border: [false, false, false, false],
                },
                {
                  stack: [
                    { text: 'Tutor', style: 'labelCampo' },
                    { text: tutor.nome, style: 'valorCampo' },
                    { text: 'Telefone', style: 'labelCampo', margin: [0, 6, 0, 0] },
                    { text: tutor.telefone, style: 'valorCampo' },
                    ...(idade ? [
                      { text: 'Idade', style: 'labelCampo', margin: [0, 6, 0, 0] },
                      { text: `${idade}${prontuario.pesoConsulta ? ` — ${prontuario.pesoConsulta}kg` : ''}`, style: 'valorCampo' },
                    ] : []),
                  ],
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          margin: [0, 0, 0, 12],
        },

        {
          text: `Data: ${formatarData(consulta.dataHora)}   |   Tipo: ${consulta.tipo}   |   Motivo: ${consulta.motivoVisita ?? '—'}`,
          style: 'infoConsulta',
          margin: [0, 0, 0, 14],
        },

        ...(prontuario.temperatura || prontuario.frequenciaCardiaca || prontuario.frequenciaRespiratoria ? [{
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                { text: 'SINAIS VITAIS', style: 'tituloSecao', colSpan: 4, fillColor: '#f5f5f5', border: [false, false, false, false] },
                {}, {}, {},
              ],
              [
                { stack: [{ text: 'Temperatura', style: 'labelCampo' }, { text: prontuario.temperatura ? `${prontuario.temperatura}°C` : '—', style: 'valorCampo' }], border: [false, false, false, false] },
                { stack: [{ text: 'Freq. Cardíaca', style: 'labelCampo' }, { text: prontuario.frequenciaCardiaca ? `${prontuario.frequenciaCardiaca} bpm` : '—', style: 'valorCampo' }], border: [false, false, false, false] },
                { stack: [{ text: 'Freq. Resp.', style: 'labelCampo' }, { text: prontuario.frequenciaRespiratoria ? `${prontuario.frequenciaRespiratoria} rpm` : '—', style: 'valorCampo' }], border: [false, false, false, false] },
                { stack: [{ text: 'Peso', style: 'labelCampo' }, { text: prontuario.pesoConsulta ? `${prontuario.pesoConsulta} kg` : '—', style: 'valorCampo' }], border: [false, false, false, false] },
              ],
            ],
          },
          margin: [0, 0, 0, 12],
        }] : []),

        ...[
          secao('ANAMNESE', prontuario.anamnese),
          secao('ACHADOS DO EXAME CLÍNICO', [
            prontuario.mucosas       ? `Mucosas: ${prontuario.mucosas}` : null,
            prontuario.hidratacao    ? `Hidratação: ${prontuario.hidratacao}` : null,
            prontuario.ausculta      ? `Ausculta: ${prontuario.ausculta}` : null,
            prontuario.exameAbdome   ? `Abdome: ${prontuario.exameAbdome}` : null,
            prontuario.outrosAchados ? `Outros: ${prontuario.outrosAchados}` : null,
          ].filter(Boolean).join('\n') || null),
          secao('DIAGNÓSTICO', prontuario.diagnostico || prontuario.diagnosticoSuspeito
            ? [prontuario.diagnostico, prontuario.diagnosticoSuspeito ? `(suspeita: ${prontuario.diagnosticoSuspeito})` : null].filter(Boolean).join(' ')
            : null),
          secao('EXAMES SOLICITADOS', prontuario.examesSolicitados),
          secao('RESULTADOS DE EXAMES', prontuario.resultadosExames),
          secao('PRESCRIÇÃO / RECEITUÁRIO', prontuario.prescricao),
          secao('TRATAMENTO REALIZADO', prontuario.tratamento),
          secao('ORIENTAÇÕES AO TUTOR', prontuario.orientacoes),
          prontuario.retorno ? secao('RETORNO', prontuario.retorno) : null,
        ].filter(Boolean).flat(),

        {
          columns: [
            { text: '', width: '*' },
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#333' }], margin: [0, 40, 0, 4] },
                { text: vet.nome, style: 'assinaturaNome', alignment: 'center' },
                { text: vet.crmv ? `CRMV: ${vet.crmv}` : 'Médica Veterinária', style: 'assinaturaCrmv', alignment: 'center' },
              ],
              width: 200,
            },
          ],
          margin: [0, 30, 0, 0],
        },
      ],

      styles: {
        nomeClinica:      { fontSize: 14, bold: true, color: '#1a1a2e' },
        subClinica:       { fontSize: 9, color: '#666' },
        numeroProntuario: { fontSize: 9, color: '#999' },
        tituloSecao:      { fontSize: 9, bold: true, color: '#555', margin: [4, 4, 4, 4] },
        labelCampo:       { fontSize: 8, color: '#888', margin: [0, 0, 0, 1] },
        valorCampo:       { fontSize: 11, bold: true, color: '#1a1a1a' },
        subtitulo:        { fontSize: 10, bold: true, color: '#2c5282', decoration: 'underline' },
        corpo:            { fontSize: 10, color: '#333', lineHeight: 1.5 },
        infoConsulta:     { fontSize: 9, color: '#555', italics: true },
        assinaturaNome:   { fontSize: 10, bold: true },
        assinaturaCrmv:   { fontSize: 9, color: '#555' },
        rodape:           { fontSize: 8, color: '#aaa' },
      },

      defaultStyle: { font: 'Roboto' },
    }

    try {
  const printer = new PdfPrinter(fonts)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  reply.raw.setHeader('Access-Control-Allow-Origin', '*')
  reply.raw.setHeader('Content-Type', 'application/pdf')
  reply.raw.setHeader(
    'Content-Disposition',
    `inline; filename="prontuario-${animal.nome}.pdf"`
  )

  pdfDoc.pipe(reply.raw)
  pdfDoc.end()

  return reply.hijack()
} catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Erro ao gerar PDF.' })
    }
  })

  // GET /pdf/receita/:prontuarioId
  app.get('/receita/:prontuarioId', async (request, reply) => {
    if (!await verificarToken(app, request, reply)) return

    const prontuario = await prisma.prontuario.findUnique({
      where: { id: request.params.prontuarioId },
      include: {
        consulta: {
          include: {
            animal: { include: { tutor: true } },
            veterinario: { select: { nome: true, crmv: true } },
          },
        },
      },
    })

    if (!prontuario?.prescricao) {
      return reply.status(404).send({ error: 'Receita não encontrada.' })
    }

    const { animal } = prontuario.consulta
    const vet = prontuario.consulta.veterinario

    const docDefinition = {
      pageSize: 'A5',
      pageMargins: [40, 50, 40, 50],
      defaultStyle: { font: 'Roboto' },
      content: [
        { text: 'CLÍNICA VETERINÁRIA', style: 'cabecalho', alignment: 'center' },
        { text: vet.crmv ? `CRMV: ${vet.crmv}` : '', style: 'subcabecalho', alignment: 'center' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 355, y2: 0, lineWidth: 1, lineColor: '#333' }], margin: [0, 8, 0, 8] },
        { text: `Paciente: ${animal.nome} | Tutor: ${animal.tutor.nome}`, style: 'paciente' },
        { text: `Data: ${formatarData(prontuario.consulta.dataHora)}`, style: 'paciente', margin: [0, 2, 0, 16] },
        { text: 'RECEITUÁRIO', style: 'tituloReceita', alignment: 'center', margin: [0, 0, 0, 12] },
        { text: prontuario.prescricao, style: 'receita' },
        {
          columns: [
            { text: '', width: '*' },
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: '#333' }], margin: [0, 50, 0, 4] },
                { text: vet.nome, fontSize: 9, bold: true, alignment: 'center' },
                { text: vet.crmv ? `CRMV: ${vet.crmv}` : '', fontSize: 8, color: '#555', alignment: 'center' },
              ],
              width: 150,
            },
          ],
        },
      ],
      styles: {
        cabecalho:    { fontSize: 13, bold: true },
        subcabecalho: { fontSize: 9, color: '#666' },
        paciente:     { fontSize: 9, color: '#444' },
        tituloReceita:{ fontSize: 11, bold: true },
        receita:      { fontSize: 11, lineHeight: 1.8 },
      },
    }

   try {
  const printer = new PdfPrinter(fonts)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  reply.raw.setHeader('Access-Control-Allow-Origin', '*')
  reply.raw.setHeader('Content-Type', 'application/pdf')
  reply.raw.setHeader(
    'Content-Disposition',
    `inline; filename="receita-${animal.nome}.pdf"`
  )

  pdfDoc.pipe(reply.raw)
  pdfDoc.end()

  return reply.hijack()

} catch (err) {
  console.error(err)
  return reply.status(500).send({ error: 'Erro ao gerar receita.' })
}
  })
} 
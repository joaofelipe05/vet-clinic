// src/routes/documentos.js
import { PrismaClient } from '@prisma/client'
import PdfPrinter from 'pdfmake'
import { z } from 'zod'

const prisma = new PrismaClient()

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },

}

function fmt(data) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
}

function moeda(v) {
  return `R$ ${(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

async function verificarToken(app, request, reply) {
  const tokenQuery = request.query?.token
  if (tokenQuery) {
    try { request.user = app.jwt.verify(tokenQuery); return true }
    catch { reply.status(401).send({ error: 'Token inválido.' }); return false }
  }
  try { await request.jwtVerify(); return true }
  catch { reply.status(401).send({ error: 'Token inválido ou expirado.' }); return false }
}

export async function documentosRoutes(app) {

  // GET /documentos/recibo/:consultaId — recibo não fiscal completo
  app.get('/recibo/:consultaId', async (request, reply) => {
    if (!await verificarToken(app, request, reply)) return

    const consulta = await prisma.consulta.findUnique({
      where: { id: request.params.consultaId },
      include: {
        animal: { include: { tutor: true } },
        veterinario: { select: { nome: true, crmv: true } },
        itensUsados: {
          where: { confirmado: true },
          include: { item: true },
        },
      },
    })

    if (!consulta) return reply.status(404).send({ error: 'Consulta não encontrada.' })

    const { animal, itensUsados, veterinario } = consulta
    const tutor = animal.tutor

    // Calcula total dos itens usados
    const totalItens = itensUsados.reduce((s, i) => s + (i.precoUnitario ?? 0) * i.quantidade, 0)
    const totalConsulta = consulta.valor ?? 0
    const totalGeral = totalConsulta + totalItens

    const linhasItens = itensUsados.map(i => ([
      { text: i.item.nome, fontSize: 10, color: '#333' },
      { text: `${i.quantidade} ${i.item.unidade}`, fontSize: 10, alignment: 'center', color: '#333' },
      { text: moeda(i.precoUnitario), fontSize: 10, alignment: 'right', color: '#333' },
      { text: moeda((i.precoUnitario ?? 0) * i.quantidade), fontSize: 10, alignment: 'right', color: '#333', bold: true },
    ]))

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 50, 40, 50],

      content: [
        // Cabeçalho
        {
          columns: [
            {
              stack: [
                { text: 'LUSTOSA VET', fontSize: 16, bold: true, color: '#0F6E56' },
                { text: 'Clínica Veterinária', fontSize: 10, color: '#666' },
                { text: veterinario.crmv ? `CRMV: ${veterinario.crmv}` : '', fontSize: 9, color: '#999' },
              ],
            },
            {
              stack: [
                { text: 'RECIBO DE ATENDIMENTO', fontSize: 12, bold: true, alignment: 'right', color: '#333' },
                { text: `Nº ${consulta.id.substring(0, 8).toUpperCase()}`, fontSize: 9, alignment: 'right', color: '#999' },
                { text: `Data: ${fmt(consulta.dataHora)}`, fontSize: 9, alignment: 'right', color: '#666' },
              ],
            },
          ],
          margin: [0, 0, 0, 16],
        },

        // Linha separadora
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#0F6E56' }], margin: [0, 0, 0, 12] },

        // Dados do cliente
        {
          columns: [
            {
              stack: [
                { text: 'CLIENTE', fontSize: 8, color: '#999', bold: true, margin: [0, 0, 0, 2] },
                { text: tutor.nome, fontSize: 11, bold: true },
                { text: `CPF: ${tutor.cpf ?? 'não informado'}`, fontSize: 9, color: '#666' },
                { text: `Tel: ${tutor.telefone}`, fontSize: 9, color: '#666' },
              ],
            },
            {
              stack: [
                { text: 'PACIENTE', fontSize: 8, color: '#999', bold: true, margin: [0, 0, 0, 2] },
                { text: animal.nome, fontSize: 11, bold: true },
                { text: `${animal.especie} · ${animal.raca ?? 'SRD'}`, fontSize: 9, color: '#666' },
                { text: `Tipo: ${consulta.tipo.replace('_', ' ')}`, fontSize: 9, color: '#666' },
              ],
            },
          ],
          margin: [0, 0, 0, 16],
        },

        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e0e0e0' }], margin: [0, 0, 0, 12] },

        // Tabela de serviços e itens
        {
          table: {
            widths: ['*', 70, 80, 80],
            headerRows: 1,
            body: [
              // Header
              [
                { text: 'Descrição', style: 'thTabela' },
                { text: 'Qtd', style: 'thTabela', alignment: 'center' },
                { text: 'Unit.', style: 'thTabela', alignment: 'right' },
                { text: 'Total', style: 'thTabela', alignment: 'right' },
              ],
              // Linha da consulta em si
              [
                { text: `Consulta veterinária — ${consulta.motivoVisita ?? consulta.tipo}`, fontSize: 10, color: '#333' },
                { text: '1 un', fontSize: 10, alignment: 'center', color: '#333' },
                { text: moeda(totalConsulta), fontSize: 10, alignment: 'right', color: '#333' },
                { text: moeda(totalConsulta), fontSize: 10, alignment: 'right', bold: true, color: '#333' },
              ],
              // Itens usados
              ...linhasItens,
            ],
          },
          layout: {
            hLineWidth: (i) => i === 0 || i === 1 ? 0.5 : 0.3,
            vLineWidth: () => 0,
            hLineColor: () => '#e0e0e0',
            fillColor: (i) => i === 0 ? '#f8f8f8' : null,
          },
          margin: [0, 0, 0, 0],
        },

        // Total geral
        {
          columns: [
            { text: '', width: '*' },
            {
              table: {
                widths: [120, 80],
                body: [
                  [
                    { text: 'TOTAL GERAL', fontSize: 11, bold: true, color: '#0F6E56', border: [false, true, false, false] },
                    { text: moeda(totalGeral), fontSize: 11, bold: true, alignment: 'right', color: '#0F6E56', border: [false, true, false, false] },
                  ],
                ],
              },
              layout: { hLineColor: () => '#0F6E56' },
            },
          ],
          margin: [0, 8, 0, 16],
        },

        // Forma de pagamento
        consulta.formaPagamento ? {
          text: `Forma de pagamento: ${consulta.formaPagamento.replace('_', ' ')}`,
          fontSize: 9, color: '#666', margin: [0, 0, 0, 16],
        } : {},

        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e0e0e0' }], margin: [0, 0, 0, 16] },

        // Assinatura + aviso
        {
          columns: [
            {
              stack: [
                { text: 'Este documento não possui valor fiscal.', fontSize: 8, color: '#999' },
                { text: 'Emitido pelo sistema Lustosa Vet.', fontSize: 8, color: '#999' },
              ],
            },
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5, lineColor: '#333' }], margin: [0, 30, 0, 4] },
                { text: veterinario.nome, fontSize: 9, bold: true, alignment: 'center' },
                { text: veterinario.crmv ? `CRMV ${veterinario.crmv}` : 'Médica Veterinária', fontSize: 8, color: '#666', alignment: 'center' },
              ],
              width: 160,
            },
          ],
        },
      ],

      styles: {
        thTabela: { fontSize: 9, bold: true, color: '#555', fillColor: '#f8f8f8' },
      },

      defaultStyle: { font: 'Roboto' },
    }

    try {
      const printer = new PdfPrinter(fonts)
      const pdfDoc = printer.createPdfKitDocument(docDefinition)
      reply.raw.setHeader('Access-Control-Allow-Origin', '*')
      reply.raw.setHeader('Content-Type', 'application/pdf')
      reply.raw.setHeader('Content-Disposition', `inline; filename="recibo-${animal.nome.toLowerCase()}-${consulta.id.substring(0,8)}.pdf"`)
      pdfDoc.pipe(reply.raw)
      pdfDoc.end()
      return reply.hijack()
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Erro ao gerar recibo.' })
    }
  })

  // GET /documentos/nfse-modelo/:consultaId — modelo preenchido de NFS-e para MEI
  app.get('/nfse-modelo/:consultaId', async (request, reply) => {
    if (!await verificarToken(app, request, reply)) return

    const consulta = await prisma.consulta.findUnique({
      where: { id: request.params.consultaId },
      include: {
        animal: { include: { tutor: true } },
        veterinario: { select: { nome: true, crmv: true } },
        itensUsados: {
          where: { confirmado: true },
          include: { item: true },
        },
      },
    })

    if (!consulta) return reply.status(404).send({ error: 'Consulta não encontrada.' })

    const { animal, itensUsados, veterinario } = consulta
    const tutor = animal.tutor
    const totalItens = itensUsados.reduce((s, i) => s + (i.precoUnitario ?? 0) * i.quantidade, 0)
    const totalGeral = (consulta.valor ?? 0) + totalItens

    const descricaoServico = [
      `Atendimento veterinário — ${consulta.tipo.replace('_', ' ')}`,
      consulta.motivoVisita ? `Motivo: ${consulta.motivoVisita}` : '',
      `Paciente: ${animal.nome} (${animal.especie})`,
      itensUsados.length > 0
        ? `Materiais/medicamentos utilizados: ${itensUsados.map(i => `${i.item.nome} (${i.quantidade} ${i.item.unidade})`).join(', ')}`
        : '',
    ].filter(Boolean).join('. ')

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 50, 40, 50],

      content: [
        { text: 'MODELO PARA EMISSÃO DE NFS-e (MEI)', fontSize: 14, bold: true, color: '#0F6E56', margin: [0, 0, 0, 4] },
        { text: 'Preencha o portal da prefeitura com os dados abaixo', fontSize: 10, color: '#666', margin: [0, 0, 0, 20] },

        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#0F6E56' }], margin: [0, 0, 0, 16] },

        // Dados do prestador
        { text: 'DADOS DO PRESTADOR DE SERVIÇO (VOCÊ)', fontSize: 10, bold: true, color: '#0F6E56', margin: [0, 0, 0, 8] },
        {
          table: {
            widths: [140, '*'],
            body: [
              [{ text: 'Nome/Razão Social', style: 'label' }, { text: 'Lustosa Vet — [seu nome completo]', style: 'valor' }],
              [{ text: 'CPF/CNPJ', style: 'label' }, { text: '[seu CNPJ MEI]', style: 'valor' }],
              [{ text: 'CRMV', style: 'label' }, { text: veterinario.crmv ?? '[seu CRMV]', style: 'valor' }],
              [{ text: 'Endereço', style: 'label' }, { text: '[endereço da clínica]', style: 'valor' }],
            ],
          },
          layout: { hLineWidth: () => 0.3, vLineWidth: () => 0, hLineColor: () => '#e0e0e0' },
          margin: [0, 0, 0, 16],
        },

        // Dados do tomador
        { text: 'DADOS DO TOMADOR (CLIENTE)', fontSize: 10, bold: true, color: '#0F6E56', margin: [0, 0, 0, 8] },
        {
          table: {
            widths: [140, '*'],
            body: [
              [{ text: 'Nome', style: 'label' }, { text: tutor.nome, style: 'valor' }],
              [{ text: 'CPF', style: 'label' }, { text: tutor.cpf ?? 'Não informado', style: 'valor' }],
              [{ text: 'Telefone', style: 'label' }, { text: tutor.telefone, style: 'valor' }],
              [{ text: 'E-mail', style: 'label' }, { text: tutor.email ?? 'Não informado', style: 'valor' }],
            ],
          },
          layout: { hLineWidth: () => 0.3, vLineWidth: () => 0, hLineColor: () => '#e0e0e0' },
          margin: [0, 0, 0, 16],
        },

        // Dados do serviço
        { text: 'DADOS DO SERVIÇO', fontSize: 10, bold: true, color: '#0F6E56', margin: [0, 0, 0, 8] },
        {
          table: {
            widths: [140, '*'],
            body: [
              [{ text: 'Data de competência', style: 'label' }, { text: fmt(consulta.dataHora), style: 'valor' }],
              [{ text: 'Código do serviço', style: 'label' }, { text: '0801 — Serviços veterinários', style: 'valor' }],
              [{ text: 'Descrição', style: 'label' }, { text: descricaoServico, style: 'valor' }],
              [{ text: 'Valor do serviço', style: 'label' }, { text: moeda(totalGeral), style: 'valorDestaque' }],
              [{ text: 'Deduções / Descontos', style: 'label' }, { text: 'R$ 0,00', style: 'valor' }],
              [{ text: 'Base de cálculo', style: 'label' }, { text: moeda(totalGeral), style: 'valor' }],
              [{ text: 'ISS (MEI — isento)', style: 'label' }, { text: 'R$ 0,00', style: 'valor' }],
              [{ text: 'Valor líquido', style: 'label' }, { text: moeda(totalGeral), style: 'valorDestaque' }],
            ],
          },
          layout: { hLineWidth: () => 0.3, vLineWidth: () => 0, hLineColor: () => '#e0e0e0' },
          margin: [0, 0, 0, 16],
        },

        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e0e0e0' }], margin: [0, 0, 0, 12] },

        {
          stack: [
            { text: '⚠️  Como emitir no portal da prefeitura:', fontSize: 10, bold: true, margin: [0, 0, 0, 6] },
            { text: '1. Acesse o portal de NFS-e da sua prefeitura', fontSize: 9, color: '#555', margin: [0, 0, 0, 3] },
            { text: '2. Entre com seu CNPJ MEI e senha', fontSize: 9, color: '#555', margin: [0, 0, 0, 3] },
            { text: '3. Clique em "Emitir NFS-e" e preencha com os dados acima', fontSize: 9, color: '#555', margin: [0, 0, 0, 3] },
            { text: '4. No campo serviço, use o código 0801 — Serviços veterinários', fontSize: 9, color: '#555', margin: [0, 0, 0, 3] },
            { text: '5. Cole a descrição do serviço no campo correspondente', fontSize: 9, color: '#555', margin: [0, 0, 0, 3] },
            { text: '6. Confirme e envie a NFS-e ao cliente', fontSize: 9, color: '#555' },
          ],
          fillColor: '#f8f8f8',
          margin: [0, 0, 0, 0],
        },
      ],

      styles: {
        label:         { fontSize: 9, color: '#888', margin: [4, 4, 4, 4] },
        valor:         { fontSize: 10, color: '#333', margin: [4, 4, 4, 4] },
        valorDestaque: { fontSize: 10, bold: true, color: '#0F6E56', margin: [4, 4, 4, 4] },
      },

      defaultStyle: { font: 'Roboto' },
    }

    try {
      const printer = new PdfPrinter(fonts)
      const pdfDoc = printer.createPdfKitDocument(docDefinition)
      reply.raw.setHeader('Access-Control-Allow-Origin', '*')
      reply.raw.setHeader('Content-Type', 'application/pdf')
      reply.raw.setHeader('Content-Disposition', `inline; filename="nfse-modelo-${consulta.id.substring(0,8)}.pdf"`)
      pdfDoc.pipe(reply.raw)
      pdfDoc.end()
      return reply.hijack()
    } catch (err) {
      return reply.status(500).send({ error: 'Erro ao gerar modelo NFS-e.' })
    }
  })
}
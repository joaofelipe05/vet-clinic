// src/pages/Relatorios.jsx
import { useEffect, useState } from 'react'
import {
  CalendarDays, PawPrint, TrendingUp, DollarSign,
  XCircle, BarChart2, Award, Clock
} from 'lucide-react'
import { api } from '../lib/api.js'
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const TIPO_LABEL = {
  CONSULTA:'Consulta', RETORNO:'Retorno', CIRURGIA:'Cirurgia',
  EMERGENCIA:'Emergência', VACINA:'Vacina', EXAME:'Exame', BANHO_TOSA:'Banho/Tosa',
}
const TIPO_COR = {
  CONSULTA:'bg-blue-50 text-blue-700', RETORNO:'bg-purple-50 text-purple-700',
  CIRURGIA:'bg-red-50 text-red-700', EMERGENCIA:'bg-red-100 text-red-800',
  VACINA:'bg-esmeralda-50 text-esmeralda-700', EXAME:'bg-amber-50 text-amber-700',
  BANHO_TOSA:'bg-pink-50 text-pink-700',
}
const ESPECIE_EMOJI = { CACHORRO:'🐕', GATO:'🐈', AVE:'🦜', REPTIL:'🦎', ROEDOR:'🐭', COELHO:'🐰', OUTRO:'🐾' }

const PERIODOS = [
  { label: 'Este mês',       getRange: () => ({ inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), fim: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Últimos 7 dias', getRange: () => ({ inicio: format(subDays(new Date(), 7), 'yyyy-MM-dd'),   fim: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Últimos 30 dias',getRange: () => ({ inicio: format(subDays(new Date(), 30), 'yyyy-MM-dd'),  fim: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Este ano',       getRange: () => ({ inicio: format(startOfYear(new Date()), 'yyyy-MM-dd'),  fim: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Personalizado',  getRange: null },
]

function Stat({ icon: Icon, label, value, sub, cor }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cor}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-2xl font-semibold text-gray-900 leading-none mb-1">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// Gráfico de barras simples em SVG
function GraficoBarras({ dados, label }) {
  if (!dados?.length) return (
    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Sem dados</div>
  )
  const max = Math.max(...dados.map(d => d.total), 1)
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1.5 h-32 min-w-max px-1">
        {dados.map((d, i) => {
          const altura = Math.max((d.total / max) * 112, 4)
          const dia = d.dia ? format(new Date(d.dia), 'dd/MM') : d.label
          return (
            <div key={i} className="flex flex-col items-center gap-1 group" style={{ minWidth: 28 }}>
              <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                {d.total}
              </div>
              <div
                className="w-5 rounded-t-sm bg-esmeralda-400 group-hover:bg-esmeralda-600 transition-colors"
                style={{ height: altura }}
              />
              <div className="text-[9px] text-gray-400 rotate-0">{dia}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Relatorios() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [periodoIdx, setPeriodoIdx] = useState(0)
  const [customInicio, setCustomInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customFim,    setCustomFim]    = useState(format(new Date(), 'yyyy-MM-dd'))

  async function carregar(inicio, fim) {
    setLoading(true)
    try {
      const res = await api.get(`/relatorios?inicio=${inicio}&fim=${fim}`)
      setDados(res)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const p = PERIODOS[periodoIdx]
    if (p.getRange) {
      const { inicio, fim } = p.getRange()
      carregar(inicio, fim)
    }
  }, [periodoIdx])

  function aplicarPersonalizado() {
    carregar(customInicio, customFim)
  }

  const periodoLabel = dados
    ? `${format(new Date(dados.periodo.inicio), "d 'de' MMM", { locale: ptBR })} — ${format(new Date(dados.periodo.fim), "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
    : ''

  return (
    <div className="animate-slide-up">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{periodoLabel}</p>
        </div>
      </div>

      {/* Seletor de período */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODOS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriodoIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                periodoIdx === i
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Datas personalizadas */}
        {periodoIdx === 4 && (
          <div className="flex items-center gap-2">
            <input type="date" className="input-base py-1.5 text-sm w-36"
              value={customInicio} onChange={e => setCustomInicio(e.target.value)} />
            <span className="text-gray-400 text-sm">até</span>
            <input type="date" className="input-base py-1.5 text-sm w-36"
              value={customFim} onChange={e => setCustomFim(e.target.value)} />
            <button onClick={aplicarPersonalizado} className="btn-primary py-1.5 text-xs">
              Aplicar
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>
      ) : !dados ? null : (
        <>
          {/* Cards de métricas principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat
              icon={CalendarDays} label="Atendimentos" cor="bg-blue-50 text-blue-600"
              value={dados.totalConsultas}
              sub={`${dados.cancelamentos} cancelamento${dados.cancelamentos !== 1 ? 's' : ''}`}
            />
            <Stat
              icon={PawPrint} label="Pacientes atendidos" cor="bg-purple-50 text-purple-600"
              value={dados.totalPacientesAtendidos}
              sub="pacientes únicos"
            />
            <Stat
              icon={DollarSign} label="Faturamento recebido" cor="bg-esmeralda-50 text-esmeralda-600"
              value={`R$ ${(dados.faturamentoRecebido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              sub={dados.faturamentoBruto > dados.faturamentoRecebido
                ? `R$ ${(dados.faturamentoBruto - dados.faturamentoRecebido).toLocaleString('pt-BR', { minimumFractionDigits: 0 })} a receber`
                : 'tudo recebido ✓'}
            />
            <Stat
              icon={TrendingUp} label="Ticket médio" cor="bg-amber-50 text-amber-600"
              value={`R$ ${Math.round(dados.ticketMedio ?? 0).toLocaleString('pt-BR')}`}
              sub="por consulta"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Gráfico de atendimentos por dia */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <BarChart2 size={15} className="text-esmeralda-600" />
                Atendimentos por dia
              </h2>
              <GraficoBarras dados={dados.consultasPorDia} />
            </div>

            {/* Tipos de atendimento */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Clock size={15} className="text-esmeralda-600" />
                Por tipo de atendimento
              </h2>
              {dados.consultasPorTipo.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-8">Sem dados</div>
              ) : (
                <div className="space-y-2.5">
                  {dados.consultasPorTipo.map(({ tipo, total }) => {
                    const pct = Math.round((total / dados.totalConsultas) * 100)
                    return (
                      <div key={tipo}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`badge text-[10px] ${TIPO_COR[tipo] ?? 'bg-gray-50 text-gray-600'}`}>
                            {TIPO_LABEL[tipo] ?? tipo}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">{total} · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-esmeralda-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top pacientes mais atendidos */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Award size={15} className="text-esmeralda-600" />
              Pacientes mais atendidos no período
            </h2>
            {dados.topAnimais.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8">Sem dados</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {dados.topAnimais.map((a, i) => (
                  <div key={a.id ?? i} className="flex items-center gap-3 py-3 px-2">
                    <div className="w-6 text-center text-xs font-semibold text-gray-400">#{i + 1}</div>
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-base flex-shrink-0">
                      {ESPECIE_EMOJI[a.especie] ?? '🐾'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{a.nome}</div>
                      <div className="text-xs text-gray-400">{a.tutor?.nome}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-esmeralda-700">{a.totalConsultas}</div>
                      <div className="text-xs text-gray-400">consulta{a.totalConsultas !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Taxa de cancelamento */}
          {dados.cancelamentos > 0 && (
            <div className="card mt-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <XCircle size={18} className="text-red-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {dados.cancelamentos} cancelamento{dados.cancelamentos !== 1 ? 's' : ''} no período
                </div>
                <div className="text-xs text-gray-400">
                  Taxa de cancelamento: {dados.taxaCancelamento}% dos agendamentos
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
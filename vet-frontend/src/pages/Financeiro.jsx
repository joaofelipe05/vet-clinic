// src/pages/Financeiro.jsx
import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, CalendarDays, CheckCircle, Clock, ChevronDown } from 'lucide-react'
import { api } from '../lib/api.js'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const FORMA_LABEL = {
  DINHEIRO:'Dinheiro', CARTAO_DEBITO:'Débito', CARTAO_CREDITO:'Crédito', PIX:'Pix', BOLETO:'Boleto',
}
const FORMA_COR = {
  DINHEIRO:'bg-esmeralda-50 text-esmeralda-700',
  PIX:'bg-blue-50 text-blue-700',
  CARTAO_DEBITO:'bg-purple-50 text-purple-700',
  CARTAO_CREDITO:'bg-purple-50 text-purple-700',
  BOLETO:'bg-amber-50 text-amber-700',
}

export default function Financeiro() {
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const hoje = new Date()

  const recebido = consultas.filter(c => c.pago).reduce((s, c) => s + (c.valor ?? 0), 0)
  const aReceber = consultas.filter(c => !c.pago && c.status !== 'CANCELADA').reduce((s, c) => s + (c.valor ?? 0), 0)
  const total = consultas.filter(c => c.status !== 'CANCELADA').length

  async function carregar() {
    setLoading(true)
    try {
      const inicio = format(startOfMonth(hoje), 'yyyy-MM-dd')
      const fim    = format(endOfMonth(hoje),   'yyyy-MM-dd')
      const res = await api.get(`/consultas?dataInicio=${inicio}&dataFim=${fim}&limite=100`)
      setConsultas(Array.isArray(res) ? res : [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function registrarPagamento(consultaId, forma) {
    try {
      await api.patch(`/consultas/${consultaId}/pagamento`, { pago: true, formaPagamento: forma })
      toast.success('Pagamento registrado!')
      setEditandoId(null)
      carregar()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function desfazerPagamento(consultaId) {
    try {
      await api.patch(`/consultas/${consultaId}/pagamento`, { pago: false })
      toast.success('Pagamento desfeito')
      carregar()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">
          {format(hoje, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-esmeralda-50 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-esmeralda-600" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            R$ {recebido.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-gray-500 mt-1">Recebido no mês</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-gray-500 mt-1">A receber</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <CalendarDays size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">{total}</div>
          <div className="text-sm text-gray-500 mt-1">Atendimentos</div>
        </div>
      </div>

      {/* Tabela de consultas */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <DollarSign size={16} className="text-esmeralda-600" />
          Atendimentos do mês
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
        ) : consultas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhum atendimento este mês</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="grid grid-cols-[1fr_140px_100px_120px_100px] gap-3 pb-2 px-2">
              {['Paciente / tutor','Data','Valor','Forma','Status'].map(h => (
                <div key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</div>
              ))}
            </div>

            {consultas.map(c => (
              <div key={c.id} className="grid grid-cols-[1fr_140px_100px_120px_100px] gap-3 py-3 px-2 items-center hover:bg-gray-50 rounded-xl transition-colors">
                {/* Paciente */}
                <div>
                  <div className="text-sm font-medium text-gray-900">{c.animal?.nome}</div>
                  <div className="text-xs text-gray-400">{c.animal?.tutor?.nome}</div>
                </div>

                {/* Data */}
                <div className="text-sm text-gray-600">
                  {format(new Date(c.dataHora), "dd/MM · HH:mm")}
                </div>

                {/* Valor */}
                <div className="text-sm font-medium text-gray-900">
                  {c.valor ? `R$ ${c.valor.toLocaleString('pt-BR')}` : <span className="text-gray-400">—</span>}
                </div>

                {/* Forma de pagamento */}
                <div>
                  {c.pago && c.formaPagamento ? (
                    <span className={`badge text-[10px] ${FORMA_COR[c.formaPagamento] ?? 'bg-gray-50 text-gray-500'}`}>
                      {FORMA_LABEL[c.formaPagamento]}
                    </span>
                  ) : (
                    editandoId === c.id ? (
                      <div className="flex flex-wrap gap-1">
                        {['PIX','DINHEIRO','CARTAO_DEBITO','CARTAO_CREDITO'].map(f => (
                          <button key={f}
                            onClick={() => registrarPagamento(c.id, f)}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-esmeralda-100 text-gray-600 hover:text-esmeralda-700 transition-colors">
                            {FORMA_LABEL[f]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )
                  )}
                </div>

                {/* Status pagamento */}
                <div>
                  {c.pago ? (
                    <button onClick={() => desfazerPagamento(c.id)}
                      className="flex items-center gap-1 text-xs text-esmeralda-600 hover:text-red-500 transition-colors group">
                      <CheckCircle size={13} />
                      <span className="group-hover:hidden">Pago</span>
                      <span className="hidden group-hover:inline text-red-500">Desfazer</span>
                    </button>
                  ) : c.status === 'CANCELADA' ? (
                    <span className="text-xs text-gray-400">Cancelada</span>
                  ) : (
                    <button onClick={() => setEditandoId(id => id === c.id ? null : c.id)}
                      className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 transition-colors">
                      <Clock size={13} /> Receber
                      <ChevronDown size={11} className={editandoId === c.id ? 'rotate-180' : ''} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

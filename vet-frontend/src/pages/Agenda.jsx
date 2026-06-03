// src/pages/Agenda.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import { api } from '../lib/api.js'
import { format, addDays, subDays, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import ModalNovaConsulta from '../components/ui/ModalNovaConsulta.jsx'

const STATUS_MAP = {
  AGENDADA:       { label: 'Agendada',       cor: 'bg-blue-50 text-blue-700 border-blue-200' },
  EM_ATENDIMENTO: { label: 'Em atendimento', cor: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONCLUIDA:      { label: 'Concluída',      cor: 'bg-esmeralda-50 text-esmeralda-700 border-esmeralda-200' },
  CANCELADA:      { label: 'Cancelada',      cor: 'bg-red-50 text-red-600 border-red-200' },
  NAO_COMPARECEU: { label: 'Não compareceu', cor: 'bg-gray-50 text-gray-500 border-gray-200' },
}

const TIPO_EMOJI = { CONSULTA:'🩺',RETORNO:'🔄',CIRURGIA:'⚕️',EMERGENCIA:'🚨',VACINA:'💉',EXAME:'🔬',BANHO_TOSA:'🛁' }

export default function Agenda() {
  const [data, setData] = useState(new Date())
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const navigate = useNavigate()

  async function carregar(d) {
    setLoading(true)
    try {
      const iso = format(d, 'yyyy-MM-dd')
      const res = await api.get(`/consultas?data=${iso}`)
      setConsultas(res)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar(data) }, [data])

  function navegar(dias) {
    const nova = dias > 0 ? addDays(data, dias) : subDays(data, Math.abs(dias))
    setData(nova)
  }

  return (
    <div className="animate-slide-up">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {format(data, "EEEE, d 'de' MMMM", { locale: ptBR })}
            {isToday(data) && <span className="ml-2 badge bg-esmeralda-50 text-esmeralda-700">Hoje</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navegar(-1)} className="btn-secondary px-3">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setData(new Date())} className="btn-secondary text-xs px-3">
            Hoje
          </button>
          <button onClick={() => navegar(1)} className="btn-secondary px-3">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setModalAberto(true)} className="btn-primary ml-2">
            <Plus size={16} /> Nova consulta
          </button>
        </div>
      </div>

      {/* Lista de consultas */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
        ) : consultas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhuma consulta para este dia</p>
            <button onClick={() => setModalAberto(true)} className="btn-primary mt-4">
              <Plus size={16} /> Agendar consulta
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {consultas.map(c => {
              const st = STATUS_MAP[c.status] ?? STATUS_MAP.AGENDADA
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                  onClick={() => navigate(`/prontuario/${c.id}`)}
                >
                  {/* Horário */}
                  <div className="w-16 text-center flex-shrink-0">
                    <div className="text-base font-semibold text-gray-800">
                      {format(new Date(c.dataHora), 'HH:mm')}
                    </div>
                  </div>

                  {/* Tipo emoji */}
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                    {TIPO_EMOJI[c.tipo] ?? '🩺'}
                  </div>

                  {/* Dados */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{c.animal?.nome}</span>
                      <span className="text-xs text-gray-400">{c.animal?.especie?.toLowerCase()}</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {c.animal?.tutor?.nome}
                      {c.motivoVisita && <span className="text-gray-400"> · {c.motivoVisita}</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`badge border ${st.cor}`}>{st.label}</span>
                    {c.prontuario?.id ? (
                      <span className="text-xs text-esmeralda-600 font-medium">Prontuário ✓</span>
                    ) : (
                      <span className="text-xs text-gray-400">Sem prontuário</span>
                    )}
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalAberto && (
        <ModalNovaConsulta
          dataInicial={data}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar(data) }}
        />
      )}
    </div>
  )
}

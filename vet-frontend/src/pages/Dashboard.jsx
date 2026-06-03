// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, PawPrint, Syringe, DollarSign, Clock, ChevronRight } from 'lucide-react'
import { api } from '../lib/api.js'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_MAP = {
  AGENDADA:       { label: 'Agendada',       cor: 'bg-blue-50 text-blue-700' },
  EM_ATENDIMENTO: { label: 'Em atendimento', cor: 'bg-amber-50 text-amber-700' },
  CONCLUIDA:      { label: 'Concluída',      cor: 'bg-esmeralda-50 text-esmeralda-700' },
  CANCELADA:      { label: 'Cancelada',      cor: 'bg-red-50 text-red-600' },
}

const TIPO_MAP = {
  CONSULTA:   '🩺', RETORNO: '🔄', CIRURGIA: '⚕️',
  EMERGENCIA: '🚨', VACINA:  '💉', EXAME:    '🔬', BANHO_TOSA: '🛁',
}

function Stat({ icon: Icon, label, value, cor, sub }) {
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

export default function Dashboard() {
  const [dados, setDados] = useState(null)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('vet_user') ?? '{}')
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => {
    api.get('/dashboard').then(setDados).catch(console.error)
  }, [])

  if (!dados) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Carregando...
    </div>
  )

  return (
    <div className="animate-slide-up">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          {saudacao}, {user.nome?.split(' ')[0] ?? 'Doutora'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={CalendarDays} label="Consultas hoje"  value={dados.consultasHoje}  cor="bg-blue-50 text-blue-600" />
        <Stat icon={PawPrint}     label="Pacientes ativos" value={dados.totalAnimais}  cor="bg-purple-50 text-purple-600" />
        <Stat icon={Syringe}      label="Alertas de vacina" value={dados.vacinasAlerta} cor="bg-amber-50 text-amber-600"
              sub={dados.vacinasAlerta > 0 ? 'vencendo em 30 dias' : 'tudo em dia ✓'} />
        <Stat icon={DollarSign}   label="Faturamento do mês" cor="bg-esmeralda-50 text-esmeralda-600"
              value={`R$ ${(dados.faturamentoMes ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} />
      </div>

      {/* Agenda do dia */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} className="text-esmeralda-600" />
            Próximas consultas
          </h2>
          <button onClick={() => navigate('/agenda')} className="btn-ghost text-xs">
            Ver agenda completa <ChevronRight size={14} />
          </button>
        </div>

        {dados.proximasConsultas.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma consulta agendada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dados.proximasConsultas.map(c => {
              const status = STATUS_MAP[c.status] ?? STATUS_MAP.AGENDADA
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/prontuario/${c.id}`)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="text-center w-14 flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-800">
                      {format(new Date(c.dataHora), 'HH:mm')}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-esmeralda-50 flex items-center justify-center text-base flex-shrink-0">
                    {TIPO_MAP[c.tipo] ?? '🩺'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.animal?.nome}</div>
                    <div className="text-xs text-gray-400 truncate">{c.animal?.tutor?.nome}</div>
                  </div>
                  <span className={`badge ${status.cor} flex-shrink-0`}>{status.label}</span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// src/pages/PacienteDetalhe.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Syringe, FileText, Phone, User, Weight, Calendar, AlertCircle, Edit2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import ModalNovaConsulta from '../components/ui/ModalNovaConsulta.jsx'
import ModalNovaVacina from '../components/ui/ModalNovaVacina.jsx'
import ModalEditarPaciente from '../components/ui/ModalEditarPaciente.jsx'

const ESPECIE_EMOJI = { CACHORRO:'🐕', GATO:'🐈', AVE:'🦜', REPTIL:'🦎', ROEDOR:'🐭', COELHO:'🐰', OUTRO:'🐾' }
const STATUS_COR = {
  AGENDADA:       'bg-blue-50 text-blue-700',
  EM_ATENDIMENTO: 'bg-amber-50 text-amber-700',
  CONCLUIDA:      'bg-esmeralda-50 text-esmeralda-700',
  CANCELADA:      'bg-red-50 text-red-500',
  NAO_COMPARECEU: 'bg-gray-50 text-gray-500',
}

function calcularIdade(dataNasc) {
  if (!dataNasc) return null
  const anos = Math.floor((new Date() - new Date(dataNasc)) / (365.25*24*3600*1000))
  if (anos === 0) {
    const meses = Math.floor((new Date() - new Date(dataNasc)) / (30.5*24*3600*1000))
    return `${meses} ${meses===1?'mês':'meses'}`
  }
  return `${anos} ${anos===1?'ano':'anos'}`
}

export default function PacienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [animal, setAnimal] = useState(null)
  const [aba, setAba] = useState('historico')
  const [modalConsulta, setModalConsulta] = useState(false)
  const [modalVacina, setModalVacina] = useState(false)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)

  async function carregar() {
    try {
      const a = await api.get(`/animais/${id}`)
      setAnimal(a)
    } catch (err) {
      toast.error('Erro ao carregar paciente')
      navigate('/pacientes')
    }
  }

  useEffect(() => { carregar() }, [id])

  if (!animal) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>
  )

  const idade = calcularIdade(animal.dataNascimento)
  const proximaVacina = animal.vacinas?.find(v => v.proximaDose && new Date(v.proximaDose) > new Date())

  return (
    <div className="animate-slide-up max-w-3xl">
      <button onClick={() => navigate('/pacientes')} className="btn-ghost mb-6 -ml-1">
        <ChevronLeft size={16} /> Pacientes
      </button>

      {/* Card do paciente */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-esmeralda-50 flex items-center justify-center text-3xl flex-shrink-0">
            {ESPECIE_EMOJI[animal.especie] ?? '🐾'}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold text-gray-900">{animal.nome}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {animal.especie?.toLowerCase()}
                  {animal.raca ? ` · ${animal.raca}` : ''}
                  {' · '}{animal.sexo?.toLowerCase()}
                  {animal.castrado ? ' · castrado(a)' : ''}
                </p>
              </div>
             <button className="btn-ghost"onClick={() => setModalEditarAberto(true)}>
              <Edit2 size={14} /> Editar
            </button>
            </div>

            {/* Dados rápidos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {idade && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={13} className="text-gray-400" />
                  {idade}
                </div>
              )}
              {animal.peso && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Weight size={13} className="text-gray-400" />
                  {animal.peso} kg
                </div>
              )}
              {animal.microchip && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 text-xs">chip</span>
                  {animal.microchip}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tutor */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={13} className="text-gray-400" />
            <span className="font-medium">{animal.tutor?.nome}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={13} className="text-gray-400" />
            {animal.tutor?.telefone}
          </div>
        </div>

        {/* Alertas */}
        {animal.alergias && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <div><strong>Alergias:</strong> {animal.alergias}</div>
          </div>
        )}
        {animal.observacoes && (
          <div className="mt-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
            <strong>Obs:</strong> {animal.observacoes}
          </div>
        )}
        {proximaVacina && (
          <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
            <Syringe size={14} />
            Próxima vacina: <strong>{proximaVacina.nome}</strong> em {format(new Date(proximaVacina.proximaDose), "dd/MM/yyyy")}
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {[['historico','Histórico'],['vacinas','Vacinas']].map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              aba === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Histórico de consultas */}
      {aba === 'historico' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">
              {animal.consultas?.length ?? 0} consultas registradas
            </h2>
            <button onClick={() => setModalConsulta(true)} className="btn-primary">
              <Plus size={14} /> Agendar consulta
            </button>
          </div>

          {animal.consultas?.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma consulta registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {animal.consultas?.map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/prontuario/${c.id}`)}
                  className="card cursor-pointer hover:shadow-card-hover transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(c.dataHora), "d 'de' MMM 'de' yyyy · HH:mm", { locale: ptBR })}
                        </span>
                        <span className={`badge text-[10px] ${STATUS_COR[c.status] ?? ''}`}>
                          {c.status?.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.tipo?.replace('_', ' ').toLowerCase()}
                        {c.motivoVisita ? ` · ${c.motivoVisita}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.prontuario?.id && (
                        <span className="text-xs text-esmeralda-600 font-medium">Prontuário ✓</span>
                      )}
                      <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 rotate-180 transition-colors" />
                    </div>
                  </div>
                  {c.prontuario?.diagnostico && (
                    <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500 line-clamp-1">
                      <span className="font-medium text-gray-600">Diagnóstico: </span>
                      {c.prontuario.diagnostico}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vacinas */}
      {aba === 'vacinas' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">
              {animal.vacinas?.length ?? 0} vacinas registradas
            </h2>
            <button onClick={() => setModalVacina(true)} className="btn-primary">
              <Plus size={14} /> Registrar vacina
            </button>
          </div>

          {animal.vacinas?.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Syringe size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma vacina registrada</p>
            </div>
          ) : (
            <div className="card divide-y divide-gray-50">
              {animal.vacinas?.map(v => {
                const vencida = v.proximaDose && new Date(v.proximaDose) < new Date()
                return (
                  <div key={v.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-esmeralda-50 flex items-center justify-center">
                        <Syringe size={14} className="text-esmeralda-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{v.nome}</div>
                        <div className="text-xs text-gray-400">
                          Aplicada em {format(new Date(v.dataAplicacao), "dd/MM/yyyy")}
                          {v.lote ? ` · Lote ${v.lote}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {v.proximaDose && (
                        <div className={`text-xs font-medium ${vencida ? 'text-red-600' : 'text-amber-600'}`}>
                          {vencida ? '⚠️ Vencida' : 'Próxima dose'}
                        </div>
                      )}
                      {v.proximaDose && (
                        <div className="text-xs text-gray-400">{format(new Date(v.proximaDose), "dd/MM/yyyy")}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {modalConsulta && (
        <ModalNovaConsulta
          onClose={() => setModalConsulta(false)}
          onSalvo={() => { setModalConsulta(false); carregar() }}
        />
      )}
      {modalVacina && (
        <ModalNovaVacina
          animalId={id}
          onClose={() => setModalVacina(false)}
          onSalvo={() => { setModalVacina(false); carregar() }}
        />
      )}
      {modalEditarAberto && (
        <ModalEditarPaciente
          animal={animal}
          onClose={() => setModalEditarAberto(false)}
          onSalvo={() => {
            setModalEditarAberto(false)
            carregar()
          }}
        />
    )}
    </div>
  )
}

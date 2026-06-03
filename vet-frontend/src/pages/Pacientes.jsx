// src/pages/Pacientes.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, PawPrint, ChevronRight, AlertCircle } from 'lucide-react'
import { api } from '../lib/api.js'
import toast from 'react-hot-toast'
import ModalNovoPaciente from '../components/ui/ModalNovoPaciente.jsx'

const ESPECIE_EMOJI = { CACHORRO:'🐕', GATO:'🐈', AVE:'🦜', REPTIL:'🦎', ROEDOR:'🐭', COELHO:'🐰', OUTRO:'🐾' }
const ESPECIE_COR = {
  CACHORRO: 'bg-esmeralda-50 text-esmeralda-700',
  GATO:     'bg-purple-50 text-purple-700',
  AVE:      'bg-amber-50 text-amber-700',
  REPTIL:   'bg-green-50 text-green-700',
  ROEDOR:   'bg-orange-50 text-orange-700',
  COELHO:   'bg-pink-50 text-pink-700',
  OUTRO:    'bg-gray-50 text-gray-600',
}

export default function Pacientes() {
  const [animais, setAnimais] = useState([])
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const navigate = useNavigate()

  async function carregar(q = '') {
    setLoading(true)
    try {
      const params = q ? `?busca=${encodeURIComponent(q)}&limite=40` : '?limite=40'
      const res = await api.get(`/animais${params}`)
      setAnimais(res.animais)
      setTotal(res.total)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 350)
    return () => clearTimeout(t)
  }, [busca])

  function calcularIdade(dataNasc) {
    if (!dataNasc) return null
    const anos = Math.floor((new Date() - new Date(dataNasc)) / (365.25 * 24 * 3600 * 1000))
    if (anos === 0) {
      const meses = Math.floor((new Date() - new Date(dataNasc)) / (30.5 * 24 * 3600 * 1000))
      return `${meses}m`
    }
    return `${anos}a`
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} animais cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-base pl-9 w-60"
              placeholder="Buscar animal ou tutor..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button onClick={() => setModalAberto(true)} className="btn-primary">
            <Plus size={16} /> Novo paciente
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
        ) : animais.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <PawPrint size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum paciente encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {animais.map(a => {
              const idade = calcularIdade(a.dataNascimento)
              return (
                <div
                  key={a.id}
                  onClick={() => navigate(`/pacientes/${a.id}`)}
                  className="flex items-center gap-4 py-3.5 px-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                    {ESPECIE_EMOJI[a.especie] ?? '🐾'}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{a.nome}</span>
                      <span className={`badge text-[10px] ${ESPECIE_COR[a.especie] ?? 'bg-gray-50 text-gray-600'}`}>
                        {a.especie?.toLowerCase()}
                      </span>
                      {a.raca && <span className="text-xs text-gray-400">{a.raca}</span>}
                      {a.castrado && <span className="badge bg-gray-50 text-gray-500 text-[10px]">castrado(a)</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {a.tutor?.nome} · {a.sexo?.toLowerCase()}
                      {idade ? ` · ${idade}` : ''}
                      {a.peso ? ` · ${a.peso}kg` : ''}
                    </div>
                  </div>

                  {/* Alertas */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.alergias && (
                      <span className="badge bg-red-50 text-red-600 text-[10px]">
                        <AlertCircle size={9} /> alergia
                      </span>
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
        <ModalNovoPaciente
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar(busca) }}
        />
      )}
    </div>
  )
}

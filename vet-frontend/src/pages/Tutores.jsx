// src/pages/Tutores.jsx
import { useEffect, useState } from 'react'
import { Plus, Search, Users, Phone, Mail, ChevronRight, PawPrint } from 'lucide-react'
import { api } from '../lib/api.js'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ModalNovoTutor from '../components/ui/ModalNovoTutor.jsx'
import ModalEditarTutor from '../components/ui/ModalEditarTutor.jsx'


export default function Tutores() {
  const [tutores, setTutores] = useState([])
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [tutorEditando, setTutorEditando] = useState(null)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const navigate = useNavigate()

  async function carregar(q = '') {
    setLoading(true)
    try {
      const params = q ? `?busca=${encodeURIComponent(q)}&limite=40` : '?limite=40'
      const res = await api.get(`/tutores${params}`)
      setTutores(res.tutores)
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

  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Tutores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} tutores cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-base pl-9 w-60" placeholder="Buscar por nome ou telefone..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <button onClick={() => setModalAberto(true)} className="btn-primary">
            <Plus size={16} /> Novo tutor
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
        ) : tutores.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum tutor encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tutores.map(t => (
              <div key={t.id} className="flex items-center gap-4 py-3.5 px-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-full bg-esmeralda-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-esmeralda-700">
                    {t.nome?.split(' ').map(n => n[0]).slice(0,2).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{t.nome}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Phone size={10} /> {t.telefone}
                    </span>
                    {t.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail size={10} /> {t.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTutorEditando(t)
                        setModalEditarAberto(true)
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Editar
                    </button>

                    {t._count?.animais > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <PawPrint size={11} /> {t._count.animais} animal{t._count.animais > 1 ? 'is' : ''}
                      </span>
                    )}

                    <ChevronRight
                      size={14}
                      className="text-gray-300 group-hover:text-gray-500 transition-colors"
                    />
                  </div>
              </div>
            ))}
          </div>
        )} 
      </div>

      {modalAberto && (
        <ModalNovoTutor
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar(busca) }}
        />
      )}
      {modalEditarAberto && (
  <ModalEditarTutor
    tutor={tutorEditando}
    onClose={() => {
      setModalEditarAberto(false)
      setTutorEditando(null)
    }}
    onSalvo={() => {
      setModalEditarAberto(false)
      setTutorEditando(null)
      carregar(busca)
    }}
  />
)}
    </div>
  )
}

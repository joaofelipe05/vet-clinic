// src/components/ui/ModalNovoPaciente.jsx
import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { api } from '../../lib/api.js'
import toast from 'react-hot-toast'

const ESPECIES = ['CACHORRO','GATO','AVE','REPTIL','ROEDOR','COELHO','OUTRO']

export default function ModalNovoPaciente({ onClose, onSalvo }) {
  const [buscaTutor, setBuscaTutor] = useState('')
  const [tutores, setTutores] = useState([])
  const [tutorId, setTutorId] = useState('')
  const [tutorNome, setTutorNome] = useState('')
  const [novoTutor, setNovoTutor] = useState({ nome:'', telefone:'', email:'' })
  const [criarTutor, setCriarTutor] = useState(false)
  const [form, setForm] = useState({
    nome:'', especie:'CACHORRO', raca:'', sexo:'MACHO',
    dataNascimento:'', peso:'', microchip:'', castrado:false, alergias:'', observacoes:'',
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (buscaTutor.length < 2) { setTutores([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/tutores?busca=${buscaTutor}&limite=5`)
        setTutores(res.tutores)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [buscaTutor])

  async function salvar() {
    if (!form.nome) { toast.error('Nome do animal obrigatório'); return }
    if (!tutorId && !criarTutor) { toast.error('Selecione ou cadastre um tutor'); return }
    if (criarTutor && (!novoTutor.nome || !novoTutor.telefone)) {
      toast.error('Nome e telefone do tutor são obrigatórios'); return
    }
    setSalvando(true)
    try {
      let tid = tutorId
      if (criarTutor) {
        const t = await api.post('/tutores', novoTutor)
        tid = t.id
      }
      await api.post('/animais', {
        ...form,
        tutorId: tid,
        peso: form.peso ? Number(form.peso) : null,
        dataNascimento: form.dataNascimento || null,
      })
      toast.success('Paciente cadastrado!')
      onSalvo()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 no-print overflow-y-auto py-8"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Novo paciente</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tutor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="field-label">Tutor</label>
              <button
                onClick={() => { setCriarTutor(v => !v); setTutorId('') }}
                className="text-xs text-esmeralda-600 hover:underline"
              >
                {criarTutor ? 'Buscar tutor existente' : '+ Cadastrar novo tutor'}
              </button>
            </div>
            {criarTutor ? (
              <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input className="input-base" placeholder="Nome completo *" value={novoTutor.nome} onChange={e => setNovoTutor(v=>({...v,nome:e.target.value}))} />
                <input className="input-base" placeholder="Telefone *" value={novoTutor.telefone} onChange={e => setNovoTutor(v=>({...v,telefone:e.target.value}))} />
                <input className="input-base" placeholder="E-mail (opcional)" value={novoTutor.email} onChange={e => setNovoTutor(v=>({...v,email:e.target.value}))} />
              </div>
            ) : tutorId ? (
              <div className="flex items-center justify-between p-3 bg-esmeralda-50 rounded-xl border border-esmeralda-200">
                <span className="text-sm font-medium text-esmeralda-800">{tutorNome}</span>
                <button onClick={() => { setTutorId(''); setBuscaTutor('') }}><X size={14} className="text-esmeralda-600" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-base pl-9" placeholder="Buscar por nome ou telefone..."
                  value={buscaTutor} onChange={e => setBuscaTutor(e.target.value)} />
                {tutores.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-card z-10">
                    {tutores.map(t => (
                      <button key={t.id} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                        onClick={() => { setTutorId(t.id); setTutorNome(t.nome); setBuscaTutor(''); setTutores([]) }}>
                        <span className="font-medium">{t.nome}</span>
                        <span className="text-gray-400 ml-2 text-xs">{t.telefone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Nome do animal *</label>
              <input className="input-base" placeholder="Ex: Thor" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Espécie</label>
              <select className="input-base" value={form.especie} onChange={e => setForm(f=>({...f,especie:e.target.value}))}>
                {ESPECIES.map(e => <option key={e} value={e}>{e.toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Raça</label>
              <input className="input-base" placeholder="Ex: Golden Retriever" value={form.raca} onChange={e => setForm(f=>({...f,raca:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Sexo</label>
              <select className="input-base" value={form.sexo} onChange={e => setForm(f=>({...f,sexo:e.target.value}))}>
                <option value="MACHO">Macho</option>
                <option value="FEMEA">Fêmea</option>
              </select>
            </div>
            <div>
              <label className="field-label">Data de nascimento</label>
              <input type="date" className="input-base" value={form.dataNascimento} onChange={e => setForm(f=>({...f,dataNascimento:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Peso (kg)</label>
              <input type="number" step="0.1" className="input-base" placeholder="0.0" value={form.peso} onChange={e => setForm(f=>({...f,peso:e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="field-label">Microchip</label>
            <input className="input-base" placeholder="Número do microchip" value={form.microchip} onChange={e => setForm(f=>({...f,microchip:e.target.value}))} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="castrado" checked={form.castrado} onChange={e => setForm(f=>({...f,castrado:e.target.checked}))}
              className="w-4 h-4 accent-esmeralda-600 cursor-pointer" />
            <label htmlFor="castrado" className="text-sm text-gray-600 cursor-pointer">Animal castrado</label>
          </div>

          <div>
            <label className="field-label">Alergias conhecidas</label>
            <input className="input-base" placeholder="Ex: Amoxicilina, frango..." value={form.alergias} onChange={e => setForm(f=>({...f,alergias:e.target.value}))} />
          </div>
          <div>
            <label className="field-label">Observações</label>
            <textarea className="input-base" rows={2} placeholder="Anotações gerais sobre o animal..." value={form.observacoes} onChange={e => setForm(f=>({...f,observacoes:e.target.value}))} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
            {salvando ? 'Salvando...' : 'Cadastrar paciente'}
          </button>
        </div>
      </div>
    </div>
  )
}

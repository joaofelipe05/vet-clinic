// src/components/ui/ModalNovoTutor.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../lib/api.js'
import toast from 'react-hot-toast'

export default function ModalNovoTutor({ onClose, onSalvo }) {
  const [form, setForm] = useState({ nome:'', telefone:'', email:'', cpf:'', endereco:'', cidade:'' })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!form.nome || !form.telefone) { toast.error('Nome e telefone são obrigatórios'); return }
    setSalvando(true)
    try {
      await api.post('/tutores', form)
      toast.success('Tutor cadastrado!')
      onSalvo()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 no-print"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Novo tutor</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="field-label">Nome completo *</label>
            <input className="input-base" placeholder="Ex: Ana Paula Costa"
              value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Telefone *</label>
              <input className="input-base" placeholder="(11) 99999-9999"
                value={form.telefone} onChange={e => setForm(f=>({...f,telefone:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">CPF</label>
              <input className="input-base" placeholder="000.000.000-00"
                value={form.cpf} onChange={e => setForm(f=>({...f,cpf:e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="field-label">E-mail</label>
            <input type="email" className="input-base" placeholder="email@exemplo.com"
              value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
          </div>
          <div>
            <label className="field-label">Endereço</label>
            <input className="input-base" placeholder="Rua, número, bairro"
              value={form.endereco} onChange={e => setForm(f=>({...f,endereco:e.target.value}))} />
          </div>
          <div>
            <label className="field-label">Cidade</label>
            <input className="input-base" placeholder="Cidade"
              value={form.cidade} onChange={e => setForm(f=>({...f,cidade:e.target.value}))} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
            {salvando ? 'Salvando...' : 'Cadastrar tutor'}
          </button>
        </div>
      </div>
    </div>
  )
}

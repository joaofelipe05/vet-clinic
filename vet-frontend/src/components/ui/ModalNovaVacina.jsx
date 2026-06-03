// src/components/ui/ModalNovaVacina.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../lib/api.js'
import toast from 'react-hot-toast'

const VACINAS_COMUNS = ['V8','V10','Antirrábica','Bordetella','Giardia','Leucemia Felina','Tríplice Felina']

export default function ModalNovaVacina({ animalId, onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome:'', dataAplicacao: new Date().toISOString().split('T')[0],
    proximaDose:'', lote:'', fabricante:'', observacoes:'',
  })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!form.nome) { toast.error('Nome da vacina obrigatório'); return }
    setSalvando(true)
    try {
      await api.post('/vacinas', {
        animalId,
        nome: form.nome,
        dataAplicacao: form.dataAplicacao,
        proximaDose: form.proximaDose || null,
        lote: form.lote || null,
        fabricante: form.fabricante || null,
        observacoes: form.observacoes || null,
      })
      toast.success('Vacina registrada!')
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
          <h2 className="font-semibold text-gray-900">Registrar vacina</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="field-label">Vacina *</label>
            <input className="input-base" placeholder="Nome da vacina" list="vacinas-list"
              value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} />
            <datalist id="vacinas-list">
              {VACINAS_COMUNS.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Data de aplicação *</label>
              <input type="date" className="input-base" value={form.dataAplicacao}
                onChange={e => setForm(f=>({...f,dataAplicacao:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Próxima dose</label>
              <input type="date" className="input-base" value={form.proximaDose}
                onChange={e => setForm(f=>({...f,proximaDose:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Lote</label>
              <input className="input-base" placeholder="Ex: A123456" value={form.lote}
                onChange={e => setForm(f=>({...f,lote:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Fabricante</label>
              <input className="input-base" placeholder="Ex: Boehringer" value={form.fabricante}
                onChange={e => setForm(f=>({...f,fabricante:e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="field-label">Observações</label>
            <textarea className="input-base" rows={2} placeholder="Reações, anotações..."
              value={form.observacoes} onChange={e => setForm(f=>({...f,observacoes:e.target.value}))} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
            {salvando ? 'Salvando...' : 'Registrar vacina'}
          </button>
        </div>
      </div>
    </div>
  )
}

// src/components/ui/ModalNovaConsulta.jsx
import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { api } from '../../lib/api.js'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TIPOS = ['CONSULTA','RETORNO','CIRURGIA','EMERGENCIA','VACINA','EXAME','BANHO_TOSA']

export default function ModalNovaConsulta({ dataInicial, onClose, onSalvo }) {
  const [animais, setAnimais] = useState([])
  const [busca, setBusca] = useState('')
  const [animalId, setAnimalId] = useState('')
  const [animalNome, setAnimalNome] = useState('')
  const [form, setForm] = useState({
    dataHora: format(dataInicial ?? new Date(), "yyyy-MM-dd'T'HH:mm"),
    tipo: 'CONSULTA',
    motivoVisita: '',
    valor: '',
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (busca.length < 2) { setAnimais([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/animais?busca=${busca}&limite=6`)
        setAnimais(res.animais)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  async function salvar() {
    if (!animalId) { toast.error('Selecione um paciente'); return }
    setSalvando(true)
    try {
      await api.post('/consultas', {
        animalId,
        dataHora: form.dataHora,
        tipo: form.tipo,
        motivoVisita: form.motivoVisita || null,
        valor: form.valor ? Number(form.valor) : null,
      })
      toast.success('Consulta agendada!')
      onSalvo()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 no-print" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Nova consulta</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Busca de animal */}
          <div>
            <label className="field-label">Paciente</label>
            {animalId ? (
              <div className="flex items-center justify-between p-3 bg-esmeralda-50 rounded-xl border border-esmeralda-200">
                <span className="text-sm font-medium text-esmeralda-800">{animalNome}</span>
                <button onClick={() => { setAnimalId(''); setAnimalNome(''); setBusca('') }} className="text-esmeralda-600 hover:text-esmeralda-800">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input-base pl-9"
                  placeholder="Digite o nome do animal ou tutor..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
                {animais.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-card z-10 overflow-hidden">
                    {animais.map(a => (
                      <button
                        key={a.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                        onClick={() => { setAnimalId(a.id); setAnimalNome(`${a.nome} (${a.tutor?.nome})`); setBusca(''); setAnimais([]) }}
                      >
                        <span className="font-medium text-gray-900">{a.nome}</span>
                        <span className="text-gray-400 ml-2 text-xs">{a.especie?.toLowerCase()} · {a.tutor?.nome}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data/hora */}
          <div>
            <label className="field-label">Data e hora</label>
            <input
              type="datetime-local"
              className="input-base"
              value={form.dataHora}
              onChange={e => setForm(f => ({ ...f, dataHora: e.target.value }))}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="field-label">Tipo</label>
            <select className="input-base" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {TIPOS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="field-label">Motivo / queixa principal</label>
            <input className="input-base" placeholder="Ex: vômito, check-up anual..." value={form.motivoVisita} onChange={e => setForm(f => ({ ...f, motivoVisita: e.target.value }))} />
          </div>

          {/* Valor */}
          <div>
            <label className="field-label">Valor estimado (R$)</label>
            <input type="number" className="input-base" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
            {salvando ? 'Salvando...' : 'Agendar consulta'}
          </button>
        </div>
      </div>
    </div>
  )
}

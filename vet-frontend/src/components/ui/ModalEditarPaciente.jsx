import { useState } from 'react'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

export default function ModalEditarPaciente({
  animal,
  onClose,
  onSalvo
}) {
  const [nome, setNome] = useState(animal.nome || '')
  const [peso, setPeso] = useState(animal.peso || '')
  const [raca, setRaca] = useState(animal.raca || '')

  async function salvar() {
    try {
      await api.put(`/animais/${animal.id}`, {
        nome,
        peso,
        raca
      })

      toast.success('Paciente atualizado!')
      onSalvo()
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4">

        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            Editar paciente
          </h2>
        </div>

        <div className="px-6 py-5 space-y-4">

          <div>
            <label className="field-label">Nome</label>
            <input
              className="input-base"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Raça</label>
            <input
              className="input-base"
              value={raca}
              onChange={(e) => setRaca(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Peso</label>
            <input
              className="input-base"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </div>

        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>

          <button
            onClick={salvar}
            className="btn-primary"
          >
            Salvar alterações
          </button>
        </div>

      </div>
    </div>
  )
}
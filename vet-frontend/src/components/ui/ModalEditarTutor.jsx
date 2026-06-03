import { useState } from 'react'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

export default function ModalEditarTutor({
  tutor,
  onClose,
  onSalvo
}) {
  const [nome, setNome] = useState(tutor?.nome || '')
  const [telefone, setTelefone] = useState(tutor?.telefone || '')
  const [email, setEmail] = useState(tutor?.email || '')

  async function salvar() {
    try {
      await api.put(`/tutores/${tutor.id}`, {
        nome,
        telefone,
        email
      })

      toast.success('Tutor atualizado!')
      onSalvo()
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar tutor')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Editar tutor
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
            <label className="field-label">Telefone</label>
            <input
              className="input-base"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">E-mail</label>
            <input
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
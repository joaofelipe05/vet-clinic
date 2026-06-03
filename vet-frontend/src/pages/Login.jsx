// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Eye, EyeOff } from 'lucide-react'
import { api } from '../lib/api.js'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'
export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api.post('/auth/login', form)
      localStorage.setItem('vet_token', data.token)
      localStorage.setItem('vet_user', JSON.stringify(data.usuario))
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-creme-100 flex items-center justify-center p-4">
      {/* Painel decorativo esquerdo */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] h-[520px] bg-esmeralda-600 rounded-2xl p-10 mr-0 rounded-r-none text-white">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-8">
          <Stethoscope size={24} className="text-white" />
        </div>
          <h1 className="font-display text-3xl font-semibold leading-tight mb-4">
            Cuidado com<br />excelência
          </h1>
          <p className="text-esmeralda-100 text-sm leading-relaxed">
            Sistema completo de gestão para clínica veterinária: Lustosa Vet — prontuários, agenda, vacinas e muito mais.
          </p>
        </div>
        <div className="space-y-3">
          {['Prontuário eletrônico com impressão', 'Agenda de consultas', 'Controle de vacinas'].map(item => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-esmeralda-100">
              <div className="w-1.5 h-1.5 rounded-full bg-esmeralda-300" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="w-full max-w-sm lg:max-w-none lg:w-[380px] bg-white rounded-2xl lg:rounded-l-none shadow-modal p-10 h-[520px] flex flex-col justify-center">
        <div className="mb-8 flex flex-col items-center">
          <img
            src={logo}
            alt="Lustosa Vet"
            className="w-56 mb-4"
          />

          <p className="text-sm text-gray-500 text-center">
            Entre com seus dados para acessar
          </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">E-mail</label>
            <input
              type="email"
              className="input-base"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="field-label">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                className="input-base pr-10"
                placeholder="••••••••"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2 py-3"
          >
            {loading ? (
              <span className="animate-pulse">Entrando...</span>
            ) : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

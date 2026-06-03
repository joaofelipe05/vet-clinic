// src/components/layout/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, PawPrint,
  Users, DollarSign, LogOut, Stethoscope, ClipboardList, BarChart2
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agenda',    icon: CalendarDays,    label: 'Agenda' },
  { to: '/pacientes', icon: PawPrint,        label: 'Pacientes' },
  { to: '/tutores',   icon: Users,           label: 'Tutores' },
  { to: '/financeiro',icon: DollarSign,      label: 'Financeiro' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
]

export default function Layout() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('vet_user') ?? '{}')

  function sair() {
    localStorage.removeItem('vet_token')
    localStorage.removeItem('vet_user')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-100 flex flex-col z-20 no-print">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-esmeralda-600 flex items-center justify-center">
              <Stethoscope size={16} className="text-white" />
            </div>
            <div>
              <div className="font-display font-semibold text-gray-900 text-sm leading-tight">Lustosa Vet</div>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Sistema GERENCIAL</div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-esmeralda-50 text-esmeralda-700'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-esmeralda-600' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Usuário + Sair */}
        <div className="px-3 py-4 border-t border-gray-100">
  <div className="flex items-center justify-between">
    
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-esmeralda-100 flex items-center justify-center">
        <span className="text-esmeralda-700 text-xs font-semibold">
          {user.nome?.charAt(0) ?? 'V'}
        </span>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-800">
          {user.nome ? `Dra. ${user.nome}` : 'Veterinária'}
        </div>

        {user.crmv && (
          <div className="text-xs text-gray-400">
            CRMV {user.crmv}
          </div>
        )}
      </div>
    </div>

    <button
      onClick={sair}
      className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
    >
      <LogOut size={14} />
      Sair
    </button>

  </div>
</div>
      </aside>

      {/* Conteúdo principal */}
      <main className="ml-[240px] flex-1 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

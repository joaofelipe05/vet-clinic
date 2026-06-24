// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Agenda from './pages/Agenda.jsx'
import Pacientes from './pages/Pacientes.jsx'
import PacienteDetalhe from './pages/PacienteDetalhe.jsx'
import Prontuario from './pages/Prontuario.jsx'
import Tutores from './pages/Tutores.jsx'
import Financeiro from './pages/Financeiro.jsx'
import Relatorios from './pages/Relatorios.jsx'
import Estoque from './pages/Estoque.jsx'

function RotaPrivada({ children }) {
  const token = localStorage.getItem('vet_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <RotaPrivada><Layout /></RotaPrivada>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="agenda"      element={<Agenda />} />
        <Route path="pacientes"   element={<Pacientes />} />
        <Route path="pacientes/:id" element={<PacienteDetalhe />} />
        <Route path="prontuario/:consultaId" element={<Prontuario />} />
        <Route path="tutores"     element={<Tutores />} />
        <Route path="financeiro"  element={<Financeiro />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="estoque" element={<Estoque />} />
      </Route>
    </Routes>
  )
}

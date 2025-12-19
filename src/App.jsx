import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import TopBar from './components/TopBar.jsx'

import Dashboard from './pages/Dashboard.jsx'
import PlanSemanal from './pages/PlanSemanal.jsx'
import WorkOrders from './pages/WorkOrders.jsx'
import HorasExtra from './pages/HorasExtra.jsx'
import Admin from './pages/Admin.jsx'

const ROLES = [
  { id:'ADMIN', label:'Jefe' },
  { id:'PLANNER', label:'Planner' },
  { id:'TECH', label:'Técnico' }
]

const TECHS = [
  'LUDWIN CABA',
  'JESSE PORRAS',
  'DIEGO ORTUÑO',
  'BRAYAN IBARRA',
  'JUAN CARLOS SALGUEIRO'
]

export default function App(){
  const location = useLocation()
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('mockRole')
    return saved || 'ADMIN'
  })
  const [activeTech, setActiveTech] = useState(() => {
    const saved = localStorage.getItem('mockTech')
    return saved || TECHS[0]
  })
  const titleByPath = {
    '/': 'KPIs',
    '/plan-semanal': 'Plan Semanal',
    '/ot': 'Órdenes de Trabajo',
    '/horas-extra': 'Horas Extra',
    '/admin': 'Admin'
  }
  const title = titleByPath[location.pathname] ?? 'MTTO'

  useEffect(() => {
    localStorage.setItem('mockRole', role)
  }, [role])

  useEffect(() => {
    localStorage.setItem('mockTech', activeTech)
  }, [activeTech])

  return (
    <>
      <div className="topbar">
        <TopBar
          title={title}
          role={role}
          roles={ROLES}
          onRoleChange={setRole}
          tech={activeTech}
          techs={TECHS}
          onTechChange={setActiveTech}
        />
      </div>

      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard role={role} tech={activeTech} />} />
          <Route path="/plan-semanal" element={<PlanSemanal role={role} tech={activeTech} />} />
          <Route path="/ot" element={<WorkOrders role={role} tech={activeTech} />} />
          <Route path="/horas-extra" element={<HorasExtra role={role} tech={activeTech} />} />
          <Route path="/admin" element={<Admin role={role} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <BottomNav />
    </>
  )
}

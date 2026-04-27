import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import BottomNav from './components/BottomNav.jsx'
import TopBar from './components/TopBar.jsx'
import LoginScreen from './components/LoginScreen.jsx'

import Dashboard from './pages/Dashboard.jsx'
import PlanSemanal from './pages/PlanSemanal.jsx'
import WorkOrders from './pages/WorkOrders.jsx'
import HorasExtra from './pages/HorasExtra.jsx'
import Admin from './pages/Admin.jsx'

function AppContent() {
  const location = useLocation()
  const { user, role, loading, signOut } = useAuth()

  // Basic spinner while checking auth
  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>
  }

  // If not authenticated, show login
  if (!user) {
    return <LoginScreen />
  }

  // Derived user name from metadata or context
  // Note: We updated AuthContext to patch user_metadata.name into user object or we can rely on what's there
  const activeTech = user?.user_metadata?.name || user?.email

  const titleByPath = {
    '/': 'KPIs',
    '/plan-semanal': 'Plan Semanal',
    '/ot': 'Órdenes de Trabajo',
    '/horas-extra': 'Horas Extra',
    '/admin': 'Admin'
  }
  const title = titleByPath[location.pathname] ?? 'MTTO'

  return (
    <>
      <div className="topbar">
        <TopBar
          title={title}
          role={role}
          tech={activeTech}
          onLogout={signOut}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

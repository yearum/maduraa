import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { useDemoStore } from '../contexts/useDemoStore'

function ProtectedRoute() {
  const { mode, user, loading } = useAuth()
  const demo = useDemoStore()

  if (loading || (mode === 'prototype' && demo.loading)) {
    return <p role="status">Memeriksa sesi...</p>
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute

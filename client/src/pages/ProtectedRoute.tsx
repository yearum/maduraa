import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { useDemoStore } from '../contexts/useDemoStore'
import { usePreview } from '../contexts/usePreview'

function ProtectedRoute() {
  const { mode, user, loading } = useAuth()
  const demo = useDemoStore()
  const preview = usePreview()
  const location = useLocation()

  if (preview.role === 'cashier') {
    const cashierPaths = ['/dashboard', '/dashboard/overview', '/overview']
    if (!cashierPaths.includes(location.pathname)) {
      return <Navigate to="/dashboard" replace />
    }
    return <Outlet />
  }

  if (preview.role === 'owner') return <Outlet />
  if (loading || (mode === 'prototype' && demo.loading)) {
    return <p role="status">Memeriksa sesi...</p>
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute

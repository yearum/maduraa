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

  if (!user) return <Navigate to="/login" replace />

  if (mode === 'prototype' || user.role === 'owner') {
    return <Outlet />
  }

  if (user.role === 'cashier') {
    const cashierPaths = [
      '/dashboard',
      '/dashboard/overview',
      '/overview',
      '/transactions',
    ]

    return cashierPaths.includes(location.pathname)
      ? <Outlet />
      : <Navigate to="/dashboard" replace />
  }

  return <p role="alert">Akses akun tidak dikenali.</p>
}

export default ProtectedRoute

import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { hasAuthToken } from '../services/authService'

const Dashboard = lazy(() => import('../App'))

function DashboardRoute() {
  return hasAuthToken() ? (
    <Suspense fallback={<p>Memuat dashboard...</p>}>
      <Dashboard />
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default DashboardRoute

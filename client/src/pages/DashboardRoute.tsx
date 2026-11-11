import { lazy, Suspense } from 'react'
import { useAuth } from '../contexts/useAuth'
import DashboardPage from './DashboardPage'

const Dashboard = lazy(() => import('../App'))

function DashboardRoute() {
  const { mode } = useAuth()

  if (mode === 'prototype') {
    return <DashboardPage initialSection="Laporan Omzet" />
  }

  return (
    <Suspense fallback={<p>Memuat dashboard...</p>}>
      <Dashboard />
    </Suspense>
  )
}

export default DashboardRoute

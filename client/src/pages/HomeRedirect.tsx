import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <p role="status">Memeriksa sesi...</p>
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default HomeRedirect

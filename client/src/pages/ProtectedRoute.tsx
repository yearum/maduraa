import { Navigate, Outlet } from 'react-router-dom'
import { hasAuthToken } from '../services/authService'

function ProtectedRoute() {
  return hasAuthToken() ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute

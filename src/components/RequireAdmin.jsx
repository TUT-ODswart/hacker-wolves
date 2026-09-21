import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'

export default function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/?login=1" replace />
  return children
}

import { Navigate } from 'react-router-dom'
import { useStore } from '../data/StoreContext.js'
import { ROLE_HOME } from '../data/constants.js'

export default function RequireRole({ roles, children }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/?login=1" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />
  return children
}

import { createContext, useContext } from 'react'

// Demo credentials. There is no real backend yet.
export const DEMO_EMAIL = 'admin@gmail.com'
export const DEMO_PASSWORD = 'admin123'
export const DEMO_OTP = '123456'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

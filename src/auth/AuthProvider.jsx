import { useState } from 'react'
import { AuthContext, DEMO_EMAIL, DEMO_PASSWORD, DEMO_OTP } from './AuthContext.js'

const KEY = 'hw-admin'

function readSession() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export default function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(readSession)

  function checkCredentials(email, password) {
    return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
  }

  function verifyOtp(code) {
    if (code !== DEMO_OTP) return false
    setIsAdmin(true)
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      // ignore
    }
    return true
  }

  function logout() {
    setIsAdmin(false)
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ isAdmin, checkCredentials, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

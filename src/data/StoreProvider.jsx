import { useEffect, useMemo, useState } from 'react'
import { StoreContext } from './StoreContext.js'
import { STATE_VERSION, createSeedState } from './seed.js'
import { analyzeNetwork } from './model.js'
import { engineTick } from './engine.js'
import { nextId } from './helpers.js'
import { DEMO_OTP } from './constants.js'
import * as A from './actions.js'

const STORAGE_KEY = 'hw-state'
const SESSION_KEY = 'hw-session'


function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.version === STATE_VERSION) return saved
  } catch {
    // ignore and start fresh
  }
  return createSeedState(Date.now())
}

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function writeSession(id) {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

const clock = () => Date.now()

export default function StoreProvider({ children }) {
  const [state, setState] = useState(loadState)
  const [now, setNow] = useState(clock)
  const [sessionId, setSessionId] = useState(readSession)

  // The "live" clock: every 2 seconds sensors are re-read and the engine runs.
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now()
      setNow(t)
      setState((s) => engineTick(s, t))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full (usually too many photos); the app keeps working in memory
    }
  }, [state])

  const analysis = useMemo(() => analyzeNetwork(state, now), [state, now])
  const user = state.users.find((u) => u.id === sessionId && u.active) ?? null

  const run = (fn, payload) => setState((s) => fn(s, payload, { now: Date.now(), user }))

  const actions = {
    // Residents
    submitReport(form) {
      const dup = form.attachTo ?? A.findDuplicate(state, form)?.id ?? null
      const reportId = nextId(state.reports, 'RPT', 2000)
      const incidentId = dup ? null : nextId(state.incidents, 'INC', 1000)
      run(A.submitReport, { ...form, reportId, incidentId, attachTo: dup })
      const count = dup ? state.incidents.find((i) => i.id === dup).reportIds.length + 1 : 1
      return { reportId, incidentId: dup ?? incidentId, duplicate: !!dup, count }
    },
    findDuplicate: (form) => A.findDuplicate(state, form),
    rateReport: (p) => run(A.rateReport, p),

    // Incidents and work orders
    assignIncident(p) {
      const woId = nextId(state.workOrders, 'WO', 3000)
      run(A.assignIncident, { ...p, woId })
      return woId
    },
    addComment: (p) => run(A.addComment, p),
    closeIncident: (p) => run(A.closeIncident, p),
    createWorkOrder(p) {
      const woId = nextId(state.workOrders, 'WO', 3000)
      run(A.createWorkOrder, { ...p, woId })
      return woId
    },
    startWorkOrder: (p) => run(A.startWorkOrder, p),
    completeWorkOrder: (p) => run(A.completeWorkOrder, p),

    // Admin
    updateSettings: (p) => run(A.updateSettings, p),
    saveUser: (p) => run(A.saveUser, p),
    saveCrew: (p) => run(A.saveCrew, p),
    updateProfile: (p) => run(A.updateProfile, p),
    changePassword: (p) => run(A.changePassword, p),
    markAllRead: () => run(A.markAllRead),

    // Demo tools
    startScenario: (p) => run(A.startScenario, p),
    stopScenario: (p) => run(A.stopScenario, p),
    injectFault: (p) => run(A.injectFault, p),
    clearFault: (p) => run(A.clearFault, p),
    setRain: (p) => run(A.setRain, p),
    resetDemo: () => run(A.resetDemo),
  }

  const auth = {
    checkCredentials(email, password) {
      const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (!u || u.password !== password) return { ok: false, error: 'Incorrect username or password.' }
      if (!u.active) return { ok: false, error: 'This account has been deactivated. Contact your administrator.' }
      return { ok: true, userId: u.id }
    },
    verifyOtp(userId, code) {
      if (code !== DEMO_OTP) return false
      setSessionId(userId)
      writeSession(userId)
      return true
    },
    logout() {
      setSessionId(null)
      writeSession(null)
    },
  }

  return <StoreContext.Provider value={{ state, now, analysis, user, actions, auth }}>{children}</StoreContext.Provider>
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useStore } from '../data/StoreContext.js'
import { DEMO_OTP, ROLE_HOME, ROLES } from '../data/constants.js'

const DEMO_ACCOUNTS = [
  { role: 'admin', email: 'admin@gmail.com', password: 'admin123' },
  { role: 'technician', email: 'tech@gmail.com', password: 'tech123' },
]

// Sign in, then OTP, then success (from the design).
export default function LoginModal({ onClose }) {
  const [step, setStep] = useState('login')
  const [userId, setUserId] = useState(null)

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-white/40 p-4 backdrop-blur-sm">
      <div
        className={`relative my-auto w-full max-w-2xl rounded-3xl border bg-white px-6 py-10 shadow-xl sm:px-12 ${
          step === 'success' ? 'border-lime-400' : 'border-slate-900'
        }`}
      >
        {step !== 'success' && (
          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-500 hover:text-slate-900" aria-label="Close">
            <X size={20} />
          </button>
        )}
        {step === 'login' && (
          <LoginStep
            onCancel={onClose}
            onForgot={() => setStep('forgot')}
            onNext={(id) => {
              setUserId(id)
              setStep('otp')
            }}
          />
        )}
        {step === 'forgot' && <ForgotStep onBack={() => setStep('login')} />}
        {step === 'otp' && <OtpStep userId={userId} onBack={() => setStep('login')} onNext={() => setStep('success')} />}
        {step === 'success' && <SuccessStep />}
      </div>
    </div>
  )
}

function LoginStep({ onCancel, onNext, onForgot }) {
  const { auth } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const result = auth.checkCredentials(email, password)
    if (result.ok) onNext(result.userId)
    else setError(result.error)
  }

  const input = 'mt-2 w-full rounded-xl bg-slate-200 px-4 py-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-brand'

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-5">
      <label className="block">
        <span className="text-2xl text-slate-900">Username</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@gmail.com" autoComplete="username" className={input} />
      </label>
      <label className="block">
        <span className="text-2xl text-slate-900">Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className={input} />
      </label>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 py-3 text-lg font-bold text-slate-700 hover:bg-slate-300">
          Cancel
        </button>
        <button type="submit" className="rounded-xl bg-brand py-3 text-lg font-bold text-white hover:bg-brand-dark">
          Sign in
        </button>
      </div>

      <button type="button" onClick={onForgot} className="block w-full text-center text-sm text-slate-500 underline">
        Forgot password?
      </button>

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-600">Demo accounts (tap to fill)</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              type="button"
              key={a.role}
              onClick={() => {
                setEmail(a.email)
                setPassword(a.password)
                setError('')
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:border-brand"
            >
              {ROLES[a.role]}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}

function ForgotStep({ onBack }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="mx-auto max-w-sm">
      <p className="text-2xl text-slate-900">Reset password</p>
      {sent ? (
        <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
          If an account exists for {email}, a reset link has been sent. (Demo: no email is actually sent.)
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
          className="mt-4 space-y-4"
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your work email" className="w-full rounded-xl bg-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand" />
          <button className="w-full rounded-xl bg-brand py-3 font-bold text-white hover:bg-brand-dark">Send reset link</button>
        </form>
      )}
      <button onClick={onBack} className="mt-4 text-sm text-slate-500 underline">Back to sign in</button>
    </div>
  )
}

function OtpStep({ userId, onBack, onNext }) {
  const { auth } = useStore()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [seconds, setSeconds] = useState(600)
  const [error, setError] = useState('')
  const inputs = useRef([])

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  function submit(next) {
    const code = next.join('')
    if (code.length < 6) return
    if (auth.verifyOtp(userId, code)) {
      onNext()
    } else {
      setError('That code is not correct. Try again.')
      setDigits(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    }
  }

  function handleChange(i, value) {
    const clean = value.replace(/\D/g, '')
    if (!clean) return
    const next = [...digits]
    clean.split('').slice(0, 6 - i).forEach((d, k) => {
      next[i + k] = d
    })
    setDigits(next)
    setError('')
    inputs.current[Math.min(i + clean.length, 5)]?.focus()
    submit(next)
  }

  function handleKeyDown(i, e) {
    if (e.key !== 'Backspace') return
    e.preventDefault()
    const next = [...digits]
    if (next[i]) next[i] = ''
    else if (i > 0) {
      next[i - 1] = ''
      inputs.current[i - 1]?.focus()
    }
    setDigits(next)
  }

  const mm = Math.floor(seconds / 60)
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="mx-auto max-w-sm">
      <p className="text-2xl text-slate-900">Enter OTP</p>
      <p className="mt-1 text-sm text-slate-500">We sent a 6-digit code to your phone.</p>
      <div className="mt-5 flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={i === 0}
            aria-label={`Digit ${i + 1}`}
            className="h-14 w-12 rounded-xl bg-brand text-center text-2xl font-bold text-white outline-none focus:ring-4 focus:ring-brand/30 sm:h-16 sm:w-14"
          />
        ))}
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-5 text-2xl text-slate-900">
        {seconds > 0 ? (
          <>
            Resend in <span className="text-red-600">{mm}:{ss}</span>
          </>
        ) : (
          <button onClick={() => setSeconds(600)} className="font-semibold text-brand underline">Resend code</button>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-slate-500 underline hover:text-slate-900">Back</button>
        <span className="text-xs text-slate-500">Demo code: {DEMO_OTP}</span>
      </div>
    </div>
  )
}

function SuccessStep() {
  const { user } = useStore()
  const navigate = useNavigate()
  const home = ROLE_HOME[user?.role] ?? '/admin'

  useEffect(() => {
    const timer = setTimeout(() => navigate(home), 1500)
    return () => clearTimeout(timer)
  }, [navigate, home])

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <Check size={120} strokeWidth={3} className="text-green-600" />
      <p className="mt-8 rounded-xl bg-lime-300 px-5 py-3 text-lg text-brand-dark sm:text-xl">You have signed in successfully!</p>
    </div>
  )
}

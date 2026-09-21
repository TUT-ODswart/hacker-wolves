import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useAuth, DEMO_EMAIL, DEMO_PASSWORD, DEMO_OTP } from '../auth/AuthContext.js'

// Three steps from the design: sign in, then OTP, then success.
export default function AdminLoginModal({ onClose }) {
  const [step, setStep] = useState('login')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border bg-white px-6 py-10 shadow-xl sm:px-12 ${
          step === 'success' ? 'border-lime-400' : 'border-slate-900'
        }`}
      >
        {step !== 'success' && (
          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-500 hover:text-slate-900" aria-label="Close">
            <X size={20} />
          </button>
        )}
        {step === 'login' && <LoginStep onCancel={onClose} onNext={() => setStep('otp')} />}
        {step === 'otp' && <OtpStep onBack={() => setStep('login')} onNext={() => setStep('success')} />}
        {step === 'success' && <SuccessStep />}
      </div>
    </div>
  )
}

function LoginStep({ onCancel, onNext }) {
  const { checkCredentials } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (checkCredentials(email, password)) onNext()
    else setError('Incorrect username or password.')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-5">
      <label className="block">
        <span className="text-2xl text-slate-900">Username</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={DEMO_EMAIL}
          autoComplete="username"
          className="mt-2 w-full rounded-xl bg-slate-200 px-4 py-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block">
        <span className="text-2xl text-slate-900">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl bg-slate-200 px-4 py-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-brand"
        />
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

      <p className="text-center text-xs text-slate-500">
        Demo login: {DEMO_EMAIL} / {DEMO_PASSWORD}
      </p>
    </form>
  )
}

function OtpStep({ onBack, onNext }) {
  const { verifyOtp } = useAuth()
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
    if (verifyOtp(code)) {
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
    // Supports pasting the whole code into one box.
    clean.split('').slice(0, 6 - i).forEach((d, k) => { next[i + k] = d })
    setDigits(next)
    setError('')
    inputs.current[Math.min(i + clean.length, 5)]?.focus()
    submit(next)
  }

  function handleKeyDown(i, e) {
    if (e.key !== 'Backspace') return
    e.preventDefault()
    const next = [...digits]
    if (next[i]) {
      next[i] = ''
    } else if (i > 0) {
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
            ref={(el) => { inputs.current[i] = el }}
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
          <>Resend in <span className="text-red-600">{mm}:{ss}</span></>
        ) : (
          <button onClick={() => setSeconds(600)} className="font-semibold text-brand underline">
            Resend code
          </button>
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
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/admin'), 1500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <Check size={120} strokeWidth={3} className="text-green-600" />
      <p className="mt-8 rounded-xl bg-lime-300 px-5 py-3 text-lg text-brand-dark sm:text-xl">
        You have signed in successfully!
      </p>
    </div>
  )
}

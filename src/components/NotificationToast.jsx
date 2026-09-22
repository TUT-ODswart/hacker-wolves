import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, X } from 'lucide-react'
import { useStore } from '../data/StoreContext.js'

// Pop-up alerts in the corner. Only alerts that arrive while you are signed in pop up;
// older ones stay in the bell. Each one disappears by itself after a few seconds.
const SHOW_FOR_MS = { high: 15000, info: 8000 }
const MAX_VISIBLE = 2

function belongsToUser(n, user) {
  return !!user && (n.roles.includes(user.role) || n.userIds.includes(user.id))
}

export default function NotificationToast() {
  const { state, user, now } = useStore()
  const [since] = useState(now)
  const [dismissed, setDismissed] = useState([])

  const all = state.notifications
    .filter((n) => {
      const at = new Date(n.at).getTime()
      return (
        belongsToUser(n, user) &&
        at > since &&
        now - at < (SHOW_FOR_MS[n.severity] ?? SHOW_FOR_MS.info) &&
        !dismissed.includes(n.id) &&
        !n.readBy.includes(user.id)
      )
    })

  const big = all.filter((n) => n.size !== 'small').slice(0, MAX_VISIBLE)
  const small = all.filter((n) => n.size === 'small').slice(0, MAX_VISIBLE)
  if (big.length === 0 && small.length === 0) return null
  const close = (id) => setDismissed((d) => [...d, id])

  return (
    <>
      {small.length > 0 && (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[1100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-80">
          {small.map((n) => (
            <div key={n.id} role="status" className="pointer-events-auto w-full rounded-2xl border-l-4 border-l-sky-500 bg-white p-3 shadow-lg ring-1 ring-slate-200">
              <div className="flex items-start gap-2">
                <Bell size={18} className="mt-0.5 shrink-0 text-sky-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-600">{n.body}</p>
                  <Link to={n.link} onClick={() => close(n.id)} className="mt-1 inline-block text-xs font-semibold text-brand underline">View</Link>
                </div>
                <button onClick={() => close(n.id)} className="p-0.5 text-slate-400 hover:text-slate-700" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {big.length > 0 && (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[1100] flex flex-col items-center gap-3 sm:top-6">
      {big.map((n) => {
        const high = n.severity === 'high'
        const Icon = high ? AlertTriangle : Bell
        return (
          <div
            key={n.id}
            role="alert"
            className={`pointer-events-auto w-full max-w-3xl overflow-hidden rounded-3xl border-4 bg-white shadow-2xl ${high ? 'border-red-600' : 'border-brand'}`}
          >
            <div className={`flex items-center gap-3 px-6 py-3 text-white ${high ? 'bg-red-600' : 'bg-brand'}`}>
              <Icon size={30} className="shrink-0" />
              <p className="flex-1 text-lg font-extrabold uppercase tracking-wide sm:text-xl">{high ? 'Urgent alert' : 'Alert'}</p>
              <button onClick={() => close(n.id)} className="rounded-full p-1 hover:bg-white/20" aria-label="Close">
                <X size={26} />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{n.title}</p>
              <p className="mt-2 text-lg text-slate-700 sm:text-xl">{n.body}</p>
              <Link
                to={n.link}
                onClick={() => close(n.id)}
                className={`mt-4 inline-block rounded-xl px-5 py-2.5 text-lg font-bold text-white ${high ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'}`}
              >
                View details
              </Link>
            </div>
          </div>
        )
      })}
    </div>
      )}
    </>
  )
}

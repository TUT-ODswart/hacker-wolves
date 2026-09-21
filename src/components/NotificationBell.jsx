import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useStore } from '../data/StoreContext.js'
import { timeAgo } from '../utils/format.js'

function notificationsFor(state, user) {
  if (!user) return []
  return state.notifications.filter((n) => n.roles.includes(user.role) || n.userIds.includes(user.id))
}

export default function NotificationBell({ light = false }) {
  const { state, user, now, actions } = useStore()
  const [open, setOpen] = useState(false)
  const mine = notificationsFor(state, user)
  const unread = mine.filter((n) => !n.readBy.includes(user.id)).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-full p-2 ${light ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="font-bold text-slate-900">Notifications</p>
              {unread > 0 && (
                <button onClick={actions.markAllRead} className="text-xs font-semibold text-brand underline">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {mine.slice(0, 20).map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.link}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-slate-50 ${n.readBy.includes(user.id) ? '' : 'bg-brand-light/60'}`}
                  >
                    <p className={`text-sm font-semibold ${n.severity === 'high' ? 'text-red-700' : 'text-slate-900'}`}>{n.title}</p>
                    <p className="text-xs text-slate-600">{n.body}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.at, now)}</p>
                  </Link>
                </li>
              ))}
              {mine.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

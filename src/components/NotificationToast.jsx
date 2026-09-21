import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext.js'

function belongsToUser(notification, user) {
  return !!user && (notification.roles.includes(user.role) || notification.userIds.includes(user.id))
}

export default function NotificationToast() {
  const { state, user } = useStore()
  const [visible, setVisible] = useState(null)
  const [queue, setQueue] = useState([])
  const knownIds = useRef(null)
  const dismissTimer = useRef(null)

  useEffect(() => {
    const relevant = state.notifications.filter((notification) => belongsToUser(notification, user))
    const ids = new Set(relevant.map((notification) => notification.id))

    if (knownIds.current === null) {
      knownIds.current = ids
      const unread = relevant
        .filter((notification) => !notification.readBy.includes(user.id))
        .reverse()
      if (unread.length > 0) {
        const timer = setTimeout(() => setQueue(unread), 0)
        return () => clearTimeout(timer)
      }
      return
    }

    const unseen = relevant.filter((notification) => !knownIds.current.has(notification.id)).reverse()
    knownIds.current = ids
    if (unseen.length > 0) setQueue((current) => [...current, ...unseen])
  }, [state.notifications, user])

  useEffect(() => {
    if (visible || queue.length === 0) return
    const timer = setTimeout(() => {
      setVisible(queue[0])
      setQueue((current) => current.slice(1))
    }, 0)
    return () => clearTimeout(timer)
  }, [queue, visible])

  useEffect(() => {
    if (!visible) return undefined
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => setVisible(null), 60000)
    return () => clearTimeout(dismissTimer.current)
  }, [visible])

  useEffect(() => () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[1100] flex justify-center">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto w-full max-w-2xl rounded-3xl border bg-white p-6 shadow-2xl ${
          visible.severity === 'high' ? 'border-red-300' : 'border-brand/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <Bell size={28} className={visible.severity === 'high' ? 'mt-0.5 shrink-0 text-red-600' : 'mt-0.5 shrink-0 text-brand'} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold text-slate-900">{visible.title}</p>
            <p className="mt-2 text-base text-slate-600">{visible.body}</p>
            <Link to={visible.link} onClick={() => setVisible(null)} className="mt-3 inline-block text-base font-semibold text-brand underline">
              View details
            </Link>
          </div>
          <button onClick={() => setVisible(null)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss notification">
            <X size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}

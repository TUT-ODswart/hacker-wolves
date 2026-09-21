// Small building blocks used on every page.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { priorityLabel, statusLabel } from '../data/constants.js'
import { resizeImage } from '../utils/format.js'

const badgeStyles = {
  Online: 'bg-green-100 text-green-800',
  Good: 'bg-green-100 text-green-800',
  Normal: 'bg-green-100 text-green-800',
  Warning: 'bg-orange-100 text-orange-800',
  Alert: 'bg-red-100 text-red-800',
  Critical: 'bg-red-100 text-red-800',
  Fault: 'bg-fuchsia-100 text-fuchsia-800',
  Offline: 'bg-slate-200 text-slate-700',
  Unknown: 'bg-slate-200 text-slate-700',
  Unattended: 'bg-orange-100 text-orange-800',
  Pending: 'bg-violet-100 text-violet-800',
  Resolved: 'bg-blue-100 text-blue-800',
  New: 'bg-orange-100 text-orange-800',
  'Crew sent': 'bg-violet-100 text-violet-800',
  Fixed: 'bg-blue-100 text-blue-800',
  Scheduled: 'bg-amber-100 text-amber-800',
  'In progress': 'bg-sky-100 text-sky-800',
  Completed: 'bg-green-100 text-green-800',
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-slate-100 text-slate-700',
  Urgent: 'bg-red-600 text-white',
  Soon: 'bg-amber-500 text-white',
  'Can wait': 'bg-slate-200 text-slate-700',
  Overdue: 'bg-red-600 text-white',
  Escalated: 'bg-red-600 text-white',
  Proactive: 'bg-brand-light text-brand-dark',
  Reactive: 'bg-slate-100 text-slate-700',
  'Sensor repair': 'bg-fuchsia-100 text-fuchsia-800',
  Sensor: 'bg-brand-light text-brand-dark',
  Resident: 'bg-sky-100 text-sky-800',
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-slate-200 text-slate-600',
}

export function Badge({ children, tone }) {
  const key = tone ?? children
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[key] ?? 'bg-slate-100 text-slate-700'}`}>
      {children}
    </span>
  )
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-300 bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-bold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, sub, subTone = 'text-green-600' }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5">
      <p className="text-base text-slate-800 sm:text-lg">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">{value}</p>
      {sub && <p className={`mt-2 text-lg font-extrabold ${subTone}`}>{sub}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
            value === t.value ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t.label}
          {t.count != null && <span className="ml-1 opacity-70">({t.count})</span>}
        </button>
      ))}
    </div>
  )
}

export function Empty({ children }) {
  return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{children}</p>
}

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

export const buttonClass = 'rounded-xl bg-brand px-4 py-2.5 font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40'
export const secondaryButtonClass = 'rounded-xl border-2 border-brand bg-white px-4 py-2 font-bold text-brand hover:bg-brand-light'

export function Field({ label, children, hint }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function PhotoInput({ value, onChange, label = 'Take or upload a photo' }) {
  const [busy, setBusy] = useState(false)

  async function handle(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      onChange(await resizeImage(file))
    } catch {
      onChange(null)
    }
    setBusy(false)
  }

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 p-5 text-slate-500 hover:border-slate-400">
        {value ? (
          <img src={value} alt="" className="max-h-64 w-full rounded-lg object-cover" />
        ) : (
          <>
            <Camera size={28} />
            <span className="text-sm font-semibold">{busy ? 'Processing…' : label}</span>
          </>
        )}
        <input type="file" accept="image/*" capture="environment" onChange={handle} className="hidden" />
      </label>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="mt-1 text-sm text-slate-500 underline">
          Remove photo
        </button>
      )}
    </div>
  )
}

export function Photo({ src, label }) {
  if (!src) {
    return (
      <div className="flex h-36 flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 text-slate-400">
        <Camera size={24} />
        <span className="text-xs">{label ?? 'No photo'}</span>
      </div>
    )
  }
  return <img src={src} alt={label ?? ''} className="h-36 w-full rounded-xl object-cover" />
}

const priorityEmphasis = {
  High: 'bg-red-600 text-white ring-2 ring-red-200',
  Medium: 'bg-amber-500 text-white ring-2 ring-amber-200',
  Low: 'bg-slate-200 text-slate-700',
}

export function PriorityBadge({ p }) {
  if (!p) return null
  const label = priorityLabel(p.level)
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${priorityEmphasis[p.level] ?? 'bg-slate-100 text-slate-700'}`}>
      {label}
    </span>
  )
}

export function StatusBadge({ status }) {
  if (!status) return null
  const label = statusLabel(status)
  return <Badge tone={label}>{label}</Badge>
}

export function BackLink({ to, children }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
      ← {children}
    </Link>
  )
}

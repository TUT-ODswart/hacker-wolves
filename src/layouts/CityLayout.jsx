import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, Boxes, Bell, ListOrdered, Wrench, Inbox, Radio, BarChart3, Menu, X, LogOut,
} from 'lucide-react'

const nav = [
  { to: '/city', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/city/assets', label: 'Assets', icon: Boxes },
  { to: '/city/alerts', label: 'Alerts', icon: Bell },
  { to: '/city/priorities', label: 'Priorities', icon: ListOrdered },
  { to: '/city/maintenance', label: 'Work orders', icon: Wrench },
  { to: '/city/reports', label: 'Citizen reports', icon: Inbox },
  { to: '/city/sensors', label: 'Sensor health', icon: Radio },
  { to: '/city/analytics', label: 'Analytics', icon: BarChart3 },
]

function Brand() {
  return <div className="px-5 py-4 text-lg font-bold text-white">🐺 Hacker Wolves</div>
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
              isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function SwitchRole() {
  return (
    <Link to="/" className="mt-auto flex items-center gap-3 px-6 py-4 text-sm text-slate-400 hover:text-white">
      <LogOut size={18} /> Switch role
    </Link>
  )
}

export default function CityLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop: fixed sidebar */}
      <aside className="hidden bg-slate-900 lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Brand />
        <NavItems />
        <SwitchRole />
      </aside>

      {/* Phone/tablet: top bar with menu button */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 pr-2 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="p-3 text-white" aria-label="Open menu">
          <Menu />
        </button>
      </header>

      {/* Phone/tablet: slide-out menu */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <button onClick={() => setOpen(false)} className="p-3 text-white" aria-label="Close menu">
                <X />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <SwitchRole />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, RadioTower, TriangleAlert, LogOut, Menu, X, RotateCcw } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.js'
import { useData } from '../data/DataContext.js'

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const { incidents, resetDemo } = useData()
  const navigate = useNavigate()

  const unattended = incidents.filter((i) => i.status === 'Unattended').length

  const nav = [
    { to: '/admin', label: 'Dashboard', icon: LayoutGrid, end: true },
    { to: '/admin/sensors', label: 'Sensors', icon: RadioTower },
    { to: '/admin/incidents', label: 'Incidents', icon: TriangleAlert, badge: unattended },
  ]

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleReset() {
    if (window.confirm('Reset all incidents to the original demo data?')) resetDemo()
  }

  const sidebar = (
    <div className="flex h-full flex-col px-4 py-6">
      <nav className="flex flex-col gap-2">
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl border px-4 py-3 text-xl ${
                isActive ? 'border-slate-900 bg-white font-bold text-brand' : 'border-transparent text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={26} />
            <span className="flex-1">{label}</span>
            {badge > 0 && <span className="rounded-full bg-orange-400 px-2 text-sm font-bold text-slate-900">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        <button onClick={handleReset} className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white">
          <RotateCcw size={16} /> Reset demo data
        </button>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xl text-white hover:bg-white/10">
          <LogOut size={26} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden bg-brand lg:fixed lg:inset-y-0 lg:block lg:w-72">{sidebar}</aside>

      {/* Phone / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-brand px-4 lg:hidden">
        <span className="font-bold text-white">Sewage Maintenance</span>
        <button onClick={() => setOpen(true)} className="p-2 text-white" aria-label="Open menu">
          <Menu />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-brand">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 p-2 text-white" aria-label="Close menu">
              <X />
            </button>
            <div className="h-full pt-8">{sidebar}</div>
          </aside>
        </div>
      )}

      <main className="lg:pl-72">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

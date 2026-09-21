import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, TriangleAlert, RadioTower, Users, FlaskConical, UserRound, LogOut, Menu, X, ClipboardList, CloudRain,
} from 'lucide-react'
import { useStore } from '../data/StoreContext.js'
import { ROLES } from '../data/constants.js'
import NotificationBell from '../components/NotificationBell.jsx'
import NotificationToast from '../components/NotificationToast.jsx'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutGrid, end: true, roles: ['admin'] },
  { to: '/admin/incidents', label: 'Incidents', icon: TriangleAlert, roles: ['admin'], badge: 'new' },
  { to: '/admin/sensors', label: 'Sensors', icon: RadioTower, roles: ['admin'], badge: 'faults' },
  { to: '/admin/crews', label: 'Crews & users', icon: Users, roles: ['admin'] },
  { to: '/admin/jobs', label: 'My jobs', icon: ClipboardList, roles: ['technician'] },
  { to: '/admin/simulation', label: 'Demo tools', icon: FlaskConical, roles: ['admin'], demo: true },
]

function NavItems({ items, badges, onNavigate }) {
  return items.map(({ to, label, icon: Icon, end, badge }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-lg ${
          isActive ? 'border-slate-900 bg-white font-bold text-brand' : 'border-transparent text-white hover:bg-white/10'
        }`
      }
    >
      <Icon size={22} />
      <span className="flex-1">{label}</span>
      {badge && badges[badge] > 0 && <span className="rounded-full bg-orange-400 px-2 text-sm font-bold text-slate-900">{badges[badge]}</span>}
    </NavLink>
  ))
}

export default function StaffLayout() {
  const [open, setOpen] = useState(false)
  const { state, analysis, user, auth } = useStore()
  const navigate = useNavigate()

  const badges = {
    new: state.incidents.filter((i) => i.status === 'Unattended').length,
    faults: analysis.statusCounts.Fault + analysis.statusCounts.Offline,
  }
  const mainItems = NAV.filter((n) => n.roles.includes(user.role) && !n.demo)
  const demoItems = NAV.filter((n) => n.roles.includes(user.role) && n.demo)

  function logout() {
    auth.logout()
    navigate('/')
  }

  const close = () => setOpen(false)

  const sidebar = (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
      <p className="px-4 pb-4 text-sm font-bold uppercase tracking-wide text-white/70">Sewage Maintenance</p>
      <nav className="flex flex-col gap-1.5">
        <NavItems items={mainItems} badges={badges} onNavigate={close} />
      </nav>

      {demoItems.length > 0 && (
        <div className="mt-6">
          <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wide text-white/50">Demo only</p>
          <nav className="flex flex-col gap-1.5">
            <NavItems items={demoItems} badges={badges} onNavigate={close} />
          </nav>
        </div>
      )}

      <div className="mt-auto space-y-1 pt-6">
        <NavLink
          to="/admin/profile"
          onClick={close}
          className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-white hover:bg-white/10 ${isActive ? 'bg-white/15' : ''}`}
        >
          <UserRound size={22} />
          <span className="leading-tight">
            <span className="block font-semibold">{user.name}</span>
            <span className="block text-xs text-white/70">{ROLES[user.role]}</span>
          </span>
        </NavLink>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-lg text-white hover:bg-white/10">
          <LogOut size={22} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <NotificationToast />
      <aside className="hidden bg-brand lg:fixed lg:inset-y-0 lg:block lg:w-72">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-brand px-3 lg:hidden">
        <button onClick={() => setOpen(true)} className="p-2 text-white" aria-label="Open menu">
          <Menu />
        </button>
        <span className="font-bold text-white">Sewage Maintenance</span>
        <NotificationBell light />
      </header>

      {open && (
        <div className="fixed inset-0 z-[1001] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-brand">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 p-2 text-white" aria-label="Close menu">
              <X />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <div className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-3 border-b border-slate-200 bg-white/90 px-8 backdrop-blur lg:flex">
          <span className="text-sm text-slate-500">
            {user.name} · {ROLES[user.role]}
          </span>
          <NotificationBell />
        </div>

        {state.settings.rainForecast && (
          <div className="flex items-center gap-2 bg-sky-700 px-4 py-2 text-sm font-semibold text-white sm:px-8">
            <CloudRain size={18} /> Heavy rain forecast. Manholes that are already filling up have moved up the priority list.
          </div>
        )}

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

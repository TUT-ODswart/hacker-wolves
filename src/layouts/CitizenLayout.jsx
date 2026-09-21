import { NavLink, Outlet, Link } from 'react-router-dom'
import { Camera, ClipboardList } from 'lucide-react'

const tabs = [
  { to: '/citizen/report', label: 'Report', icon: Camera },
  { to: '/citizen/my-reports', label: 'My reports', icon: ClipboardList },
]

// Residents will mostly use phones, so this side is designed phone-first
// with a bottom tab bar. On desktop it stays a narrow centred column.
export default function CitizenLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-teal-700 text-white">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <span className="font-bold">🐺 Report a problem</span>
          <Link to="/" className="text-sm text-teal-100 underline">Switch role</Link>
        </div>
      </header>

      <main className="mx-auto max-w-md p-4 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${
                  isActive ? 'text-teal-700' : 'text-slate-500'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

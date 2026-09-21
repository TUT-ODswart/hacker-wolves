import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useStore } from '../data/StoreContext.js'
import { ROLE_HOME } from '../data/constants.js'
import LoginModal from '../components/LoginModal.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report a leak' },
  { to: '/track', label: 'Track a report' },
  { to: '/faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
]

export default function PublicLayout() {
  const [params, setParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useStore()
  const navigate = useNavigate()
  const loginOpen = params.get('login') === '1'

  function openLogin() {
    setMenuOpen(false)
    if (user) {
      navigate(ROLE_HOME[user.role])
      return
    }
    const next = new URLSearchParams(params)
    next.set('login', '1')
    setParams(next)
  }

  function closeLogin() {
    const next = new URLSearchParams(params)
    next.delete('login')
    setParams(next)
  }

  const linkClass = ({ isActive }) => `text-lg font-bold text-white decoration-2 underline-offset-8 hover:underline ${isActive ? 'underline' : ''}`

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 bg-brand">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={() => setMenuOpen((o) => !o)} className="p-2 text-white md:hidden" aria-label="Menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <button onClick={openLogin} className="rounded-full bg-white px-6 py-2 text-lg font-bold text-slate-900 hover:bg-slate-100">
            {user ? 'Dashboard' : 'Admin'}
          </button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/20 px-4 pb-4 pt-2 md:hidden">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `rounded-lg px-3 py-3 font-bold text-white ${isActive ? 'bg-white/15' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        Sewage Maintenance System. Built by Hacker Wolves.
      </footer>

      {loginOpen && <LoginModal onClose={closeLogin} />}
    </div>
  )
}

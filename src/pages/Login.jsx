import { Link } from 'react-router-dom'
import { Building2, Smartphone } from 'lucide-react'

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="text-4xl">🐺</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Hacker Wolves</h1>
          <p className="mt-1 text-sm text-slate-600">
            Find infrastructure problems before they become failures.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link to="/city" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-4 font-semibold text-white hover:bg-slate-800">
            <Building2 size={20} /> Continue as City official
          </Link>
          <Link to="/citizen/report" className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-4 font-semibold text-white hover:bg-teal-600">
            <Smartphone size={20} /> Continue as resident
          </Link>
        </div>
      </div>
    </div>
  )
}

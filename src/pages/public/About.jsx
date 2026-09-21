import { Link } from 'react-router-dom'
import { SENSOR_TYPES } from '../../data/constants.js'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">About the system</h1>
      <p className="mt-4 text-lg text-slate-700">
        Most sewage problems are only found once sewage is already on the street. By then repairs cost more, services are disrupted and people are exposed to health risks.
      </p>
      <p className="mt-4 text-lg text-slate-700">
        This system finds problems early. Sensors watch the most important parts of the sewer network, residents report what they see, and City officials get one clear list of what to fix first.
      </p>

      <h2 className="mt-10 text-2xl font-extrabold text-slate-900">The sensors</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {Object.entries(SENSOR_TYPES).map(([k, s]) => (
          <div key={k} className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-brand">{s.label}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-700">{s.what}</p>
            <p className="mt-2 text-sm text-slate-600">{s.how}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl font-extrabold text-slate-900">Who built it</h2>
      <p className="mt-4 text-lg text-slate-700">Hacker Wolves, a student team, for the Tshwane hackathon.</p>

      <Link to="/report" className="mt-8 inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark">
        Report a sewage leak
      </Link>
    </div>
  )
}

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useData } from '../../data/DataContext.js'
import { formatDateTime } from '../../utils/format.js'

const steps = ['Reported', 'Crew assigned', 'Resolved']
const stepIndex = { Unattended: 0, Pending: 1, Resolved: 2 }

export default function Track() {
  const { incidentById } = useData()
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('ref') ?? '')
  const searched = (params.get('ref') ?? '').toUpperCase()
  const incident = searched ? incidentById(searched) : null

  function handleSubmit(e) {
    e.preventDefault()
    const ref = input.trim().toUpperCase()
    if (ref) setParams({ ref })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Track a report</h1>
      <p className="mt-2 text-slate-600">Enter the reference number you got when you reported.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. INC-1014"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button type="submit" className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-bold text-white hover:bg-brand-dark">
          <Search size={18} /> Track
        </button>
      </form>

      {searched && !incident && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          We couldn't find <strong>{searched}</strong>. Check the number and try again.
        </div>
      )}

      {incident && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">{incident.id}</p>
          <h2 className="text-xl font-extrabold text-slate-900">{incident.type}</h2>
          <p className="mt-1 text-slate-600">
            {incident.area}{incident.address && incident.address !== 'Not given' ? `, ${incident.address}` : ''}
          </p>
          <p className="text-sm text-slate-500">Reported {formatDateTime(incident.reportedAt)}</p>

          <ol className="mt-8 flex items-start">
            {steps.map((label, i) => {
              const done = i <= stepIndex[incident.status]
              return (
                <li key={label} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div className={`h-1 flex-1 ${i === 0 ? 'invisible' : done ? 'bg-brand' : 'bg-slate-200'}`} />
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <div className={`h-1 flex-1 ${i === steps.length - 1 ? 'invisible' : i < stepIndex[incident.status] ? 'bg-brand' : 'bg-slate-200'}`} />
                  </div>
                  <span className={`mt-2 text-xs font-semibold sm:text-sm ${done ? 'text-brand-dark' : 'text-slate-400'}`}>{label}</span>
                </li>
              )
            })}
          </ol>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {incident.status === 'Unattended' && 'Your report has been received and is waiting to be assigned to a crew.'}
            {incident.status === 'Pending' && `${incident.assignedCrew} has been assigned and is working on it.`}
            {incident.status === 'Resolved' && `Fixed on ${formatDateTime(incident.resolvedAt)}. ${incident.resolutionNote}`}
          </div>
        </div>
      )}

      {!searched && (
        <p className="mt-8 text-sm text-slate-500">
          Haven't reported yet? <Link to="/report" className="font-semibold text-brand underline">Report a leak</Link>
        </p>
      )}
    </div>
  )
}

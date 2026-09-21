import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Star } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { formatDateTime } from '../../utils/format.js'

const steps = ['New', 'Crew sent', 'Fixed']
const stepIndex = { Unattended: 0, Pending: 1, Resolved: 2 }

export default function Track() {
  const { state, actions } = useStore()
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('ref') ?? '')
  const searched = (params.get('ref') ?? '').trim().toUpperCase()
  const report = state.reports.find((r) => r.id === searched)
  const incident = state.incidents.find((i) => i.id === (report?.incidentId ?? searched))
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const ref = input.trim().toUpperCase()
    if (ref) setParams({ ref })
  }

  const idx = incident ? stepIndex[incident.status] : 0
  const crew = incident?.crewId ? state.crews.find((c) => c.id === incident.crewId)?.name : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Track a report</h1>
      <p className="mt-2 text-slate-600">Enter the reference number you got when you reported (e.g. RPT-2001).</p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="RPT-2001" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
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
          <p className="text-sm text-slate-500">{report?.id ?? incident.id}</p>
          <h2 className="text-xl font-extrabold text-slate-900">{report?.type ?? incident.type}</h2>
          <p className="mt-1 text-slate-600">{incident.area}{report?.address ? `, ${report.address}` : ''}</p>
          <p className="text-sm text-slate-500">Reported {formatDateTime(report?.createdAt ?? incident.reportedAt)}</p>
          {incident.reportIds.length > 1 && <p className="mt-2 text-sm text-slate-600">{incident.reportIds.length} residents have reported this problem.</p>}

          <ol className="mt-8 flex items-start">
            {steps.map((label, i) => {
              const done = i <= idx
              return (
                <li key={label} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div className={`h-1 flex-1 ${i === 0 ? 'invisible' : done ? 'bg-brand' : 'bg-slate-200'}`} />
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</div>
                    <div className={`h-1 flex-1 ${i === steps.length - 1 ? 'invisible' : i < idx ? 'bg-brand' : 'bg-slate-200'}`} />
                  </div>
                  <span className={`mt-2 text-xs font-semibold sm:text-sm ${done ? 'text-brand-dark' : 'text-slate-400'}`}>{label}</span>
                </li>
              )
            })}
          </ol>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {incident.status === 'Unattended' && 'Your report is new and waiting for a crew.'}
            {incident.status === 'Pending' && `${crew ?? 'A crew'} has been sent and is working on it.`}
            {incident.status === 'Resolved' && `Fixed on ${formatDateTime(incident.resolvedAt)}. ${incident.resolutionNote ?? ''}`}
          </div>

          {incident.status === 'Resolved' && report && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              {report.rating ? (
                <p className="text-sm text-slate-600">
                  Thanks for your feedback: {report.rating.stars}/5{report.rating.comment ? `, "${report.rating.comment}"` : ''}.
                </p>
              ) : (
                <>
                  <p className="font-bold text-slate-900">How did we do?</p>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
                        <Star size={30} className={n <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                      </button>
                    ))}
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Anything to add? (optional)" className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-base" />
                  <button disabled={!stars} onClick={() => actions.rateReport({ reportId: report.id, stars, comment })} className="mt-2 rounded-xl bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-40">
                    Send feedback
                  </button>
                </>
              )}
            </div>
          )}
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

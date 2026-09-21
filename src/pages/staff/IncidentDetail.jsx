import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink, Radio, UserRound } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { incidentPriority } from '../../data/model.js'
import { defaultCrew, isOverdue } from '../../data/helpers.js'
import { can } from '../../data/constants.js'
import { BackLink, Badge, Card, Empty, Field, Photo, PriorityBadge, buttonClass, inputClass } from '../../components/ui.jsx'
import { formatDateTime, timeAgo, toDateInput } from '../../utils/format.js'

export default function IncidentDetail() {
  const { id } = useParams()
  const { state, analysis, now, user, actions } = useStore()
  const incident = state.incidents.find((i) => i.id === id)
  const [crewId, setCrewId] = useState(() => (incident ? defaultCrew(state, incident.area) : ''))
  const [date, setDate] = useState(() => toDateInput(Date.now()))
  const [closing, setClosing] = useState(false)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')

  if (!incident) {
    return (
      <div>
        <BackLink to="/admin/incidents">Back to incidents</BackLink>
        <Empty>Incident {id} not found.</Empty>
      </div>
    )
  }

  const p = incidentPriority(incident, state, analysis)
  const asset = state.assets.find((a) => a.id === incident.assetId)
  const problem = asset ? analysis.assets[asset.id].problem : null
  const evidence = problem?.evidence ?? incident.prediction?.evidence ?? null
  const reports = incident.reportIds.map((rid) => state.reports.find((r) => r.id === rid)).filter(Boolean)
  const wo = state.workOrders.find((w) => w.id === incident.workOrderId)
  const crew = state.crews.find((c) => c.id === incident.crewId)
  const manage = can(user, 'manageIncidents')

  function assign() {
    const [y, m, d] = date.split('-').map(Number)
    actions.assignIncident({ incidentId: incident.id, crewId, scheduledFor: new Date(y, m - 1, d, 8).getTime() })
  }

  return (
    <>
      <BackLink to="/admin/incidents">Back to incidents</BackLink>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{incident.id}</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{incident.title}</h1>
          <p className="text-slate-600">{incident.area}{asset ? ` · ${asset.name}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityBadge p={p} />
          <Badge>{incident.status}</Badge>
          <Badge>{incident.source === 'sensor' ? 'Sensor' : 'Resident'}</Badge>
          {isOverdue(incident, now) && <Badge>Overdue</Badge>}
          {incident.escalated && incident.status === 'Unattended' && <Badge>Escalated</Badge>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Why this priority">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">How likely</p>
                <p className="text-2xl font-extrabold">{p.likelihood}<span className="text-sm text-slate-500">/100</span></p>
                <p className="text-sm text-slate-600">{p.reason}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">How bad if it fails</p>
                <p className="text-2xl font-extrabold">{p.impact}<span className="text-sm text-slate-500">/5</span></p>
                <p className="text-sm text-slate-600">{p.impactNote}</p>
              </div>
              <div className="rounded-xl bg-brand-light p-3">
                <p className="text-xs text-brand-dark">Priority score</p>
                <p className="text-2xl font-extrabold text-brand-dark">{p.score}<span className="text-sm">/100</span></p>
                <p className="text-sm text-brand-dark">{p.level} priority</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Priority = how likely × how bad. A problem near a clinic ranks above the same problem on a quiet street.</p>
          </Card>

          {evidence && (
            <Card title={problem ? `${problem.label} (${problem.confidence} confidence)` : 'What the sensors showed'}>
              {problem && <p className="mb-2 text-sm font-semibold text-slate-700">{problem.where}</p>}
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {evidence.map((e) => <li key={e}>{e}</li>)}
              </ul>
              {asset && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {state.sensors.filter((s) => s.assetId === asset.id).map((s) => (
                    <Link key={s.id} to={`/admin/sensors/${s.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-light">
                      {s.id} readings →
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )}

          {reports.length > 0 && (
            <Card title={`Resident reports (${reports.length})`}>
              <div className="grid gap-4 sm:grid-cols-2">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 p-3">
                    <Photo src={r.photo} />
                    <p className="mt-2 text-sm font-semibold">{r.type}</p>
                    <p className="text-xs text-slate-500">{r.id} · {timeAgo(r.createdAt, now)} · {r.name || 'Anonymous'}{r.phone && r.consent ? ` · ${r.phone}` : ''}</p>
                    {r.address && <p className="text-sm text-slate-600">{r.address}</p>}
                    {r.description && <p className="mt-1 text-sm text-slate-700">{r.description}</p>}
                    {r.rating && <p className="mt-1 text-xs text-amber-700">Rated the repair {r.rating.stars}/5</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Details">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Reported</dt>
                <dd>{formatDateTime(incident.reportedAt)} ({timeAgo(incident.reportedAt, now)})</dd>
              </div>
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd className="flex items-center gap-1">
                  {incident.source === 'sensor' ? <Radio size={14} /> : <UserRound size={14} />}
                  {incident.source === 'sensor' ? 'Detected by sensors' : 'Reported by residents'}
                </dd>
              </div>
              {incident.status !== 'Resolved' && (
                <div>
                  <dt className="text-slate-500">Response due</dt>
                  <dd className={isOverdue(incident, now) ? 'font-bold text-red-600' : ''}>{formatDateTime(incident.dueAt)} ({timeAgo(incident.dueAt, now)})</dd>
                </div>
              )}
              {asset && (
                <div>
                  <dt className="text-slate-500">Location</dt>
                  <dd>
                    <Link to={`/admin/assets/${asset.id}`} className="font-semibold text-brand underline">{asset.name}</Link>, {asset.landmark}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Map</dt>
                <dd>
                  <a href={`https://www.google.com/maps?q=${incident.lat},${incident.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand underline">
                    Open in Google Maps <ExternalLink size={14} />
                  </a>
                </dd>
              </div>
              {crew && (
                <div>
                  <dt className="text-slate-500">Crew</dt>
                  <dd>{crew.name}</dd>
                </div>
              )}
              {wo && (
                <div>
                  <dt className="text-slate-500">Work order</dt>
                  <dd>
                    <Link to={`/admin/work-orders/${wo.id}`} className="font-semibold text-brand underline">{wo.id}</Link> <Badge>{wo.status}</Badge>
                  </dd>
                </div>
              )}
            </dl>
            {incident.description && <p className="mt-4 text-sm text-slate-700">{incident.description}</p>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Actions">
            {incident.status === 'Unattended' && manage && !closing && (
              <div className="space-y-3">
                <Field label="Assign to crew">
                  <select value={crewId} onChange={(e) => setCrewId(e.target.value)} className={inputClass}>
                    {state.crews.filter((c) => c.active).map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.area})</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </Field>
                <button onClick={assign} className={`w-full ${buttonClass}`}>Assign and create work order</button>
                <button onClick={() => setClosing(true)} className="w-full text-sm text-slate-500 underline">Close without a repair (false alarm)</button>
              </div>
            )}
            {incident.status === 'Unattended' && manage && closing && (
              <div className="space-y-3">
                <Field label="Why close it?">
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Inspected, no problem found" className={inputClass} />
                </Field>
                <button onClick={() => actions.closeIncident({ incidentId: incident.id, reason })} className={`w-full ${buttonClass}`}>Close incident</button>
                <button onClick={() => setClosing(false)} className="w-full text-sm text-slate-500 underline">Cancel</button>
              </div>
            )}
            {incident.status === 'Unattended' && !manage && <p className="text-sm text-slate-600">Waiting for a supervisor to assign a crew.</p>}
            {incident.status === 'Pending' && (
              <p className="text-sm text-slate-700">
                {crew?.name} is handling this. {wo && <Link to={`/admin/work-orders/${wo.id}`} className="font-semibold text-brand underline">Open {wo.id}</Link>}
              </p>
            )}
            {incident.status === 'Resolved' && (
              <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                Resolved {formatDateTime(incident.resolvedAt)}.<br />
                {incident.resolutionNote}
              </div>
            )}
          </Card>

          <Card title="Internal comments">
            <ul className="space-y-3">
              {incident.comments.map((c, idx) => (
                <li key={idx} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="text-slate-800">{c.text}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.user} · {timeAgo(c.at, now)}</p>
                </li>
              ))}
              {incident.comments.length === 0 && <li className="text-sm text-slate-500">No comments yet.</li>}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!comment.trim()) return
                actions.addComment({ incidentId: incident.id, text: comment.trim() })
                setComment('')
              }}
              className="mt-3 flex gap-2"
            >
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note for the team" className={inputClass} />
              <button className={buttonClass}>Add</button>
            </form>
          </Card>

          <Card title="Timeline">
            <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
              {incident.timeline.map((t, idx) => (
                <li key={idx} className="relative">
                  <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-brand" />
                  <p className="text-sm text-slate-900">{t.text}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(t.at)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}

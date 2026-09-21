import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navigation } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { can } from '../../data/constants.js'
import { BackLink, Badge, Card, Empty, Field, Photo, PhotoInput, buttonClass, inputClass } from '../../components/ui.jsx'
import { formatDate, formatDateTime } from '../../utils/format.js'

export default function WorkOrderDetail() {
  const { id } = useParams()
  const { state, user, actions } = useStore()
  const wo = state.workOrders.find((w) => w.id === id)
  const [before, setBefore] = useState(null)
  const [after, setAfter] = useState(null)
  const [notes, setNotes] = useState('')

  const back = user.role === 'technician' ? '/admin/jobs' : '/admin/work-orders'
  if (!wo) {
    return (
      <div>
        <BackLink to={back}>Back</BackLink>
        <Empty>Work order {id} not found.</Empty>
      </div>
    )
  }

  const asset = state.assets.find((a) => a.id === wo.assetId)
  const crew = state.crews.find((c) => c.id === wo.crewId)
  const members = state.users.filter((u) => u.crewId === wo.crewId && u.active)
  const incident = state.incidents.find((i) => i.id === wo.incidentId)
  const reports = incident ? incident.reportIds.map((r) => state.reports.find((x) => x.id === r)).filter(Boolean) : []
  const canWork = can(user, 'planWork') || (user.role === 'technician' && user.crewId === wo.crewId)

  return (
    <>
      <BackLink to={back}>Back to {user.role === 'technician' ? 'my jobs' : 'work orders'}</BackLink>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{wo.id}</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{wo.title}</h1>
          <p className="text-slate-600">{asset?.name}, {asset?.landmark}, {asset?.area}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{wo.kind}</Badge>
          <Badge>{wo.status}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Job details">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Crew</dt><dd>{crew?.name} ({members.map((m) => m.name).join(', ') || 'no members'})</dd></div>
              <div><dt className="text-slate-500">Scheduled</dt><dd>{formatDate(wo.scheduledFor)}</dd></div>
              <div><dt className="text-slate-500">Created by</dt><dd>{wo.createdBy}, {formatDateTime(wo.createdAt)}</dd></div>
              {wo.startedAt && <div><dt className="text-slate-500">Started</dt><dd>{formatDateTime(wo.startedAt)}</dd></div>}
              {wo.completedAt && <div><dt className="text-slate-500">Completed</dt><dd>{formatDateTime(wo.completedAt)}</dd></div>}
              {asset && <div><dt className="text-slate-500">Manhole depth</dt><dd>{asset.depthCm} cm</dd></div>}
              {wo.sensorId && <div><dt className="text-slate-500">Sensor</dt><dd><Link to={`/admin/sensors/${wo.sensorId}`} className="font-semibold text-brand underline">{wo.sensorId}</Link></dd></div>}
            </dl>
            {asset && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${asset.lat},${asset.lng}`}
                target="_blank"
                rel="noreferrer"
                className={`mt-4 inline-flex items-center gap-2 ${buttonClass}`}
              >
                <Navigation size={18} /> Directions
              </a>
            )}
          </Card>

          {incident && (
            <Card title={`Incident ${incident.id}`} action={user.role !== 'technician' && <Link to={`/admin/incidents/${incident.id}`} className="text-sm font-semibold text-brand underline">Open</Link>}>
              <p className="text-sm text-slate-700">{incident.description}</p>
              {incident.prediction?.evidence && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {incident.prediction.evidence.map((e) => <li key={e}>{e}</li>)}
                </ul>
              )}
              {reports.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {reports.map((r) => (
                    <div key={r.id}>
                      <Photo src={r.photo} label="Resident sent no photo" />
                      <p className="mt-1 text-xs text-slate-500">{r.id}: {r.description || r.type}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card title="Before and after">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-semibold text-slate-600">Before</p>
                <Photo src={wo.beforePhoto} />
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-slate-600">After</p>
                <Photo src={wo.afterPhoto} />
              </div>
            </div>
            {wo.notes && <p className="mt-3 text-sm text-slate-700">Notes: {wo.notes}</p>}
          </Card>
        </div>

        <div>
          <Card title="Update job">
            {!canWork && <p className="text-sm text-slate-600">Only {crew?.name} or a supervisor can update this job.</p>}
            {canWork && wo.status === 'Scheduled' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Take a photo when you arrive, then start the job.</p>
                <PhotoInput value={before} onChange={setBefore} label="Before photo (optional)" />
                <button onClick={() => actions.startWorkOrder({ woId: wo.id, beforePhoto: before })} className={`w-full ${buttonClass}`}>Start job</button>
              </div>
            )}
            {canWork && wo.status === 'In progress' && (
              <div className="space-y-3">
                <PhotoInput value={after} onChange={setAfter} label="After photo" />
                <Field label="What was done?">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Cleared fat and rags 30 m downstream" className={inputClass} />
                </Field>
                <button onClick={() => actions.completeWorkOrder({ woId: wo.id, afterPhoto: after, notes })} className={`w-full ${buttonClass}`}>
                  Mark job complete
                </button>
                <p className="text-xs text-slate-500">Completing the job resolves the incident and texts the residents who reported it.</p>
              </div>
            )}
            {wo.status === 'Completed' && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">Completed {formatDateTime(wo.completedAt)}.</p>}
          </Card>
        </div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Navigation } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { can } from '../../data/constants.js'
import { BackLink, Card, Empty, Field, Photo, PhotoInput, StatusBadge, buttonClass, inputClass } from '../../components/ui.jsx'
import { formatDate, formatDateTime } from '../../utils/format.js'

export default function JobDetail() {
  const { id } = useParams()
  const { state, user, actions } = useStore()
  const job = state.incidents.find((i) => i.id === id)
  const [before, setBefore] = useState(null)
  const [after, setAfter] = useState(null)
  const [notes, setNotes] = useState('')

  if (!job) {
    return (
      <div>
        <BackLink to="/admin/jobs">Back to my jobs</BackLink>
        <Empty>Job {id} not found.</Empty>
      </div>
    )
  }

  const asset = state.assets.find((a) => a.id === job.assetId)
  const crew = state.crews.find((c) => c.id === job.crewId)
  const members = state.users.filter((u) => u.crewId === job.crewId && u.active)
  const reports = job.reportIds.map((r) => state.reports.find((x) => x.id === r)).filter(Boolean)
  const canWork = can(user, 'planWork') || (user.role === 'technician' && user.crewId === job.crewId)
  const started = !!job.startedAt
  const fixed = job.status === 'Resolved'

  return (
    <>
      <BackLink to="/admin/jobs">Back to my jobs</BackLink>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{job.title}</h1>
          <p className="text-xs text-slate-400">{job.id}</p>
          <p className="text-slate-600">{asset?.name}, {asset?.landmark}, {asset?.area}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Job details">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Crew</dt><dd>{crew?.name} ({members.map((m) => m.name).join(', ') || 'no members'})</dd></div>
              {job.scheduledFor && <div><dt className="text-slate-500">Scheduled</dt><dd>{formatDate(job.scheduledFor)}</dd></div>}
              {job.startedAt && <div><dt className="text-slate-500">Started</dt><dd>{formatDateTime(job.startedAt)}</dd></div>}
              {job.resolvedAt && <div><dt className="text-slate-500">Fixed</dt><dd>{formatDateTime(job.resolvedAt)}</dd></div>}
              {asset && <div><dt className="text-slate-500">Manhole depth</dt><dd>{asset.depthCm} cm</dd></div>}
              {job.sensorId && <div><dt className="text-slate-500">Sensor</dt><dd>{job.sensorId}</dd></div>}
            </dl>
            {job.description && <p className="mt-4 text-sm text-slate-700">{job.description}</p>}
            {job.prediction?.evidence && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {job.prediction.evidence.map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}
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

          {reports.length > 0 && (
            <Card title="Resident photos">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {reports.map((r) => (
                  <div key={r.id}>
                    <Photo src={r.photo} label="No photo" />
                    <p className="mt-1 text-xs text-slate-500">{r.description || r.type}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(job.beforePhoto || job.afterPhoto || job.notes) && (
            <Card title="Before and after">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-600">Before</p>
                  <Photo src={job.beforePhoto} />
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-600">After</p>
                  <Photo src={job.afterPhoto} />
                </div>
              </div>
              {job.notes && <p className="mt-3 text-sm text-slate-700">Notes: {job.notes}</p>}
            </Card>
          )}
        </div>

        <div>
          <Card title="Update job">
            {!canWork && <p className="text-sm text-slate-600">Only {crew?.name} can update this job.</p>}
            {canWork && !fixed && !started && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Optional: take a photo when you arrive.</p>
                <PhotoInput value={before} onChange={setBefore} label="Before photo (optional)" />
                <button onClick={() => actions.startJob({ incidentId: job.id, beforePhoto: before })} className={`w-full py-4 text-lg ${buttonClass}`}>
                  Start job
                </button>
              </div>
            )}
            {canWork && !fixed && started && (
              <div className="space-y-3">
                <PhotoInput value={after} onChange={setAfter} label="After photo (optional)" />
                <Field label="Short note (optional)">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Cleared fat and rags" className={inputClass} />
                </Field>
                <button onClick={() => actions.completeJob({ incidentId: job.id, afterPhoto: after, notes })} className={`w-full py-4 text-lg ${buttonClass}`}>
                  Mark as fixed
                </button>
              </div>
            )}
            {fixed && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">Fixed {formatDateTime(job.resolvedAt)}.</p>}
          </Card>
        </div>
      </div>
    </>
  )
}

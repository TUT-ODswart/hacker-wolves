import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, ExternalLink, Radio, User } from 'lucide-react'
import { useData } from '../../data/DataContext.js'
import { CREWS, SENSOR_TYPES } from '../../data/seed.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatDateTime, timeAgo } from '../../utils/format.js'

export default function IncidentDetail() {
  const { id } = useParams()
  const { incidentById, assignCrew, resolveIncident } = useData()
  const incident = incidentById(id)
  const [crew, setCrew] = useState(CREWS[0])
  const [note, setNote] = useState('')

  if (!incident) {
    return (
      <div>
        <p className="text-lg text-slate-700">Incident {id} not found.</p>
        <Link to="/admin/incidents" className="mt-4 inline-block font-semibold text-brand underline">Back to incidents</Link>
      </div>
    )
  }

  const isSensor = incident.source === 'sensor'
  const sensorType = incident.reading ? SENSOR_TYPES[incident.reading.type] : null

  return (
    <>
      <Link to="/admin/incidents" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to incidents
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{incident.id}</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{incident.type}</h1>
          <p className="text-slate-600">{incident.area}, {incident.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={incident.severity} />
          <StatusBadge status={incident.status} />
          <StatusBadge status={isSensor ? 'Sensor' : 'Resident'} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <section className="rounded-2xl border border-slate-300 bg-white p-5">
            <h2 className="font-bold text-slate-900">Details</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Reported</dt>
                <dd className="text-slate-900">{formatDateTime(incident.reportedAt)} ({timeAgo(incident.reportedAt)})</dd>
              </div>
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd className="flex items-center gap-1 text-slate-900">
                  {isSensor ? <Radio size={14} /> : <User size={14} />}
                  {isSensor ? `Sensor ${incident.sensorId}` : incident.reporter?.name ?? 'Anonymous'}
                </dd>
              </div>
              {!isSensor && (
                <div>
                  <dt className="text-slate-500">Contact</dt>
                  <dd className="text-slate-900">{incident.reporter?.phone ?? 'Not given'}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Map</dt>
                <dd>
                  <a
                    href={`https://www.google.com/maps?q=${incident.lat},${incident.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand underline"
                  >
                    Open in Google Maps <ExternalLink size={14} />
                  </a>
                </dd>
              </div>
              {incident.assignedCrew && (
                <div>
                  <dt className="text-slate-500">Assigned crew</dt>
                  <dd className="text-slate-900">{incident.assignedCrew}</dd>
                </div>
              )}
            </dl>
            {incident.description && (
              <>
                <h3 className="mt-5 text-sm text-slate-500">Description</h3>
                <p className="mt-1 text-slate-800">{incident.description}</p>
              </>
            )}
          </section>

          {/* Sensor reading */}
          {sensorType && (
            <section className="rounded-2xl border border-slate-300 bg-white p-5">
              <h2 className="font-bold text-slate-900">Sensor reading</h2>
              <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
                <div>
                  <p className="text-sm text-slate-500">{sensorType.label}</p>
                  <p className="text-3xl font-extrabold text-red-600">
                    {incident.reading.value} <span className="text-lg">{sensorType.unit}</span>
                  </p>
                </div>
                <p className="pb-1 text-sm text-slate-600">
                  Alert level: {sensorType.below ? 'below' : 'above'} {sensorType.threshold} {sensorType.unit}
                </p>
              </div>
              <ReadingBar value={incident.reading.value} threshold={sensorType.threshold} below={sensorType.below} />
              <p className="mt-3 text-sm text-slate-600">{sensorType.explanation}</p>
            </section>
          )}

          {/* Photo */}
          {!isSensor && (
            <section className="rounded-2xl border border-slate-300 bg-white p-5">
              <h2 className="font-bold text-slate-900">Photo from resident</h2>
              {incident.photo ? (
                <img src={incident.photo} alt="Photo of the reported problem" className="mt-3 max-h-96 w-full rounded-xl object-cover" />
              ) : (
                <div className="mt-3 flex h-40 flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-500">
                  <Camera size={28} />
                  <span className="text-sm">No photo provided</span>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Actions */}
          <section className="rounded-2xl border border-slate-300 bg-white p-5">
            <h2 className="font-bold text-slate-900">Actions</h2>

            {incident.status === 'Unattended' && (
              <div className="mt-3 space-y-3">
                <label className="block text-sm text-slate-600">
                  Assign a crew
                  <select value={crew} onChange={(e) => setCrew(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base">
                    {CREWS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <button onClick={() => assignCrew(incident.id, crew)} className="w-full rounded-xl bg-brand py-3 font-bold text-white hover:bg-brand-dark">
                  Assign crew
                </button>
              </div>
            )}

            {incident.status === 'Pending' && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-600">{incident.assignedCrew} is working on this.</p>
                <label className="block text-sm text-slate-600">
                  What was done?
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Cleared blockage 30 m downstream"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base"
                  />
                </label>
                <button onClick={() => resolveIncident(incident.id, note)} className="w-full rounded-xl bg-brand py-3 font-bold text-white hover:bg-brand-dark">
                  Mark as resolved
                </button>
              </div>
            )}

            {incident.status === 'Resolved' && (
              <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                Resolved {formatDateTime(incident.resolvedAt)} by {incident.assignedCrew}.
                <br />
                {incident.resolutionNote}
              </div>
            )}
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-slate-300 bg-white p-5">
            <h2 className="font-bold text-slate-900">Timeline</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
              {incident.timeline.map((t, idx) => (
                <li key={idx} className="relative">
                  <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-brand" />
                  <p className="text-sm text-slate-900">{t.text}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(t.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  )
}

// Shows how far past the alert level the reading is.
function ReadingBar({ value, threshold, below }) {
  const max = below ? threshold * 1.6 : threshold * 1.4
  const valuePct = Math.min(100, (value / max) * 100)
  const thresholdPct = (threshold / max) * 100

  return (
    <div className="relative mt-4 h-3 rounded-full bg-slate-200">
      <div className="h-3 rounded-full bg-red-500" style={{ width: `${valuePct}%` }} />
      <div className="absolute -top-1 h-5 w-0.5 bg-slate-900" style={{ left: `${thresholdPct}%` }} title="Alert level" />
    </div>
  )
}

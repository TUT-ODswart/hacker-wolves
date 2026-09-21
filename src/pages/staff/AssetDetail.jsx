import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { SENSOR_TYPES, can } from '../../data/constants.js'
import { defaultCrew } from '../../data/helpers.js'
import NetworkMap from '../../components/NetworkMap.jsx'
import { BackLink, Badge, Card, Empty, PriorityBadge, buttonClass } from '../../components/ui.jsx'
import { DAY, formatDate } from '../../utils/format.js'

export default function AssetDetail() {
  const { id } = useParams()
  const { state, analysis, now, user, actions } = useStore()
  const [planned, setPlanned] = useState(null)
  const asset = state.assets.find((a) => a.id === id)
  if (!asset) {
    return (
      <div>
        <BackLink to="/admin/assets">Back to network</BackLink>
        <Empty>{id} not found.</Empty>
      </div>
    )
  }

  const x = analysis.assets[asset.id]
  const sensors = state.sensors.filter((s) => s.assetId === asset.id)
  const upstream = state.assets.filter((a) => a.downstreamId === asset.id)
  const downstream = state.assets.find((a) => a.id === asset.downstreamId)
  const incidents = state.incidents.filter((i) => i.assetId === asset.id).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
  const jobs = state.workOrders.filter((w) => w.assetId === asset.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const qrLink = `${window.location.origin}/report?asset=${asset.id}`

  function plan() {
    const woId = actions.createWorkOrder({ assetId: asset.id, kind: 'Planned', title: `Routine jetting and inspection, ${asset.landmark}`, crewId: defaultCrew(state, asset.area), scheduledFor: now + 3 * DAY })
    setPlanned(woId)
  }

  return (
    <>
      <BackLink to="/admin/assets">Back to network</BackLink>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{asset.type === 'pump_station' ? 'Pump station' : 'Manhole'} · {asset.area}</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{asset.id}, {asset.landmark}</h1>
        </div>
        <div className="flex gap-2">
          <Badge>{x.condition}</Badge>
          {x.problem && <PriorityBadge p={{ level: x.level, score: x.score }} />}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {x.problem ? (
            <Card title={`${x.problem.label} (${x.problem.confidence} confidence)`}>
              <p className="mb-2 text-sm font-semibold text-slate-700">{x.problem.where}. {x.problem.summary}.</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {x.problem.evidence.map((e) => <li key={e}>{e}</li>)}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Risk {x.score} = how likely ({x.likelihood}/100) × importance ({asset.criticality}/5, {asset.criticalityNote.toLowerCase()}).
              </p>
            </Card>
          ) : (
            <Card title="Condition">
              <p className="text-sm text-slate-700">{x.condition === 'Unknown' ? 'None of the sensors here are working, so we cannot see this spot. Resident reports are the only cover until they are fixed.' : 'Everything looks normal here.'}</p>
            </Card>
          )}

          <Card title={`Sensors (${sensors.length})`}>
            {sensors.length === 0 && <Empty>No sensors here. This spot relies on inspections and resident reports.</Empty>}
            <ul className="divide-y divide-slate-100">
              {sensors.map((s) => {
                const sx = analysis.sensors[s.id]
                const r = sx.latest ?? sx.lastKnown
                return (
                  <li key={s.id}>
                    <Link to={`/admin/sensors/${s.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                      <span className="w-16 font-bold text-brand">{s.id}</span>
                      <span className="flex-1">{SENSOR_TYPES[s.type].label}{sx.faultReason && <span className="block text-xs text-fuchsia-700">{sx.faultReason}</span>}</span>
                      <span className="text-sm">{r?.value != null ? `${r.value} ${SENSOR_TYPES[s.type].unit}` : '—'}</span>
                      <Badge>{sx.status}</Badge>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card title="Map">
            <NetworkMap className="h-72" focus={asset} showToggles={false} />
          </Card>

          <Card title="History">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-600">Incidents ({incidents.length})</p>
                <ul className="space-y-1 text-sm">
                  {incidents.slice(0, 8).map((i) => (
                    <li key={i.id}>
                      <Link to={`/admin/incidents/${i.id}`} className="text-brand underline">{i.id}</Link> {i.type}, {formatDate(i.reportedAt)} <Badge>{i.status}</Badge>
                    </li>
                  ))}
                  {incidents.length === 0 && <li className="text-slate-500">None</li>}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-600">Work orders ({jobs.length})</p>
                <ul className="space-y-1 text-sm">
                  {jobs.slice(0, 8).map((w) => (
                    <li key={w.id}>
                      <Link to={`/admin/work-orders/${w.id}`} className="text-brand underline">{w.id}</Link> {w.kind}, {formatDate(w.scheduledFor)} <Badge>{w.status}</Badge>
                    </li>
                  ))}
                  {jobs.length === 0 && <li className="text-slate-500">None</li>}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Importance</dt><dd className="text-right">{asset.criticality}/5, {asset.criticalityNote}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Depth</dt><dd>{asset.depthCm} cm</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Installed</dt><dd>{asset.installedYear}</dd></div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Flows from</dt>
                <dd className="text-right">{upstream.length ? upstream.map((u) => <Link key={u.id} to={`/admin/assets/${u.id}`} className="ml-1 text-brand underline">{u.id}</Link>) : 'Start of line'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Flows to</dt>
                <dd>{downstream ? <Link to={`/admin/assets/${downstream.id}`} className="text-brand underline">{downstream.id}</Link> : 'Treatment works'}</dd>
              </div>
            </dl>
            {can(user, 'planWork') && (
              <div className="mt-4">
                {planned ? (
                  <p className="text-sm">Created <Link to={`/admin/work-orders/${planned}`} className="font-semibold text-brand underline">{planned}</Link>.</p>
                ) : (
                  <button onClick={plan} className={`w-full ${buttonClass}`}>Plan maintenance here</button>
                )}
              </div>
            )}
          </Card>

          <Card title="Resident QR code">
            <div className="flex gap-3">
              <QrCode size={40} className="shrink-0 text-brand" />
              <p className="text-sm text-slate-600">A sticker on this manhole cover links residents straight to the report form, with the location filled in.</p>
            </div>
            <a href={qrLink} target="_blank" rel="noreferrer" className="mt-3 block break-all rounded-lg bg-slate-50 p-2 font-mono text-xs text-brand underline">{qrLink}</a>
          </Card>
        </div>
      </div>
    </>
  )
}

import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts'
import { useStore } from '../../data/StoreContext.js'
import { incidentPriority } from '../../data/model.js'
import { Card, Empty, PriorityBadge } from '../../components/ui.jsx'
import NetworkMap from '../../components/NetworkMap.jsx'
import { DAY, timeAgo } from '../../utils/format.js'

const CHART_COLORS = { Fixed: '#4a7ef5', 'Crew sent': '#b18cf2', New: '#f2b56b' }

export default function AdminHome() {
  const { state, analysis, now } = useStore()

  const counts = {
    Fixed: state.incidents.filter((i) => i.status === 'Resolved').length,
    'Crew sent': state.incidents.filter((i) => i.status === 'Pending').length,
    New: state.incidents.filter((i) => i.status === 'Unattended').length,
  }
  const open = counts['Crew sent'] + counts.New
  const working = state.incidents.filter((i) => i.status === 'Pending' && i.startedAt).length
  const fixed30 = state.incidents.filter((i) => i.status === 'Resolved' && i.resolvedAt && now - new Date(i.resolvedAt).getTime() < 30 * DAY).length
  const chartData = [
    { name: 'Still open', New: counts.New, 'Crew sent': counts['Crew sent'] },
    { name: 'Fixed (last 30 days)', Fixed: fixed30 },
  ]

  const newIncidents = state.incidents
    .filter((i) => i.status === 'Unattended')
    .map((i) => ({ ...i, p: incidentPriority(i, state, analysis) }))
    .sort((a, b) => b.p.score - a.p.score)

  const predicted = state.assets
    .map((a) => ({ asset: a, x: analysis.assets[a.id] }))
    .filter(({ x }) => x.problem)
    .sort((a, b) => b.x.score - a.x.score)

  const brokenSensors = state.sensors
    .map((s) => ({ s, x: analysis.sensors[s.id], a: state.assets.find((a) => a.id === s.assetId) }))
    .filter(({ x, s }) => !x.healthy || s.battery < 20)

  const sixMonths = now - 180 * DAY
  const fixed = state.incidents.filter(
    (i) => i.status === 'Resolved' && i.kind !== 'Sensor repair' && i.resolvedAt && new Date(i.resolvedAt).getTime() >= sixMonths,
  )
  const beforeOverflow = fixed.filter((i) => i.kind === 'Proactive').length

  return (
    <>
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-slate-600">What needs a crew today.</p>

      <p className="mt-4 rounded-2xl bg-brand-light px-4 py-3 text-sm font-semibold text-brand-dark">
        {beforeOverflow} of {fixed.length} incidents fixed before overflowing in the last 6 months.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card title="Jobs" className="xl:col-span-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Link to="/admin/incidents?tab=Still%20open" className="rounded-xl bg-red-50 p-3 hover:ring-2 hover:ring-red-200">
              <p className="text-3xl font-extrabold text-red-700">{open}</p>
              <p className="text-xs font-semibold text-red-800">Still open</p>
            </Link>
            <Link to="/admin/incidents?tab=Crew%20sent" className="rounded-xl bg-violet-50 p-3 hover:ring-2 hover:ring-violet-200">
              <p className="text-3xl font-extrabold text-violet-700">{counts['Crew sent']}</p>
              <p className="text-xs font-semibold text-violet-800">Crew sent</p>
            </Link>
            <Link to="/admin/incidents?tab=Fixed" className="rounded-xl bg-blue-50 p-3 hover:ring-2 hover:ring-blue-200">
              <p className="text-3xl font-extrabold text-blue-700">{fixed30}</p>
              <p className="text-xs font-semibold text-blue-800">Fixed (30 days)</p>
            </Link>
          </div>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="New" stackId="a" fill={CHART_COLORS.New} isAnimationActive={false} />
                <Bar dataKey="Crew sent" stackId="a" fill={CHART_COLORS['Crew sent']} isAnimationActive={false} />
                <Bar dataKey="Fixed" stackId="a" fill={CHART_COLORS.Fixed} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {open} still open: {counts.New} waiting for a crew, {counts['Crew sent']} with a crew{working > 0 ? ` (${working} working on site now)` : ''}.
          </p>
        </Card>

        <Card title="New incidents" className="xl:col-span-3" action={<Link to="/admin/incidents" className="text-sm font-semibold text-brand underline">All incidents</Link>}>
          {newIncidents.length === 0 && <Empty>No new incidents waiting for a crew.</Empty>}
          <ul className="divide-y divide-slate-100">
            {newIncidents.slice(0, 5).map((i) => (
              <li key={i.id}>
                <Link to={`/admin/incidents/${i.id}`} className="flex flex-col gap-1 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3">
                  <span className="flex-1 font-semibold text-slate-900">{i.title}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <PriorityBadge p={i.p} />
                    <span className="text-xs text-slate-500">{timeAgo(i.reportedAt, now)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Predicted incidents" action={<Link to="/admin/incidents?tab=New" className="text-sm font-semibold text-brand underline">Incidents</Link>}>
          <p className="-mt-2 mb-3 text-sm text-slate-500">From sensors, before sewage reaches the street.</p>
          {predicted.length === 0 && <Empty>No incidents predicted right now.</Empty>}
          <ul className="divide-y divide-slate-100">
            {predicted.slice(0, 5).map(({ asset, x }) => {
              const openInc = state.incidents.find((i) => i.assetId === asset.id && i.status !== 'Resolved')
              return (
                <li key={asset.id}>
                  <Link
                    to={openInc ? `/admin/incidents/${openInc.id}` : `/admin/sensors/${state.sensors.find((s) => s.assetId === asset.id)?.id}`}
                    className="flex flex-col gap-1 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="flex-1">
                      <span className="block font-semibold text-slate-900">{x.problem.label} at {asset.landmark}</span>
                      <span className="text-sm text-slate-500">{asset.name}, {asset.area}</span>
                    </span>
                    <PriorityBadge p={{ level: x.level, score: x.score }} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card title="Broken sensors" action={<Link to="/admin/sensors" className="text-sm font-semibold text-brand underline">All sensors</Link>}>
          {brokenSensors.length === 0 && <Empty>All sensors look fine.</Empty>}
          <ul className="divide-y divide-slate-100">
            {brokenSensors.slice(0, 5).map(({ s, x, a }) => (
              <li key={s.id}>
                <Link to={`/admin/sensors/${s.id}`} className="flex flex-col gap-1 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3">
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-900">{s.id}</span>
                    <span className="text-sm text-slate-500">{a.name}, {a.area}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${x.status === 'Offline' ? 'bg-slate-200 text-slate-700' : 'bg-fuchsia-100 text-fuchsia-800'}`}>
                    {x.faultReason ?? (s.battery < 20 ? 'Low battery' : x.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Map" className="xl:col-span-2">
          <NetworkMap className="h-72" showToggles={false} />
        </Card>
      </div>
    </>
  )
}

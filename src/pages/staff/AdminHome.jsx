import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useStore } from '../../data/StoreContext.js'
import { incidentPriority } from '../../data/model.js'
import { Card, Empty, PriorityBadge } from '../../components/ui.jsx'
import NetworkMap from '../../components/NetworkMap.jsx'
import { DAY, percent, timeAgo } from '../../utils/format.js'

const CHART_COLORS = { Fixed: '#4a7ef5', 'Crew sent': '#b18cf2', New: '#f2b56b' }

export default function AdminHome() {
  const { state, analysis, now } = useStore()

  const counts = {
    Fixed: state.incidents.filter((i) => i.status === 'Resolved').length,
    'Crew sent': state.incidents.filter((i) => i.status === 'Pending').length,
    New: state.incidents.filter((i) => i.status === 'Unattended').length,
  }
  const total = counts.Fixed + counts['Crew sent'] + counts.New
  const open = counts['Crew sent'] + counts.New
  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

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
        <Card title="Incidents status" className="xl:col-span-2">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center xl:flex-col 2xl:flex-row">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="90%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={CHART_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3">
              {chartData.map((d) => (
                <li key={d.name} className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded" style={{ background: CHART_COLORS[d.name] }} />
                  <span className="w-24 text-slate-800">{d.name}</span>
                  <span className="font-bold">{d.value}</span>
                  <span className="text-sm text-slate-500">({percent(d.value, total)}%)</span>
                </li>
              ))}
              <li className="pt-1 text-sm text-slate-500">{open} still open</li>
            </ul>
          </div>
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

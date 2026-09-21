import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useStore } from '../../data/StoreContext.js'
import { incidentPriority } from '../../data/model.js'
import { isOverdue } from '../../data/helpers.js'
import { Badge, Card, PriorityBadge, StatCard, Empty } from '../../components/ui.jsx'
import { percent, timeAgo } from '../../utils/format.js'

const COLORS = { Resolved: '#4a7ef5', Pending: '#b18cf2', Unattended: '#f2b56b' }

export default function Dashboard() {
  const { state, analysis, now } = useStore()
  const total = state.incidents.length
  const counts = {
    Resolved: state.incidents.filter((i) => i.status === 'Resolved').length,
    Pending: state.incidents.filter((i) => i.status === 'Pending').length,
    Unattended: state.incidents.filter((i) => i.status === 'Unattended').length,
  }
  const open = counts.Pending + counts.Unattended
  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  const openIncidents = state.incidents
    .filter((i) => i.status !== 'Resolved')
    .map((i) => ({ ...i, p: incidentPriority(i, state, analysis) }))
    .sort((a, b) => b.p.score - a.p.score)

  const predicted = state.assets
    .map((a) => ({ asset: a, x: analysis.assets[a.id] }))
    .filter(({ x }) => x.problem)
    .sort((a, b) => b.x.score - a.x.score)

  const sc = analysis.statusCounts

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
        <StatCard label="Total reports" value={total} sub="100%" />
        <StatCard label="Open incidents" value={open} sub={`${percent(open, total)}%`} subTone="text-red-600" />
        <StatCard label="Resolved" value={counts.Resolved} sub={`${percent(counts.Resolved, total)}%`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card title="Incidents status" className="xl:col-span-2">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center xl:flex-col 2xl:flex-row">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="90%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3">
              {chartData.map((d) => (
                <li key={d.name} className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded" style={{ background: COLORS[d.name] }} />
                  <span className="w-24 text-slate-800">{d.name}</span>
                  <span className="font-bold">{d.value}</span>
                  <span className="text-sm text-slate-500">({((d.value / total) * 100 || 0).toFixed(1)}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Predicted problems" className="xl:col-span-3" action={<Link to="/admin/assets" className="text-sm font-semibold text-brand underline">Network</Link>}>
          <p className="-mt-2 mb-3 text-sm text-slate-500">Found from sensor trends, before sewage reaches the street.</p>
          {predicted.length === 0 && <Empty>No problems predicted right now.</Empty>}
          <ul className="divide-y divide-slate-100">
            {predicted.map(({ asset, x }) => (
              <li key={asset.id}>
                <Link to={`/admin/assets/${asset.id}`} className="flex flex-col gap-1 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3">
                  <span className="w-20 font-bold">{asset.id}</span>
                  <span className="flex-1">
                    <span className="block text-slate-900">{x.problem.label}, {asset.landmark}</span>
                    <span className="text-sm text-slate-500">{x.problem.summary}</span>
                  </span>
                  <PriorityBadge p={{ level: x.level, score: x.score }} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card title="Needs attention" className="xl:col-span-3" action={<Link to="/admin/incidents" className="text-sm font-semibold text-brand underline">All incidents</Link>}>
          {openIncidents.length === 0 && <Empty>No open incidents.</Empty>}
          <ul className="divide-y divide-slate-100">
            {openIncidents.slice(0, 6).map((i) => (
              <li key={i.id}>
                <Link to={`/admin/incidents/${i.id}`} className="flex flex-col gap-1 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3">
                  <span className="w-24 font-bold">{i.id}</span>
                  <span className="flex-1 text-slate-800">{i.title}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {isOverdue(i, now) && <Badge>Overdue</Badge>}
                    <PriorityBadge p={i.p} />
                    <Badge>{i.status}</Badge>
                    <span className="text-xs text-slate-500">{timeAgo(i.reportedAt, now)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Sensor health" className="xl:col-span-2" action={<Link to="/admin/sensors" className="text-sm font-semibold text-brand underline">Sensors</Link>}>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Online', 'text-green-600'],
              ['Warning', 'text-orange-500'],
              ['Alert', 'text-red-600'],
              ['Fault', 'text-fuchsia-700'],
              ['Offline', 'text-slate-500'],
            ].map(([k, tone]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3">
                <p className={`text-2xl font-extrabold ${tone}`}>{sc[k]}</p>
                <p className="text-sm text-slate-600">{k}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Faulty and offline sensors are ignored for predictions until they are fixed.</p>
        </Card>
      </div>
    </>
  )
}

import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useData } from '../../data/DataContext.js'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { percent, timeAgo } from '../../utils/format.js'

const COLORS = { Resolved: '#4a7ef5', Pending: '#b18cf2', Unattended: '#f2b56b' }

export default function Dashboard() {
  const { incidents } = useData()

  const total = incidents.length
  const counts = {
    Resolved: incidents.filter((i) => i.status === 'Resolved').length,
    Pending: incidents.filter((i) => i.status === 'Pending').length,
    Unattended: incidents.filter((i) => i.status === 'Unattended').length,
  }
  const open = counts.Pending + counts.Unattended
  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  const latestOpen = incidents
    .filter((i) => i.status !== 'Resolved')
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .slice(0, 5)

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3 lg:gap-8">
        <StatCard label="Total reports" value={total} sub="100%" />
        <StatCard label="Open incidents" value={open} sub={`${percent(open, total)}%`} subTone="text-red-600" />
        <StatCard label="Resolved" value={counts.Resolved} sub={`${percent(counts.Resolved, total)}%`} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 lg:mt-8 lg:p-8">
        <h2 className="text-xl text-slate-900 sm:text-2xl">Incidents status</h2>
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
          <div className="h-64 w-64 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="90%" startAngle={90} endAngle={-270} stroke="none">
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
                <span className="font-bold text-slate-900">{d.value}</span>
                <span className="text-sm text-slate-500">({((d.value / total) * 100 || 0).toFixed(1)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 lg:mt-8 lg:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-slate-900 sm:text-2xl">Needs attention</h2>
          <Link to="/admin/incidents" className="text-sm font-semibold text-brand underline">View all</Link>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {latestOpen.map((inc) => (
            <li key={inc.id}>
              <Link to={`/admin/incidents/${inc.id}`} className="flex flex-col gap-1 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-24 font-bold text-slate-900">{inc.id}</span>
                <span className="flex-1 text-slate-700">{inc.type}, {inc.area}</span>
                <span className="flex items-center gap-2">
                  <StatusBadge status={inc.severity} />
                  <StatusBadge status={inc.status} />
                  <span className="text-sm text-slate-500">{timeAgo(inc.reportedAt)}</span>
                </span>
              </Link>
            </li>
          ))}
          {latestOpen.length === 0 && <li className="py-3 text-slate-500">No open incidents.</li>}
        </ul>
      </div>
    </>
  )
}

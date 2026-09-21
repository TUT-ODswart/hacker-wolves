import { Download } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts'
import { useStore } from '../../data/StoreContext.js'
import { AREAS } from '../../data/seed.js'
import { Card, PageHeader, StatCard } from '../../components/ui.jsx'
import { DAY, HOUR, downloadCsv, formatDate, percent } from '../../utils/format.js'

const monthKey = (iso) => iso.slice(0, 7)

export default function Analytics() {
  const { state, now } = useStore()
  const done = state.workOrders.filter((w) => w.status === 'Completed' && w.kind !== 'Planned' && w.kind !== 'Sensor repair')
  const resolved = state.incidents.filter((i) => i.status === 'Resolved' && i.assignedAt)

  // Last 6 calendar months
  const months = []
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now)
    d.setDate(1)
    d.setMonth(d.getMonth() - k)
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-ZA', { month: 'short' }) })
  }

  const monthly = months.map(({ key, label }) => {
    const wos = done.filter((w) => monthKey(w.completedAt) === key)
    const incs = resolved.filter((i) => monthKey(i.reportedAt) === key)
    const resp = incs.map((i) => (new Date(i.assignedAt) - new Date(i.reportedAt)) / HOUR)
    return {
      label,
      Proactive: wos.filter((w) => w.kind === 'Proactive').length,
      Reactive: wos.filter((w) => w.kind === 'Reactive').length,
      response: resp.length ? +(resp.reduce((s, v) => s + v, 0) / resp.length).toFixed(1) : null,
    }
  })

  const proactive = done.filter((w) => w.kind === 'Proactive')

  const recent = done.filter((w) => now - new Date(w.completedAt) < 30 * DAY)
  const recentShare = percent(recent.filter((w) => w.kind === 'Proactive').length, recent.length)
  const firstShare = percent(monthly[0].Proactive, monthly[0].Proactive + monthly[0].Reactive)

  const recentInc = resolved.filter((i) => now - new Date(i.reportedAt) < 30 * DAY)
  const avgHours = (list, from, to) => (list.length ? list.reduce((s, i) => s + (new Date(i[to]) - new Date(i[from])) / HOUR, 0) / list.length : 0)

  const byArea = AREAS.map((a) => ({ area: a.name, Incidents: state.incidents.filter((i) => i.area === a.name).length }))
  const assetCounts = {}
  for (const i of state.incidents) if (i.assetId) assetCounts[i.assetId] = (assetCounts[i.assetId] ?? 0) + 1
  const hotspots = Object.entries(assetCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ asset: state.assets.find((a) => a.id === id), n }))
  const residentFound = percent(state.incidents.filter((i) => i.source === 'resident').length, state.incidents.length)

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Are we catching problems earlier and responding faster?"
        actions={
          <button
            onClick={() => downloadCsv('repairs.csv', done.map((w) => ({ id: w.id, incident: w.incidentId ?? '', kind: w.kind, asset: w.assetId, crew: w.crewId, completed: formatDate(w.completedAt) })))}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            <Download size={16} /> Export repairs CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fixed before overflow" value={`${recentShare}%`} sub={`Up from ${firstShare}% six months ago`} />
        <StatCard label="Overflows prevented" value={proactive.length} sub="Fixed early, last 6 months" />
        <StatCard label="Time to assign a crew" value={`${avgHours(recentInc, 'reportedAt', 'assignedAt').toFixed(1)} h`} sub="Average, last 30 days" subTone="text-slate-600" />
        <StatCard label="Time to fix" value={`${avgHours(recentInc, 'reportedAt', 'resolvedAt').toFixed(1)} h`} sub="Average, last 30 days" subTone="text-slate-600" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Early (proactive) vs after overflow (reactive) repairs">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Proactive" stackId="a" fill="#11676a" isAnimationActive={false} />
                <Bar dataKey="Reactive" stackId="a" fill="#f2b56b" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Average hours to assign a crew">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line dataKey="response" name="Hours" stroke="#11676a" strokeWidth={2} isAnimationActive={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Hotspots">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byArea} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="area" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Incidents" fill="#11676a" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">Manholes with the most problems</p>
          <ol className="mt-1 space-y-1 text-sm text-slate-700">
            {hotspots.map(({ asset, n }) => (
              <li key={asset.id}>{asset.id}, {asset.landmark}: {n} incidents</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-slate-500">These are candidates for pipe replacement or regular planned cleaning. {residentFound}% of all incidents were reported by residents.</p>
        </Card>
      </div>
    </>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { incidentPriority } from '../../data/model.js'
import { isOverdue } from '../../data/helpers.js'
import { AREAS } from '../../data/seed.js'
import { Badge, Empty, PageHeader, PriorityBadge, Tabs, inputClass } from '../../components/ui.jsx'
import { downloadCsv, formatDateTime, timeAgo } from '../../utils/format.js'

const STATUS_ORDER = { Unattended: 0, Pending: 1, Resolved: 2 }

export default function Incidents() {
  const { state, analysis, now } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Open')
  const [source, setSource] = useState('')
  const [area, setArea] = useState('')
  const [search, setSearch] = useState('')

  const all = state.incidents.map((i) => ({ ...i, p: incidentPriority(i, state, analysis) }))
  const count = (t) => all.filter((i) => (t === 'All' ? true : t === 'Open' ? i.status !== 'Resolved' : i.status === t)).length
  const q = search.trim().toLowerCase()

  const rows = all
    .filter((i) => (tab === 'All' ? true : tab === 'Open' ? i.status !== 'Resolved' : i.status === tab))
    .filter((i) => !source || i.source === source)
    .filter((i) => !area || i.area === area)
    .filter((i) => !q || [i.id, i.title, i.area, i.assetId ?? ''].some((f) => f.toLowerCase().includes(q)))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (a.status === 'Resolved' ? b.resolvedAt.localeCompare(a.resolvedAt) : b.p.score - a.p.score))

  function exportCsv() {
    downloadCsv(
      'incidents.csv',
      rows.map((i) => ({
        id: i.id, title: i.title, type: i.type, area: i.area, asset: i.assetId ?? '', source: i.source, status: i.status,
        priority: i.p?.level, score: i.p?.score, reported: formatDateTime(i.reportedAt), resolved: i.resolvedAt ? formatDateTime(i.resolvedAt) : '', resident_reports: i.reportIds.length,
      })),
    )
  }

  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle="Problems found by sensors and reported by residents, most urgent first"
        actions={
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <Download size={16} /> Export CSV
          </button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={['Open', 'Unattended', 'Pending', 'Resolved', 'All'].map((t) => ({ value: t, label: t, count: count(t) }))}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, place or manhole" className={`${inputClass} sm:flex-1`} />
        <select value={source} onChange={(e) => setSource(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">All sources</option>
          <option value="sensor">Sensor</option>
          <option value="resident">Resident</option>
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">All areas</option>
          {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-300 bg-white">
        <ul className="divide-y divide-slate-200 lg:hidden">
          {rows.map((i) => (
            <li key={i.id}>
              <Link to={`/admin/incidents/${i.id}`} className="block p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{i.id}</span>
                  <Badge>{i.status}</Badge>
                </div>
                <p className="mt-1 text-slate-800">{i.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PriorityBadge p={i.p} />
                  <Badge>{i.source === 'sensor' ? 'Sensor' : 'Resident'}</Badge>
                  {isOverdue(i, now) && <Badge>Overdue</Badge>}
                  <span className="text-xs text-slate-500">{i.area} · {timeAgo(i.reportedAt, now)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-300 text-slate-900">
              <tr>
                {['INC_ID', 'Problem', 'Area', 'Source', 'Priority', 'Status', 'Reported'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((i) => (
                <tr key={i.id} onClick={() => navigate(`/admin/incidents/${i.id}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-brand">{i.id}</td>
                  <td className="px-4 py-3">
                    {i.title}
                    {i.reportIds.length > 1 && <span className="block text-xs text-slate-500">{i.reportIds.length} resident reports</span>}
                  </td>
                  <td className="px-4 py-3">{i.area}</td>
                  <td className="px-4 py-3"><Badge>{i.source === 'sensor' ? 'Sensor' : 'Resident'}</Badge></td>
                  <td className="px-4 py-3"><PriorityBadge p={i.p} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge>{i.status}</Badge>
                      {isOverdue(i, now) && <Badge>Overdue</Badge>}
                      {i.escalated && i.status === 'Unattended' && <Badge>Escalated</Badge>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{timeAgo(i.reportedAt, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="p-4"><Empty>No incidents match these filters.</Empty></div>}
      </div>
    </>
  )
}

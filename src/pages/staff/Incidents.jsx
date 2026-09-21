import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { incidentPriority } from '../../data/model.js'
import { isOverdue } from '../../data/helpers.js'
import { AREAS } from '../../data/seed.js'
import { Empty, PageHeader, PriorityBadge, StatusBadge, Tabs, inputClass } from '../../components/ui.jsx'
import { downloadCsv, formatDateTime, timeAgo } from '../../utils/format.js'

const TAB_STATUS = {
  'Still open': ['Unattended', 'Pending'],
  New: ['Unattended'],
  'Crew sent': ['Pending'],
  Fixed: ['Resolved'],
}

function priorityAccent(level) {
  if (level === 'High') return 'border-l-4 border-l-red-600'
  if (level === 'Medium') return 'border-l-4 border-l-amber-500'
  return 'border-l-4 border-l-slate-300'
}

export default function Incidents() {
  const { state, analysis, now } = useStore()
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'New')
  const [area, setArea] = useState('')
  const [source, setSource] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')

  const all = state.incidents.map((i) => ({ ...i, p: incidentPriority(i, state, analysis) }))
  const count = (label) => all.filter((i) => TAB_STATUS[label].includes(i.status)).length
  const q = search.trim().toLowerCase()
  const statuses = TAB_STATUS[tab] ?? TAB_STATUS['Still open']

  const rows = all
    .filter((i) => statuses.includes(i.status))
    .filter((i) => !area || i.area === area)
    .filter((i) => !source || i.source === source)
    .filter((i) => !priority || i.p.level === priority)
    .filter((i) => !q || [i.id, i.title, i.area, i.assetId ?? ''].some((f) => f.toLowerCase().includes(q)))
    .sort((a, b) => (tab === 'Fixed' ? b.resolvedAt.localeCompare(a.resolvedAt) : b.p.score - a.p.score))

  function exportCsv() {
    downloadCsv(
      'incidents.csv',
      rows.map((i) => ({
        id: i.id,
        title: i.title,
        type: i.type,
        area: i.area,
        manhole: i.assetId ?? '',
        status: tab,
        priority: i.p ? (i.p.level === 'High' ? 'Urgent' : i.p.level === 'Medium' ? 'Soon' : 'Can wait') : '',
        reported: formatDateTime(i.reportedAt),
        fixed: i.resolvedAt ? formatDateTime(i.resolvedAt) : '',
        resident_reports: i.reportIds.length,
      })),
    )
  }

  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle="Incidents found by sensors and reported by residents"
        actions={
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <Download size={16} /> Download list
          </button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={['Still open', 'New', 'Crew sent', 'Fixed'].map((t) => ({ value: t, label: t, count: count(t) }))}
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search place or manhole" className={`${inputClass} sm:flex-1`} />
        <select value={area} onChange={(e) => setArea(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">All areas</option>
          {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
          <option value="">All sources</option>
          <option value="resident">Reported by residents</option>
          <option value="sensor">Detected by sensors</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
          <option value="">All priority levels</option>
          <option value="High">Urgent</option>
          <option value="Medium">Soon</option>
          <option value="Low">Can wait</option>
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-300 bg-white">
        <ul className="divide-y divide-slate-200">
          {rows.map((i) => (
            <li key={i.id}>
              <Link to={`/admin/incidents/${i.id}`} className={`block p-4 hover:bg-slate-50 ${priorityAccent(i.p?.level)}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{i.title}</h2>
                    <p className="text-xs text-slate-400">{i.id}</p>
                    <p className="mt-1 text-sm text-slate-600">{i.area}{i.reportIds.length > 1 ? ` · ${i.reportIds.length} resident reports` : ''}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge p={i.p} />
                    <StatusBadge status={i.status} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {i.source === 'sensor' ? 'Sensor' : 'Resident'}
                    </span>
                    {isOverdue(i, now) && tab !== 'Fixed' && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">Overdue</span>}
                    <span className="text-xs text-slate-500">{timeAgo(i.reportedAt, now)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <div className="p-4"><Empty>No {tab.toLowerCase()} incidents.</Empty></div>}
      </div>
    </>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext.js'
import { AREAS } from '../../data/seed.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { timeAgo } from '../../utils/format.js'

const TABS = ['All', 'Unattended', 'Pending', 'Resolved']
const STATUS_ORDER = { Unattended: 0, Pending: 1, Resolved: 2 }
const SEVERITY_ORDER = { High: 0, Medium: 1, Low: 2 }
const selectClass = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-base'

export default function Incidents() {
  const { incidents } = useData()
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [source, setSource] = useState('')
  const [area, setArea] = useState('')
  const [search, setSearch] = useState('')

  const count = (status) => (status === 'All' ? incidents.length : incidents.filter((i) => i.status === status).length)
  const q = search.trim().toLowerCase()

  const rows = incidents
    .filter((i) => tab === 'All' || i.status === tab)
    .filter((i) => !source || i.source === source)
    .filter((i) => !area || i.area === area)
    .filter((i) => !q || [i.id, i.type, i.address, i.area].some((f) => f.toLowerCase().includes(q)))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.reportedAt.localeCompare(a.reportedAt),
    )

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Incidents</h1>
        <p className="text-slate-600">Leaks and blockages from sensors and residents</p>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full border px-4 py-2 font-semibold ${
              tab === t ? 'border-brand bg-brand text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t} <span className="opacity-70">({count(t)})</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, type or address" className={`${selectClass} sm:flex-1`} />
        <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
          <option value="">All sources</option>
          <option value="sensor">Sensor</option>
          <option value="citizen">Resident</option>
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
          <option value="">All locations</option>
          {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-300 bg-white">
        {/* Phone: cards */}
        <ul className="divide-y divide-slate-200 md:hidden">
          {rows.map((i) => (
            <li key={i.id}>
              <Link to={`/admin/incidents/${i.id}`} className="block p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{i.id}</span>
                  <StatusBadge status={i.status} />
                </div>
                <p className="mt-1 text-slate-800">{i.type}</p>
                <p className="text-sm text-slate-600">{i.area}, {i.address}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={i.severity} />
                  <StatusBadge status={i.source === 'sensor' ? 'Sensor' : 'Resident'} />
                  <span className="text-xs text-slate-500">{timeAgo(i.reportedAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Tablet and up: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead className="border-b border-slate-300 text-slate-900">
              <tr>
                <th className="px-4 py-3 font-semibold">INC_ID</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((i) => (
                <tr key={i.id} onClick={() => navigate(`/admin/incidents/${i.id}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4 font-bold">
                    <Link to={`/admin/incidents/${i.id}`} className="text-brand hover:underline" onClick={(e) => e.stopPropagation()}>
                      {i.id}
                    </Link>
                  </td>
                  <td className="px-4 py-4">{i.type}</td>
                  <td className="px-4 py-4">
                    {i.area}
                    <span className="block text-sm text-slate-500">{i.address}</span>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={i.source === 'sensor' ? 'Sensor' : 'Resident'} /></td>
                  <td className="px-4 py-4"><StatusBadge status={i.severity} /></td>
                  <td className="px-4 py-4"><StatusBadge status={i.status} /></td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{timeAgo(i.reportedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && <p className="p-5 text-slate-500">No incidents match these filters.</p>}
      </div>
    </>
  )
}

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useData } from '../../data/DataContext.js'
import { AREAS, SENSOR_TYPES } from '../../data/seed.js'
import StatCard from '../../components/StatCard.jsx'
import { minutesAgo } from '../../utils/format.js'

const PAGE_SIZE = 10
const STATUS_ORDER = { Alert: 0, Warning: 1, Offline: 2, Online: 3 }
const statusColor = { Online: 'text-green-600', Warning: 'text-orange-500', Alert: 'text-red-600', Offline: 'text-slate-500' }

function batteryColor(pct) {
  if (pct >= 70) return 'text-green-600'
  if (pct >= 50) return 'text-orange-500'
  return 'text-red-600'
}

const selectClass = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-base'

export default function Sensors() {
  const { sensors } = useData()
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const activeAlerts = sensors.filter((s) => s.status === 'Alert' || s.status === 'Warning').length
  const locations = new Set(sensors.map((s) => s.area)).size

  const filtered = sensors
    .filter((s) => (!area || s.area === area) && (!status || s.status === status) && s.id.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.id.localeCompare(b.id))

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <h1 className="sr-only">Sensors</h1>

      <div className="grid gap-4 sm:grid-cols-3 lg:gap-8">
        <StatCard label="Total sensors" value={sensors.length} />
        <StatCard label="Active alerts" value={activeAlerts} />
        <StatCard label="Sensor locations" value={locations} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-300 bg-white lg:mt-8">
        <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-slate-900">Sensor status</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search sensor ID"
              className={`${selectClass} sm:w-44`}
            />
            <select value={area} onChange={(e) => { setArea(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">All locations</option>
              {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
            </select>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">All statuses</option>
              {Object.keys(STATUS_ORDER).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Phone: cards */}
        <ul className="divide-y divide-slate-200 border-t border-slate-200 md:hidden">
          {rows.map((s) => (
            <li key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.id}</span>
                <span className={`font-bold ${statusColor[s.status]}`}>{s.status}</span>
              </div>
              <p className="text-sm text-slate-600">{s.area}, {SENSOR_TYPES[s.type].label}</p>
              <p className="text-sm text-slate-500">
                Battery <span className={`font-bold ${batteryColor(s.battery)}`}>{s.battery}%</span>, last reading {minutesAgo(s.lastReadingMin)}
              </p>
            </li>
          ))}
        </ul>

        {/* Tablet and up: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead className="border-y border-slate-300 text-lg text-slate-900">
              <tr>
                <th className="px-5 py-3 font-normal">Sensor ID</th>
                <th className="px-5 py-3 font-normal">Location</th>
                <th className="px-5 py-3 font-normal">Type</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Battery</th>
                <th className="px-5 py-3 font-normal">Last reading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-lg">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-4">{s.id}</td>
                  <td className="px-5 py-4">{s.area}</td>
                  <td className="px-5 py-4 text-base text-slate-600">{SENSOR_TYPES[s.type].label}</td>
                  <td className={`px-5 py-4 font-bold ${statusColor[s.status]}`}>{s.status}</td>
                  <td className={`px-5 py-4 font-bold ${batteryColor(s.battery)}`}>{s.battery}%</td>
                  <td className="px-5 py-4">{minutesAgo(s.lastReadingMin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && <p className="p-5 text-slate-500">No sensors match these filters.</p>}

        <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm text-slate-600">
          <span>
            {filtered.length ? `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}` : '0 sensors'}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(current - 1)} disabled={current === 1} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setPage(current + 1)} disabled={current === pages} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40" aria-label="Next page">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

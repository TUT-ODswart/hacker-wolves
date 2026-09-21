import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../data/StoreContext.js'
import { SENSOR_TYPES } from '../../data/constants.js'
import { AREAS } from '../../data/seed.js'
import { Badge, Empty, PageHeader, StatCard, Tabs, inputClass } from '../../components/ui.jsx'
import { timeAgo } from '../../utils/format.js'

function readingText(x, sensor) {
  const r = x.latest ?? x.lastKnown
  if (!r || r.value == null) return '—'
  return `${r.value} ${SENSOR_TYPES[sensor.type].unit}`
}

export default function Sensors() {
  const { state, analysis, now } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [area, setArea] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')

  const assetOf = (id) => state.assets.find((a) => a.id === id)
  const sc = analysis.statusCounts
  const q = search.trim().toLowerCase()

  const rows = state.sensors
    .map((s) => ({ s, x: analysis.sensors[s.id], a: assetOf(s.assetId) }))
    .filter(({ x }) => tab === 'All' || (tab === 'Problems' ? !x.healthy || x.status === 'Alert' || x.status === 'Warning' : x.status === tab))
    .filter(({ a }) => !area || a.area === area)
    .filter(({ s }) => !type || s.type === type)
    .filter(({ s, a }) => !q || [s.id, a.id, a.landmark].some((f) => f.toLowerCase().includes(q)))

  const locations = new Set(state.sensors.map((s) => s.assetId)).size

  return (
    <>
      <PageHeader title="Sensors" subtitle="Every sensor checks in every few minutes. The system checks each one is telling the truth." />
      <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
        <StatCard label="Total sensors" value={state.sensors.length} sub={`${sc.Online} online`} />
        <StatCard label="Active alerts" value={sc.Alert + sc.Warning} sub={`${sc.Alert} urgent`} subTone="text-red-600" />
        <StatCard label="Sensor locations" value={locations} sub={`${AREAS.length} areas`} subTone="text-slate-600" />
      </div>

      <div className="mt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'All', label: 'All', count: state.sensors.length },
            { value: 'Problems', label: 'Needs attention', count: sc.Alert + sc.Warning + sc.Fault + sc.Offline },
            { value: 'Fault', label: 'Faulty', count: sc.Fault },
            { value: 'Offline', label: 'Offline', count: sc.Offline },
          ]}
        />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sensor, manhole or place" className={`${inputClass} sm:flex-1`} />
        <select value={area} onChange={(e) => setArea(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">All areas</option>
          {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">All types</option>
          {Object.entries(SENSOR_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-300 bg-white">
        <ul className="divide-y divide-slate-200 lg:hidden">
          {rows.map(({ s, x, a }) => (
            <li key={s.id}>
              <Link to={`/admin/sensors/${s.id}`} className="block p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{s.id}</span>
                  <Badge>{x.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">{SENSOR_TYPES[s.type].label} · {a.name}, {a.area}</p>
                <p className="mt-1 text-sm">
                  {readingText(x, s)} · Battery <span className={s.battery < 20 ? 'font-bold text-red-600' : ''}>{s.battery}%</span> · {timeAgo(new Date(x.lastSeen).toISOString(), now)}
                </p>
                {x.faultReason && <p className="mt-1 text-sm font-semibold text-fuchsia-700">{x.faultReason}</p>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-300 text-slate-900">
              <tr>
                {['Sensor', 'Manhole', 'Type', 'Status', 'Battery', 'Reading', 'Last reading', 'Issue'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map(({ s, x, a }) => (
                <tr key={s.id} onClick={() => navigate(`/admin/sensors/${s.id}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-brand">{s.id}</td>
                  <td className="px-4 py-3">{a.name}<span className="block text-xs text-slate-500">{a.landmark}, {a.area}</span></td>
                  <td className="px-4 py-3">{SENSOR_TYPES[s.type].label}</td>
                  <td className="px-4 py-3"><Badge>{x.status}</Badge></td>
                  <td className={`px-4 py-3 ${s.battery < 20 ? 'font-bold text-red-600' : ''}`}>{s.battery}%</td>
                  <td className="whitespace-nowrap px-4 py-3">{readingText(x, s)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{timeAgo(new Date(x.lastSeen).toISOString(), now)}</td>
                  <td className="px-4 py-3 text-fuchsia-700">{x.faultReason ?? (s.battery < 20 ? 'Low battery' : '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="p-4"><Empty>No sensors match.</Empty></div>}
      </div>
    </>
  )
}

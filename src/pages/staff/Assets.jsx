import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../data/StoreContext.js'
import { AREAS } from '../../data/seed.js'
import { Badge, PageHeader, PriorityBadge, inputClass } from '../../components/ui.jsx'

export default function Assets() {
  const { state, analysis } = useStore()
  const navigate = useNavigate()
  const [area, setArea] = useState('')
  const [condition, setCondition] = useState('')

  const rows = state.assets
    .map((a) => ({ a, x: analysis.assets[a.id], sensors: state.sensors.filter((s) => s.assetId === a.id).length }))
    .filter(({ a }) => !area || a.area === area)
    .filter(({ x }) => !condition || x.condition === condition)
    .sort((p, q) => q.x.score - p.x.score || p.a.id.localeCompare(q.a.id))

  return (
    <>
      <PageHeader title="Sewer network" subtitle="Every manhole and pump station, ranked by risk. Importance (1–5) is based on what is nearby." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <select value={area} onChange={(e) => setArea(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">All areas</option>
          {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
        </select>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">Any condition</option>
          {['Critical', 'Warning', 'Good', 'Unknown'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-slate-300">
            <tr>
              {['ID', 'Location', 'Importance', 'Sensors', 'Condition', 'What we see', 'Risk'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map(({ a, x, sensors }) => (
              <tr key={a.id} onClick={() => navigate(`/admin/assets/${a.id}`)} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-brand">{a.id}</td>
                <td className="px-4 py-3">{a.landmark}<span className="block text-xs text-slate-500">{a.area} · {a.type === 'pump_station' ? 'Pump station' : 'Manhole'}</span></td>
                <td className="px-4 py-3">{a.criticality}/5<span className="block text-xs text-slate-500">{a.criticalityNote}</span></td>
                <td className="px-4 py-3">{sensors}</td>
                <td className="px-4 py-3"><Badge>{x.condition}</Badge></td>
                <td className="px-4 py-3 text-slate-700">{x.problem ? `${x.problem.label}: ${x.problem.summary}` : x.condition === 'Unknown' ? 'Sensors not working' : 'Normal'}</td>
                <td className="px-4 py-3">{x.problem ? <PriorityBadge p={{ level: x.level, score: x.score }} /> : <span className="text-slate-400">{x.score}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

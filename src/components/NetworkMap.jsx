import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet'
import { useStore } from '../data/StoreContext.js'
import { Badge, StatusBadge } from './ui.jsx'

const COLORS = { Good: '#16a34a', Warning: '#ea580c', Critical: '#dc2626', Unknown: '#64748b' }

export default function NetworkMap({ className = 'h-[28rem]', focus, showToggles = true }) {
  const { state, analysis } = useStore()
  const [showPipes, setShowPipes] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const byId = Object.fromEntries(state.assets.map((a) => [a.id, a]))
  const openIncidents = state.incidents.filter((i) => i.status !== 'Resolved')

  const points = focus ? [[focus.lat, focus.lng]] : state.assets.map((a) => [a.lat, a.lng])
  const bounds = focus ? null : points

  return (
    <div>
      {showToggles && (
        <div className="mb-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showPipes} onChange={(e) => setShowPipes(e.target.checked)} /> Pipes
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showIncidents} onChange={(e) => setShowIncidents(e.target.checked)} /> Open incidents
          </label>
        </div>
      )}
      <div className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}>
        <MapContainer
          bounds={bounds ?? undefined}
          center={focus ? [focus.lat, focus.lng] : undefined}
          zoom={focus ? 15 : undefined}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {showPipes &&
            state.assets
              .filter((a) => a.downstreamId)
              .map((a) => {
                const d = byId[a.downstreamId]
                const problem = analysis.assets[a.id].problem
                return (
                  <Polyline
                    key={`p-${a.id}`}
                    positions={[[a.lat, a.lng], [d.lat, d.lng]]}
                    pathOptions={{ color: problem ? COLORS.Critical : '#0f766e', weight: problem ? 5 : 3, opacity: 0.7, dashArray: problem ? '6 6' : null }}
                  />
                )
              })}

          {state.assets.map((a) => {
            const x = analysis.assets[a.id]
            return (
              <CircleMarker
                key={a.id}
                center={[a.lat, a.lng]}
                radius={a.type === 'pump_station' ? 11 : 8}
                pathOptions={{ color: '#fff', weight: 2, fillColor: COLORS[x.condition], fillOpacity: 0.95 }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold">{a.name}</p>
                    <p>{a.landmark}, {a.area}</p>
                    <p><Badge>{x.condition}</Badge></p>
                    {x.problem && <p>{x.problem.label}: {x.problem.summary}</p>}
                    {state.sensors.filter((s) => s.assetId === a.id).slice(0, 1).map((s) => (
                      <Link key={s.id} to={`/admin/sensors/${s.id}`} className="font-semibold text-brand underline">View sensors</Link>
                    ))}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {showIncidents &&
            openIncidents.map((i) => (
              <CircleMarker
                key={i.id}
                center={[i.lat + 0.0006, i.lng + 0.0006]}
                radius={6}
                pathOptions={{ color: '#1e3a8a', weight: 2, fillColor: i.source === 'resident' ? '#38bdf8' : '#a855f7', fillOpacity: 1 }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold">{i.title}</p>
                    <p className="text-xs text-slate-500">{i.id}</p>
                    <p><StatusBadge status={i.status} /></p>
                    <Link to={`/admin/incidents/${i.id}`} className="font-semibold text-brand underline">Open incident</Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
        {Object.entries(COLORS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: c }} /> {k}
          </span>
        ))}
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-sky-400" /> Resident report</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-purple-500" /> Sensor incident</span>
        <span>Big dots are pump stations</span>
      </div>
    </div>
  )
}

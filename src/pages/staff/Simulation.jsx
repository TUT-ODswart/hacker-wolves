import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudRain, FlaskConical, RotateCcw } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { SENSOR_TYPES } from '../../data/constants.js'
import { Badge, Card, Empty, Field, PageHeader, buttonClass, inputClass } from '../../components/ui.jsx'

const SCENARIOS = {
  blockage: { label: 'Blockage forming', text: 'Fat and rags build up in a pipe. The manhole level creeps up night after night and less sewage gets through.', rate: 1.6 },
  leak: { label: 'Pipe leak', text: 'A crack between two manholes. Less sewage arrives downstream than left upstream.', rate: 1.3 },
  pressure_drop: { label: 'Rising main leak', text: 'A leak on the pumped pipe from a pump station. Pressure slowly drops.', rate: 1.2 },
}

const FAULTS = {
  offline: 'Goes offline (no heartbeat)',
  frozen: 'Gets stuck on one value',
  impossible: 'Sends impossible values',
  no_signal: 'Wire cut (signal below 4 mA)',
  low_battery: 'Battery almost flat',
}

export default function Simulation() {
  const { state, analysis, now, actions } = useStore()
  const [kind, setKind] = useState('blockage')
  const [speed, setSpeed] = useState(30000)
  const [sensorId, setSensorId] = useState(state.sensors[0].id)
  const [fault, setFault] = useState('offline')
  const [confirmReset, setConfirmReset] = useState(false)

  const sensorIsUsable = (sensor) => sensor && !sensor.fault && sensor.battery >= 20

  const upstreamHasFlow = (asset) => {
    let up = state.assets.find((a) => a.downstreamId === asset.id)
    while (up) {
      const id = up.id
      if (state.sensors.some((s) => s.assetId === id && s.type === 'flow' && sensorIsUsable(s))) return true
      up = state.assets.find((a) => a.downstreamId === id)
    }
    return false
  }

  const candidates = state.assets.filter((a) => {
    if (a.scenario) return false
    if (kind === 'blockage') return a.type === 'manhole' && state.sensors.some((s) => s.assetId === a.id && s.type === 'level' && sensorIsUsable(s))
    if (kind === 'leak') return a.type === 'manhole' && state.sensors.some((s) => s.assetId === a.id && s.type === 'flow' && sensorIsUsable(s)) && upstreamHasFlow(a)
    return a.type === 'pump_station' && state.sensors.some((s) => s.assetId === a.id && s.type === 'pressure' && sensorIsUsable(s))
  })
  const [assetId, setAssetId] = useState('')
  const selected = candidates.find((a) => a.id === assetId) ?? candidates[0]

  const running = state.assets.filter((a) => a.scenario)
  const faulty = state.sensors.filter((s) => s.fault || s.battery < 20)

  function start() {
    if (!selected) return
    actions.startScenario({ assetId: selected.id, kind, days: 14, durationMs: speed, rate: SCENARIOS[kind].rate })
    setAssetId('')
  }

  return (
    <>
      <PageHeader title="Simulation" subtitle="Demo tools. Make problems happen in fast-forward and watch the system catch them." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Start a pipe problem">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SCENARIOS).map(([k, s]) => (
                <button
                  key={k}
                  onClick={() => {
                    setKind(k)
                    setAssetId('')
                  }}
                  className={`rounded-xl border px-2 py-2 text-sm font-semibold ${kind === k ? 'border-brand bg-brand-light text-brand-dark' : 'border-slate-300'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-600">{SCENARIOS[kind].text}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Where">
                <select value={selected?.id ?? ''} onChange={(e) => setAssetId(e.target.value)} className={inputClass}>
                  {candidates.map((a) => <option key={a.id} value={a.id}>{a.id}, {a.landmark}</option>)}
                </select>
              </Field>
              <Field label="Speed" hint="14 days of readings, squeezed into">
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className={inputClass}>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={120000}>2 minutes</option>
                </select>
              </Field>
            </div>
            <button onClick={start} disabled={!selected} className={`w-full ${buttonClass}`}>
              <FlaskConical size={18} className="mr-2 inline" /> Start simulation
            </button>
          </div>
        </Card>

        <Card title="Running problems">
          {running.length === 0 && <Empty>No problems running. Start one on the left.</Empty>}
          <ul className="space-y-3">
            {running.map((a) => {
              const x = analysis.assets[a.id]
              const sim = a.scenario.sim
              const progress = sim ? Math.min(1, (now - sim.startedAt) / sim.durationMs) : 1
              const inc = state.incidents.find((i) => i.assetId === a.id && i.status !== 'Resolved')
              return (
                <li key={a.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/admin/sensors/${state.sensors.find((s) => s.assetId === a.id)?.id}`} className="font-bold text-brand underline">{a.id}</Link>
                    <span className="text-sm text-slate-600">{SCENARIOS[a.scenario.kind].label}</span>
                    <Badge>{x.condition}</Badge>
                  </div>
                  {sim && (
                    <div className="mt-2">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-brand transition-all" style={{ width: `${progress * 100}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Simulated day {Math.round(progress * sim.days)} of {sim.days}</p>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-slate-700">{x.problem ? x.problem.summary : 'Nothing detected yet'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {inc ? (
                      <Link to={`/admin/incidents/${inc.id}`} className="text-sm font-semibold text-green-700 underline">Incident {inc.id} created automatically</Link>
                    ) : (
                      <span className="text-sm text-slate-500">Waiting for enough evidence…</span>
                    )}
                    <button onClick={() => actions.stopScenario({ assetId: a.id })} className="text-sm text-slate-500 underline">Stop</button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card title="2. Break a sensor">
          <p className="mb-3 text-sm text-slate-600">Shows how the system knows a sensor is broken instead of the pipe.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sensor">
              <select value={sensorId} onChange={(e) => setSensorId(e.target.value)} className={inputClass}>
                {state.sensors.map((s) => <option key={s.id} value={s.id}>{s.id}, {SENSOR_TYPES[s.type].label} at {s.assetId}</option>)}
              </select>
            </Field>
            <Field label="Fault">
              <select value={fault} onChange={(e) => setFault(e.target.value)} className={inputClass}>
                {Object.entries(FAULTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>
          <button onClick={() => actions.injectFault({ sensorId, kind: fault })} className={`mt-3 w-full ${buttonClass}`}>Break it</button>
          <p className="mt-4 text-sm font-semibold text-slate-700">Sensors with problems</p>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {faulty.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                <Link to={`/admin/sensors/${s.id}`} className="font-semibold text-brand underline">{s.id}</Link>
                <span className="flex-1 text-slate-600">{analysis.sensors[s.id].faultReason ?? (s.battery < 20 ? 'Low battery' : 'Starting…')}</span>
                <button onClick={() => actions.clearFault({ sensorId: s.id })} className="text-slate-500 underline">Fix</button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card title="3. Weather">
            <label className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <CloudRain size={20} className="text-sky-700" /> Heavy rain forecast. Pushes manholes that are already filling up higher on the list.
              </span>
              <input type="checkbox" checked={state.settings.rainForecast} onChange={(e) => actions.setRain({ on: e.target.checked })} className="h-5 w-5" />
            </label>
          </Card>

          <Card title="4. A resident reports a problem">
            <p className="text-sm text-slate-600">Open the public report form on your phone or in a new tab. The report appears here straight away.</p>
            <a href="/report" target="_blank" rel="noreferrer" className={`mt-3 inline-block ${buttonClass}`}>Open report form</a>
          </Card>

          <Card title="Reset">
            {confirmReset ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    actions.resetDemo()
                    setConfirmReset(false)
                  }}
                  className="rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white"
                >
                  Yes, reset everything
                </button>
                <button onClick={() => setConfirmReset(false)} className="px-3 text-sm underline">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 text-sm font-semibold text-red-700 underline">
                <RotateCcw size={16} /> Reset all demo data
              </button>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

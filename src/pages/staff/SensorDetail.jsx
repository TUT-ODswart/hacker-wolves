import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Legend } from 'recharts'
import { useStore } from '../../data/StoreContext.js'
import { SENSOR_TYPES, can } from '../../data/constants.js'
import { NORMAL_PRESSURE, hourlySeries, normalFlow } from '../../data/model.js'
import { defaultCrew } from '../../data/helpers.js'
import { BackLink, Badge, Card, Empty, buttonClass } from '../../components/ui.jsx'
import { DAY, startOfDayMs, timeAgo } from '../../utils/format.js'

const dayLabel = (t) => new Date(t).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })

function CheckIcon({ ok }) {
  if (ok === true) return <CheckCircle2 className="shrink-0 text-green-600" size={22} />
  if (ok === false) return <XCircle className="shrink-0 text-red-600" size={22} />
  return <MinusCircle className="shrink-0 text-slate-400" size={22} />
}

export default function SensorDetail() {
  const { id } = useParams()
  const { state, analysis, now, user, actions } = useStore()
  const sensor = state.sensors.find((s) => s.id === id)
  if (!sensor) {
    return (
      <div>
        <BackLink to="/admin/sensors">Back to sensors</BackLink>
        <Empty>Sensor {id} not found.</Empty>
      </div>
    )
  }

  const asset = state.assets.find((a) => a.id === sensor.assetId)
  const x = analysis.sensors[sensor.id]
  const t = SENSOR_TYPES[sensor.type]
  const reading = x.latest ?? x.lastKnown
  const series = hourlySeries(sensor, asset, now, 168)
  const ticks = []
  for (let k = 6; k >= 0; k--) ticks.push(startOfDayMs(now) - k * DAY)
  const isManholeLevel = sensor.type === 'level' && asset.type === 'manhole'
  const repairJob = state.incidents.find((i) => i.sensorId === sensor.id && i.status !== 'Resolved')

  // Trend chart: last 7 days + today + projection forward
  let trend = null
  if (isManholeLevel) {
    trend = x.stats.days.map((d) => ({ label: dayLabel(d.day), peak: d.peak != null ? Math.round(d.peak) : null, night: d.night != null ? Math.round(d.night) : null }))
    trend.push({ label: 'Today', peak: Math.round(x.stats.peak24), night: null, projected: Math.round(x.stats.peak24) })
    if (x.prediction) {
      const days = Math.min(21, Math.ceil(x.prediction.daysToFailure) + 1)
      for (let k = 1; k <= days; k++) {
        const v = Math.min(asset.depthCm * 1.1, x.stats.peak24 + x.prediction.slope * k)
        trend.push({ label: dayLabel(now + k * DAY), projected: Math.round(v) })
      }
    }
  }

  function createRepair() {
    actions.createSensorRepair({
      assetId: asset.id,
      sensorId: sensor.id,
      title: `Fix sensor ${sensor.id} at ${asset.landmark}`,
      crewId: defaultCrew(state, asset.area),
      scheduledFor: now + DAY,
    })
  }

  return (
    <>
      <BackLink to="/admin/sensors">Back to sensors</BackLink>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{t.label}</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{sensor.id}</h1>
          <p className="text-slate-600">
            {asset.name}, {asset.landmark}, {asset.area}
          </p>
        </div>
        <Badge>{x.status}</Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">{x.latest ? 'Current reading' : 'Last known reading'}</p>
          <p className="text-2xl font-extrabold">{reading?.value != null ? `${reading.value} ${t.unit}` : '—'}</p>
          <p className="text-xs text-slate-500">{reading ? `Signal ${reading.mA.toFixed(1)} mA` : 'No signal'}</p>
        </div>
        <div className="rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">Last heartbeat</p>
          <p className="text-2xl font-extrabold">{timeAgo(new Date(x.lastSeen).toISOString(), now)}</p>
          <p className="text-xs text-slate-500">Expected every {state.settings.heartbeatMinutes} min</p>
        </div>
        <div className="rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">Battery</p>
          <p className={`text-2xl font-extrabold ${sensor.battery < 20 ? 'text-red-600' : ''}`}>{sensor.battery}%</p>
          <p className="text-xs text-slate-500">Installed {sensor.installedYear}</p>
        </div>
        <div className="rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">{isManholeLevel ? 'How full (24 h peak)' : sensor.type === 'flow' ? 'Flow vs normal (24 h)' : 'Average (24 h)'}</p>
          <p className="text-2xl font-extrabold">
            {isManholeLevel && x.stats.pct != null && `${x.stats.pct}%`}
            {sensor.type === 'flow' && x.stats.drop != null && `${x.stats.drop > 0 ? '−' : '+'}${Math.abs(Math.round(x.stats.drop * 100))}%`}
            {sensor.type === 'pressure' && x.stats.mean24 != null && `${x.stats.mean24.toFixed(2)} bar`}
            {sensor.type === 'level' && !isManholeLevel && x.stats.pct != null && `${x.stats.pct}%`}
          </p>
          <p className="text-xs text-slate-500">
            {isManholeLevel && `Warning ${state.settings.thresholds.levelWarnPct}%, alert ${state.settings.thresholds.levelAlertPct}%`}
            {sensor.type === 'flow' && `Normal average here ${normalFlow(asset).toFixed(1)} L/s`}
            {sensor.type === 'pressure' && `Normal ${NORMAL_PRESSURE.toFixed(1)} bar, minimum ${state.settings.thresholds.pressureMin} bar`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {trend && (
            <Card title="Trend and prediction">
              <p className="-mt-2 mb-3 text-sm text-slate-600">
                {!x.healthy
                  ? 'Trend ignored: this sensor is faulty, so its readings cannot be trusted.'
                  : x.prediction
                  ? `The level is rising about ${Math.round(x.prediction.slope)} cm per day. At this rate it reaches the alert level in about ${Math.max(0, Math.round(x.prediction.daysToAlert))} days and overflows in about ${Math.max(1, Math.round(x.prediction.daysToFailure))} days.`
                  : 'No upward trend. The 3 am level is the best early warning: when it creeps up night after night, something downstream is blocking.'}
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, Math.round(asset.depthCm * 1.1)]} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={asset.depthCm} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Overflow', fontSize: 11, fill: '#dc2626', position: 'insideTopLeft' }} />
                    <ReferenceLine y={x.stats.alertCm} stroke="#ea580c" strokeDasharray="4 4" label={{ value: 'Alert', fontSize: 11, fill: '#ea580c', position: 'insideTopLeft' }} />
                    <Line name="Daily peak (cm)" dataKey="peak" stroke="#11676a" strokeWidth={2} dot isAnimationActive={false} connectNulls />
                    <Line name="3 am level (cm)" dataKey="night" stroke="#6366f1" strokeWidth={2} dot isAnimationActive={false} connectNulls />
                    <Line name="Predicted" dataKey="projected" stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card title="Last 7 days">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" ticks={ticks} tickFormatter={dayLabel} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleString('en-ZA', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} formatter={(v) => [`${v} ${t.unit}`, t.label]} />
                  {isManholeLevel && <ReferenceLine y={x.stats.alertCm} stroke="#ea580c" strokeDasharray="4 4" />}
                  {sensor.type === 'pressure' && <ReferenceLine y={state.settings.thresholds.pressureMin} stroke="#dc2626" strokeDasharray="4 4" />}
                  <Line dataKey="value" stroke="#11676a" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Two daily peaks (morning and evening) and a low at night are normal. Gaps mean the sensor was offline.</p>
          </Card>

          <Card title="How this sensor works">
            <p className="text-sm text-slate-700"><strong>{t.what}</strong> {t.how}</p>
            <p className="mt-2 text-sm text-slate-600">
              It sends its reading as a 4–20 mA signal: 4 mA means zero, 20 mA means the maximum. A signal below 4 mA can only mean a broken wire or a dead sensor.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Is this sensor working?">
            <ul className="space-y-4">
              {x.checks.map((c) => (
                <li key={c.key} className="flex gap-3">
                  <CheckIcon ok={c.ok} />
                  <div>
                    <p className="font-semibold text-slate-900">{c.label}</p>
                    <p className="text-sm text-slate-600">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            {!x.healthy && <p className="mt-4 rounded-xl bg-fuchsia-50 p-3 text-sm text-fuchsia-900">This sensor's readings are being ignored for predictions until it is fixed. Residents' reports still cover this spot.</p>}
          </Card>

          {(!x.healthy || sensor.battery < 20) && can(user, 'planWork') && (
            <Card title="Send a crew">
              {repairJob ? (
                <p className="text-sm">
                  Crew sent for this sensor. <Link to={`/admin/incidents/${repairJob.id}`} className="font-semibold text-brand underline">Open incident</Link>.
                </p>
              ) : (
                <button onClick={createRepair} className={`w-full ${buttonClass}`}>Send a crew to fix this sensor</button>
              )}
            </Card>
          )}

          <Card title="Manhole">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Name</dt><dd className="font-semibold">{asset.name}</dd></div>
              <div><dt className="text-slate-500">Place</dt><dd>{asset.landmark}</dd></div>
              <div><dt className="text-slate-500">Area</dt><dd>{asset.area}</dd></div>
              <div><dt className="text-slate-500">Type</dt><dd>{asset.type === 'pump_station' ? 'Pump station' : 'Manhole'}</dd></div>
              <div><dt className="text-slate-500">Depth</dt><dd>{asset.depthCm} cm</dd></div>
              <div><dt className="text-slate-500">Why it matters</dt><dd>{asset.criticalityNote}</dd></div>
              <div><dt className="text-slate-500">Installed</dt><dd>{asset.installedYear}</dd></div>
            </dl>
            <a href={`https://www.google.com/maps?q=${asset.lat},${asset.lng}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand underline">
              Open on map
            </a>
          </Card>
        </div>
      </div>
    </>
  )
}

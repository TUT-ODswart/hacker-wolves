// Simulated sensor readings and the detection / prediction logic.
// Readings are calculated from time, so no database is needed.
import { DAY, HOUR, MINUTE, durationText } from '../utils/format.js'
import { SENSOR_TYPES } from './constants.js'

// ---------- helpers ----------
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function noise(seed, i) {
  let x = Math.imul(seed ^ Math.imul(i, 374761393), 668265263)
  x = (x ^ (x >>> 13)) >>> 0
  x = Math.imul(x, 1274126177) >>> 0
  return (x / 4294967295) * 2 - 1
}

function gauss(h, mu, s) {
  let d = Math.abs(h - mu)
  d = Math.min(d, 24 - d)
  return Math.exp(-(d * d) / (2 * s * s))
}

// How much people are using water at a given hour (0 = none, 1 = peak).
export function usage(hour) {
  return 0.1 + 0.9 * Math.max(gauss(hour, 7.5, 1.6), 0.85 * gauss(hour, 19.5, 2.2))
}

let meanUsage = 0
for (let h = 0; h < 24; h += 0.25) meanUsage += usage(h)
meanUsage /= 96

// Normal average flow at a manhole. Flow grows downstream as more homes connect.
export function normalFlow(asset) {
  return asset.baseFlowLps * (0.25 + 0.75 * meanUsage)
}
export const NORMAL_PRESSURE = 4.1 + 0.35 * meanUsage

function hourOf(t) {
  const d = new Date(t)
  return d.getHours() + d.getMinutes() / 60
}

export function startOfDay(t) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function regression(points) {
  const n = points.length
  if (n < 2) return { slope: 0 }
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const my = points.reduce((s, p) => s + p.y, 0) / n
  let num = 0
  let den = 0
  for (const p of points) {
    num += (p.x - mx) * (p.y - my)
    den += (p.x - mx) ** 2
  }
  return { slope: den ? num / den : 0 }
}

const r1 = (v) => Math.round(v * 10) / 10
const r2 = (v) => Math.round(v * 100) / 100

// ---------- readings ----------
export function rangeOf(sensor, asset) {
  if (sensor.type === 'level') return asset.depthCm
  if (sensor.type === 'flow') return asset.baseFlowLps * 2
  return 10
}

function toMa(v, range) {
  return 4 + 16 * Math.min(1, Math.max(0, v / range))
}

// Days since a problem started, at time t. Simulations run in fast-forward.
function scenarioDays(scenario, t, now) {
  if (!scenario) return -1
  if (scenario.sim) {
    const { startedAt, durationMs, days } = scenario.sim
    const dNow = Math.min(days, Math.max(0, ((now - startedAt) / durationMs) * days))
    return dNow - (now - t) / DAY
  }
  return (t - scenario.startedAt) / DAY
}

function rawValue(sensor, asset, t, now) {
  const u = usage(hourOf(t))
  const n = noise(hash(sensor.id), Math.floor(t / (15 * MINUTE)))
  const sc = asset.scenario
  const d = scenarioDays(sc, t, now)
  const active = d > 0

  if (sensor.type === 'level') {
    const D = asset.depthCm
    if (asset.type === 'pump_station') return D * (0.3 + 0.25 * u) + n * 4
    let v = D * (0.1 + 0.22 * u) + n * 2.5
    if (active && sc.kind === 'blockage') v += D * 0.012 * sc.rate * Math.pow(d, 1.25) * (0.55 + 0.45 * u)
    if (active && sc.kind === 'leak') v -= D * 0.01 * Math.min(d, 10) * u
    return Math.max(0, v)
  }

  if (sensor.type === 'flow') {
    let v = asset.baseFlowLps * (0.25 + 0.75 * u) * (1 + n * 0.03)
    if (active && sc.kind === 'blockage') v *= 1 - Math.min(0.75, 0.035 * sc.rate * d)
    if (active && sc.kind === 'leak') v *= 1 - Math.min(0.55, 0.022 * sc.rate * d)
    return Math.max(0, v)
  }

  let v = 4.1 + 0.35 * u + n * 0.05
  if (active && sc.kind === 'pressure_drop') v -= 0.11 * sc.rate * d
  return Math.max(0, v)
}

// One reading, including the effect of any sensor fault.
export function readingAt(sensor, asset, t, now) {
  const f = sensor.fault
  const range = rangeOf(sensor, asset)
  const round = sensor.type === 'pressure' ? r2 : r1
  if (f && t >= f.since) {
    if (f.kind === 'offline') return null
    if (f.kind === 'no_signal') return { value: null, mA: 0 }
    if (f.kind === 'frozen') {
      const v = round(rawValue(sensor, asset, f.since, now))
      return { value: v, mA: r1(toMa(v, range)) }
    }
    if (f.kind === 'impossible') {
      const v = round(range * 2.3 + noise(hash(sensor.id), Math.floor(t / (15 * MINUTE))) * range * 0.05)
      return { value: v, mA: 22 }
    }
  }
  const v = round(rawValue(sensor, asset, t, now))
  return { value: v, mA: r1(toMa(v, range)) }
}

export function hourlySeries(sensor, asset, now, hours = 168) {
  const out = []
  const base = Math.floor(now / HOUR) * HOUR
  for (let k = hours; k >= 0; k--) {
    const t = k === 0 ? now : base - (k - 1) * HOUR
    const r = readingAt(sensor, asset, t, now)
    out.push({ t, value: r?.value ?? null })
  }
  return out
}

// Night (3 am) level and daily peak for each of the last few days.
export function dailyStats(sensor, asset, now, days = 7) {
  const out = []
  const today = startOfDay(now)
  for (let k = days; k >= 1; k--) {
    const start = today - k * DAY
    let peak = null
    let sum = 0
    let count = 0
    for (let h = 0; h < 24; h++) {
      const r = readingAt(sensor, asset, start + h * HOUR, now)
      if (r?.value == null) continue
      peak = peak == null ? r.value : Math.max(peak, r.value)
      sum += r.value
      count++
    }
    const night = readingAt(sensor, asset, start + 3 * HOUR, now)?.value ?? null
    out.push({ day: start, x: -k, peak, night, mean: count ? sum / count : null })
  }
  return out
}

function last24(sensor, asset, now) {
  const vals = []
  for (let h = 0; h < 24; h++) {
    const r = readingAt(sensor, asset, now - h * HOUR, now)
    if (r?.value != null) vals.push(r.value)
  }
  if (!vals.length) return { peak: null, mean: null }
  return { peak: Math.max(...vals), mean: vals.reduce((s, v) => s + v, 0) / vals.length }
}

// ---------- sensor analysis ----------
const FAULT_REASON = {
  signal: 'Signal outside 4–20 mA',
  range: 'Impossible reading',
  frozen: 'Stuck on one value',
  neighbours: 'Disagrees with nearby sensors',
}

function analyzeSensor(sensor, asset, now, settings) {
  const unit = SENSOR_TYPES[sensor.type].unit
  const limitMs = settings.heartbeatMinutes * settings.missedBeats * MINUTE
  const lastSeen =
    sensor.fault?.kind === 'offline' ? sensor.fault.since : now - (hash(sensor.id) % settings.heartbeatMinutes) * MINUTE
  const offline = now - lastSeen > limitMs
  const range = rangeOf(sensor, asset)
  const latest = offline ? null : readingAt(sensor, asset, now, now)
  const lastKnown = offline ? readingAt(sensor, asset, lastSeen - 1, now) : latest
  const mins = Math.round((now - lastSeen) / MINUTE)

  const checks = [
    {
      key: 'heartbeat',
      label: 'Heartbeat',
      ok: !offline,
      detail: offline
        ? `No heartbeat for ${durationText(mins)}. We mark a sensor offline after ${settings.missedBeats} missed heartbeats (${settings.missedBeats * settings.heartbeatMinutes} min).`
        : `Last heartbeat ${mins} min ago. Expected every ${settings.heartbeatMinutes} min.`,
    },
  ]

  if (offline) {
    for (const [key, label] of [['signal', '4–20 mA signal'], ['range', 'Possible value'], ['frozen', 'Readings changing']]) {
      checks.push({ key, label, ok: null, detail: 'Cannot check while the sensor is offline.' })
    }
  } else {
    const mA = latest.mA
    const signalOk = mA >= 3.6 && mA <= 21
    checks.push({
      key: 'signal',
      label: '4–20 mA signal',
      ok: signalOk,
      detail: signalOk
        ? `${mA.toFixed(1)} mA, inside the normal 4–20 mA range.`
        : mA < 3.6
          ? `${mA.toFixed(1)} mA. Below 4 mA means a cut wire or a dead sensor, not an empty pipe.`
          : `${mA.toFixed(1)} mA. Above 20 mA means the sensor is out of range or faulty.`,
    })

    const v = latest.value
    const rangeOk = v != null && v >= 0 && v <= range * 1.05
    checks.push({
      key: 'range',
      label: 'Possible value',
      ok: v == null ? null : rangeOk,
      detail: v == null ? 'No value to check.' : rangeOk ? `${v} ${unit} is physically possible here.` : `${v} ${unit} is impossible here. The maximum is ${range} ${unit}.`,
    })

    const recent = []
    for (let k = 7; k >= 0; k--) recent.push(readingAt(sensor, asset, now - k * 15 * MINUTE, now)?.value ?? null)
    const hasNull = recent.some((x) => x == null)
    const frozen = !hasNull && recent.every((x) => x === recent[0])
    checks.push({
      key: 'frozen',
      label: 'Readings changing',
      ok: hasNull ? null : !frozen,
      detail: frozen ? `Stuck on ${recent[0]} ${unit} for 2 hours. Real sewage levels always move a little.` : hasNull ? 'Not enough readings.' : 'Readings are changing normally.',
    })
  }

  checks.push({
    key: 'battery',
    label: 'Battery',
    ok: sensor.battery >= 20,
    detail: sensor.battery >= 20 ? `${sensor.battery}%` : `${sensor.battery}%. Replace on the next visit.`,
  })

  // Trend and prediction
  const days = dailyStats(sensor, asset, now, 7)
  const l24 = last24(sensor, asset, now)
  let readingStatus = 'Normal'
  const stats = { peak24: l24.peak, mean24: l24.mean, days }
  let prediction = null

  if (sensor.type === 'level' && asset.type === 'manhole' && l24.peak != null) {
    const D = asset.depthCm
    const alertCm = (D * settings.thresholds.levelAlertPct) / 100
    const warnCm = (D * settings.thresholds.levelWarnPct) / 100
    const pts = days.filter((d) => d.peak != null).map((d) => ({ x: d.x, y: d.peak }))
    pts.push({ x: 0, y: l24.peak })
    const { slope } = regression(pts.slice(-6))
    stats.slope = r1(slope)
    stats.alertCm = r1(alertCm)
    stats.warnCm = r1(warnCm)
    stats.pct = Math.round((l24.peak / D) * 100)
    if (slope > 0.8) {
      prediction = {
        daysToAlert: Math.max(0, (alertCm - l24.peak) / slope),
        daysToFailure: Math.max(0, (D - l24.peak) / slope),
        slope,
      }
    }
    if (l24.peak >= alertCm) readingStatus = 'Alert'
    else if (l24.peak >= warnCm || (prediction && prediction.daysToFailure <= 14)) readingStatus = 'Warning'
  } else if (sensor.type === 'level' && l24.peak != null) {
    stats.pct = Math.round((l24.peak / asset.depthCm) * 100)
    if (stats.pct >= 90) readingStatus = 'Alert'
  } else if (sensor.type === 'flow' && l24.mean != null) {
    const drop = 1 - l24.mean / normalFlow(asset)
    stats.drop = drop
    if (drop >= settings.thresholds.flowDropPct / 100) readingStatus = 'Alert'
    else if (drop >= 0.15) readingStatus = 'Warning'
  } else if (sensor.type === 'pressure' && l24.mean != null) {
    const pts = days.filter((d) => d.mean != null).map((d) => ({ x: d.x, y: d.mean }))
    pts.push({ x: 0, y: l24.mean })
    const { slope } = regression(pts.slice(-6))
    stats.slope = r2(slope)
    const min = settings.thresholds.pressureMin
    if (slope < -0.03) prediction = { daysToFailure: Math.max(0, (l24.mean - min) / -slope), slope }
    if (l24.mean < min) readingStatus = 'Alert'
    else if (prediction && prediction.daysToFailure <= 14) readingStatus = 'Warning'
  }

  const failing = checks.filter((c) => c.ok === false && c.key !== 'battery')
  const status = offline ? 'Offline' : failing.length ? 'Fault' : readingStatus === 'Alert' ? 'Alert' : readingStatus === 'Warning' ? 'Warning' : 'Online'

  return {
    sensorId: sensor.id,
    lastSeen,
    latest,
    lastKnown,
    checks,
    readingStatus,
    stats,
    prediction,
    status,
    healthy: status !== 'Offline' && status !== 'Fault',
    faultReason: offline ? 'No heartbeat' : failing[0] ? FAULT_REASON[failing[0].key] : null,
  }
}

export function likelihoodFromDays(days) {
  if (days == null) return 20
  if (days <= 0.5) return 100
  if (days <= 3) return 90
  if (days <= 7) return 75
  if (days <= 14) return 55
  if (days <= 30) return 35
  return 20
}

export function priorityLevel(score) {
  if (score >= 70) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}

// ---------- whole network ----------
export function analyzeNetwork(state, now) {
  const { assets, sensors: sensorList, settings } = state
  const assetsById = Object.fromEntries(assets.map((a) => [a.id, a]))
  const byAsset = {}
  for (const s of sensorList) (byAsset[s.assetId] ??= []).push(s)
  const upstreamOf = {}
  for (const a of assets) if (a.downstreamId) upstreamOf[a.downstreamId] = a

  const sensors = {}
  for (const s of sensorList) sensors[s.id] = analyzeSensor(s, assetsById[s.assetId], now, settings)

  const find = (assetId, type) => (byAsset[assetId] ?? []).find((s) => s.type === type)

  // Cross-check: water rising but flow normal at the same manhole means the level sensor is wrong.
  for (const a of assets) {
    const lv = find(a.id, 'level')
    if (!lv || a.type !== 'manhole') continue
    const la = sensors[lv.id]
    const vs = find(a.id, 'flow')
    const va = vs ? sensors[vs.id] : null
    if (!la.healthy) continue
    if (!va || !va.healthy) {
      la.checks.push({ key: 'neighbours', label: 'Agrees with nearby sensors', ok: null, detail: 'No flow meter at this manhole to compare with.' })
      continue
    }
    const disagrees = la.readingStatus === 'Alert' && (va.stats.drop ?? 0) < 0.08
    la.checks.push({
      key: 'neighbours',
      label: 'Agrees with nearby sensors',
      ok: !disagrees,
      detail: disagrees
        ? `Says the manhole is filling up, but the flow meter here (${vs.id}) shows normal flow. The level sensor is probably wrong.`
        : `Consistent with the flow meter here (${vs.id}).`,
    })
    if (disagrees) {
      la.status = 'Fault'
      la.healthy = false
      la.faultReason = 'Disagrees with nearby sensors'
    }
  }

  const healthyOf = (assetId, type) => {
    const s = find(assetId, type)
    return s && sensors[s.id].healthy ? { sensor: s, a: sensors[s.id] } : null
  }

  const out = {}
  for (const asset of assets) {
    const list = byAsset[asset.id] ?? []
    const level = healthyOf(asset.id, 'level')
    const vel = healthyOf(asset.id, 'flow')
    const pres = healthyOf(asset.id, 'pressure')
    let problem = null
    let likelihood = 10

    const levelRising = level && (level.a.stats.slope ?? 0) > 0.8
    const flowDrop = vel ? vel.a.stats.drop ?? 0 : null
    const blockageSigns = level && (level.a.readingStatus !== 'Normal' || (levelRising && flowDrop >= 0.15))
    if (asset.type === 'manhole' && blockageSigns && (!vel || flowDrop >= 0.1)) {
      const { stats, prediction } = level.a
      const nights = stats.days.map((d) => d.night).filter((v) => v != null)
      const evidence = []
      if (nights.length >= 2) evidence.push(`Night-time (3 am) level went from ${Math.round(nights[0])} cm to ${Math.round(nights[nights.length - 1])} cm over the last week.`)
      evidence.push(`Highest level in the last 24 h: ${Math.round(stats.peak24)} cm of ${asset.depthCm} cm (${stats.pct}% full).`)
      if (vel) evidence.push(`Flow through this manhole is down ${Math.round(vel.a.stats.drop * 100)}%, so sewage is backing up.`)
      else evidence.push('No flow meter here, so the blockage is not yet confirmed by a second sensor.')
      if (prediction) evidence.push(`Rising about ${Math.round(prediction.slope)} cm per day. At this rate it overflows in about ${Math.max(1, Math.round(prediction.daysToFailure))} days.`)
      likelihood = level.a.readingStatus === 'Alert' ? 100 : likelihoodFromDays(prediction?.daysToFailure)
      if (settings.rainForecast) {
        likelihood = Math.min(100, likelihood + 10)
        evidence.push('Heavy rain is forecast, which adds to the load on this pipe.')
      }
      problem = {
        kind: 'blockage',
        label: 'Blockage forming',
        where: asset.downstreamId ? `Between ${asset.id} and ${asset.downstreamId}` : `Downstream of ${asset.id}`,
        confidence: vel ? 'High' : 'Medium',
        daysToFailure: level.a.readingStatus === 'Alert' ? 0 : prediction?.daysToFailure ?? null,
        summary: level.a.readingStatus === 'Alert' ? 'Already above the alert level' : prediction ? `Likely to overflow in about ${Math.max(1, Math.round(prediction.daysToFailure))} days` : 'Level higher than normal',
        evidence,
      }
    }

    if (!problem && vel && asset.type === 'manhole' && !levelRising) {
      let up = upstreamOf[asset.id]
      let upVel = null
      while (up && !upVel) {
        upVel = healthyOf(up.id, 'flow')
        if (!upVel) up = upstreamOf[up.id]
      }
      if (upVel && vel.a.stats.mean24 != null && upVel.a.stats.mean24 != null) {
        // Compare with what normally arrives here, since flow grows downstream as more homes connect.
        const expected = upVel.a.stats.mean24 * (normalFlow(asset) / normalFlow(up))
        const loss = 1 - vel.a.stats.mean24 / expected
        if (loss >= 0.1) {
          likelihood = Math.min(95, Math.round(50 + loss * 150))
          problem = {
            kind: 'leak',
            label: 'Possible pipe leak',
            where: `Between ${up.id} and ${asset.id}`,
            confidence: level ? 'High' : 'Medium',
            daysToFailure: null,
            summary: `About ${Math.round(loss * 100)}% of the flow is not arriving`,
            evidence: [
              `Flow at ${up.id} averages ${upVel.a.stats.mean24.toFixed(1)} L/s, so about ${expected.toFixed(1)} L/s should reach ${asset.id}. Only ${vel.a.stats.mean24.toFixed(1)} L/s is arriving.`,
              `About ${Math.round(loss * 100)}% of the sewage is leaving the pipe between these two points.`,
              level ? 'The level here is not rising, so this is a leak, not a blockage.' : 'No level sensor here to rule out a blockage.',
            ],
          }
        }
      }
    }

    if (asset.type === 'pump_station' && pres && pres.a.readingStatus !== 'Normal') {
      const { stats, prediction } = pres.a
      likelihood = pres.a.readingStatus === 'Alert' ? 100 : likelihoodFromDays(prediction?.daysToFailure)
      problem = {
        kind: 'pressure_drop',
        label: 'Rising main losing pressure',
        where: `Rising main from ${asset.id}`,
        confidence: 'Medium',
        daysToFailure: pres.a.readingStatus === 'Alert' ? 0 : prediction?.daysToFailure ?? null,
        summary: prediction ? `Drops below safe pressure in about ${Math.max(1, Math.round(prediction.daysToFailure))} days` : 'Pressure below the safe level',
        evidence: [
          `Average pressure over the last 24 h: ${stats.mean24.toFixed(2)} bar. Normal is about ${NORMAL_PRESSURE.toFixed(1)} bar.`,
          prediction ? `Dropping about ${Math.abs(prediction.slope).toFixed(2)} bar per day.` : 'Pressure is below the safe level.',
          'Pressure dropping along a pumped pipe usually means a leak or a burst.',
        ],
      }
    }

    const score = Math.round((likelihood * asset.criticality) / 5)
    const unhealthyAll = list.length > 0 && list.every((s) => !sensors[s.id].healthy)
    out[asset.id] = {
      problem,
      likelihood,
      score,
      level: priorityLevel(score),
      condition: problem ? (score >= 70 || likelihood >= 90 ? 'Critical' : 'Warning') : unhealthyAll ? 'Unknown' : 'Good',
    }
  }

  const statusCounts = { Online: 0, Warning: 0, Alert: 0, Fault: 0, Offline: 0 }
  for (const id in sensors) statusCounts[sensors[id].status]++

  return { sensors, assets: out, statusCounts }
}

// How serious a resident report is, before we know more.
export const RESIDENT_LIKELIHOOD = {
  'Overflowing manhole': 100,
  'Sewage on the street': 100,
  'Leaking pipe': 80,
  'Blocked drain': 75,
  'Bad smell': 55,
  Other: 60,
}
const RESIDENT_REASON = {
  'Overflowing manhole': 'Sewage is already spilling.',
  'Sewage on the street': 'Sewage is already spilling.',
  'Leaking pipe': 'A leak residents can see.',
  'Blocked drain': 'A blockage residents can see.',
  'Bad smell': 'A smell can be an early sign of a leak or blockage.',
}

// Priority for an incident: how likely × how bad.
export function incidentPriority(incident, state, analysis) {
  if (incident.status === 'Resolved') return incident.priority
  const asset = state.assets.find((a) => a.id === incident.assetId)
  const impact = asset?.criticality ?? 3
  let likelihood
  let reason
  if (incident.source === 'resident') {
    const n = incident.reportIds.length
    likelihood = Math.min(100, (RESIDENT_LIKELIHOOD[incident.type] ?? 70) + 5 * (n - 1))
    reason = `${RESIDENT_REASON[incident.type] ?? 'Reported by residents.'} Reported by ${n} resident${n === 1 ? '' : 's'}.`
  } else {
    const a = analysis.assets[incident.assetId]
    if (a?.problem) {
      likelihood = a.likelihood
      reason = `${a.problem.summary}.`
    } else {
      likelihood = incident.priority?.likelihood ?? 50
      reason = 'Based on readings when it was detected.'
    }
  }
  const score = Math.round((likelihood * impact) / 5)
  return { score, level: priorityLevel(score), likelihood, impact, reason, impactNote: asset?.criticalityNote ?? 'Location not linked to a manhole' }
}

// Runs every few seconds: turns sensor analysis into incidents and alerts.
// Every alert here comes from what the sensors show, not from the simulation timer.
import { MINUTE } from '../utils/format.js'
import { analyzeNetwork, incidentPriority } from './model.js'
import { PROBLEM_TYPES } from './constants.js'
import { audit, dueAt, iso, makePriority, nextId, notify, updateIn } from './helpers.js'

const ADMIN = ['admin']

function sameList(a, b) {
  return [...a].sort().join() === [...b].sort().join()
}

export function engineTick(state, now) {
  const analysis = analyzeNetwork(state, now)
  let s = state
  const createdNow = new Set()

  // 1. Problems detected by sensors.
  for (const asset of s.assets) {
    const a = analysis.assets[asset.id]
    if (!a.problem || a.likelihood < 55) continue
    const type = PROBLEM_TYPES[a.problem.kind]
    const prediction = { daysToFailure: a.problem.daysToFailure, confidence: a.problem.confidence, evidence: a.problem.evidence }
    const open = s.incidents.find((i) => i.assetId === asset.id && i.status !== 'Resolved')

    // 1a. Residents already reported this spot: add the sensor evidence instead of making a duplicate.
    if (open) {
      if (open.source === 'resident' && !open.sensorConfirmed) {
        s = {
          ...s,
          incidents: updateIn(s.incidents, open.id, (i) => ({
            sensorConfirmed: true,
            prediction,
            timeline: [...i.timeline, { at: iso(now), text: `Sensors confirm the problem: ${a.problem.label.toLowerCase()}. ${a.problem.summary}.` }],
          })),
        }
        s = notify(s, { roles: ADMIN, title: `Sensors confirm ${open.id}`, body: `${asset.landmark}: ${a.problem.summary}.`, link: `/admin/incidents/${open.id}`, severity: 'high' }, now)
        createdNow.add(asset.id)
      }
      continue
    }

    // 1b. New problem: create it.
    const priority = makePriority(a.likelihood, asset.criticality)
    const id = nextId(s.incidents, 'INC', 1000)
    const incident = {
      id,
      source: 'sensor',
      type,
      title: `${type} at ${asset.landmark}`,
      description: `${a.problem.label}. ${a.problem.where}. ${a.problem.summary}.`,
      assetId: asset.id,
      sensorId: null,
      area: asset.area,
      lat: asset.lat,
      lng: asset.lng,
      status: 'Unattended',
      kind: 'Proactive',
      priority,
      prediction,
      reportIds: [],
      crewId: null,
      scheduledFor: null,
      startedAt: null,
      beforePhoto: null,
      afterPhoto: null,
      notes: '',
      reportedAt: iso(now),
      assignedAt: null,
      resolvedAt: null,
      dueAt: dueAt(priority.level, s.settings, now),
      resolutionNote: null,
      escalated: false,
      timeline: [{ at: iso(now), text: `Detected automatically by sensors on ${asset.id}. ${a.problem.summary}.` }],
      comments: [],
    }
    s = { ...s, incidents: [incident, ...s.incidents] }
    s = notify(s, { roles: ADMIN, title: `New alert: ${type.toLowerCase()} at ${asset.landmark}`, body: `${asset.id}, ${asset.area}. ${a.problem.summary}.`, link: `/admin/incidents/${id}`, severity: priority.level === 'High' ? 'high' : 'info' }, now)
    s = audit(s, null, `Created ${id} from sensor data`, now)
    createdNow.add(asset.id)
  }

  // 2. A problem that gets worse (warning -> critical) raises a second, urgent alert.
  const levels = { ...(s.alertLevels ?? {}) }
  let levelsChanged = false
  for (const asset of s.assets) {
    const a = analysis.assets[asset.id]
    const level = a.problem ? a.condition : null
    const prev = levels[asset.id] ?? null
    if (level === prev) continue
    levelsChanged = true
    if (level) levels[asset.id] = level
    else delete levels[asset.id]
    if (level === 'Critical' && !createdNow.has(asset.id)) {
      const inc = s.incidents.find((i) => i.assetId === asset.id && i.status !== 'Resolved')
      s = notify(s, {
        roles: ADMIN,
        title: `Critical: ${asset.landmark}`,
        body: `${asset.id}, ${asset.area}. ${a.problem.summary}. Send a crew now.`,
        link: inc ? `/admin/incidents/${inc.id}` : '/admin/incidents',
        severity: 'high',
      }, now)
    }
  }
  if (levelsChanged) s = { ...s, alertLevels: levels }

  // 3. Sensors that stop working or start giving bad readings.
  const faulty = Object.values(analysis.sensors).filter((x) => !x.healthy)
  const faultyIds = faulty.map((x) => x.sensorId)
  const known = s.knownFaults ?? []
  for (const f of faulty) {
    if (known.includes(f.sensorId)) continue
    const sensor = s.sensors.find((x) => x.id === f.sensorId)
    s = notify(s, { roles: ADMIN, title: `Sensor ${f.sensorId} ${f.status === 'Offline' ? 'offline' : 'faulty'}`, body: `${sensor.assetId}: ${f.faultReason}. Its readings are ignored until it is fixed.`, link: `/admin/sensors/${f.sensorId}` }, now)
  }
  if (!sameList(faultyIds, known)) s = { ...s, knownFaults: faultyIds }

  // 4. Batteries running flat.
  const low = s.sensors.filter((x) => x.battery < 20).map((x) => x.id)
  const knownLow = s.knownLowBattery ?? []
  for (const id of low) {
    if (knownLow.includes(id)) continue
    const sensor = s.sensors.find((x) => x.id === id)
    s = notify(s, { roles: ADMIN, title: `Sensor ${id} battery low`, body: `${sensor.assetId}: battery at ${sensor.battery}%. Replace it on the next visit.`, link: `/admin/sensors/${id}` }, now)
  }
  if (!sameList(low, knownLow)) s = { ...s, knownLowBattery: low }

  // 5. Urgent problems nobody has sent a crew to.
  const limit = s.settings.escalationMinutes * MINUTE
  for (const inc of s.incidents) {
    if (inc.status !== 'Unattended' || inc.escalated) continue
    if (now - new Date(inc.reportedAt).getTime() < limit) continue
    const p = incidentPriority(inc, s, analysis)
    if (p.level !== 'High') continue
    s = {
      ...s,
      incidents: updateIn(s.incidents, inc.id, (i) => ({
        escalated: true,
        timeline: [...i.timeline, { at: iso(now), text: `Still waiting for a crew after ${s.settings.escalationMinutes} min` }],
      })),
    }
    s = notify(s, { roles: ADMIN, title: `Still waiting: ${inc.id} needs a crew`, body: `${inc.title} has waited more than ${s.settings.escalationMinutes} min.`, link: `/admin/incidents/${inc.id}`, severity: 'high' }, now)
  }

  // Returning the same object when nothing changed stops needless saving and re-rendering.
  return s
}

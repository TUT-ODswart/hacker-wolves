// Runs every few seconds: turns sensor analysis into incidents and alerts.
import { MINUTE } from '../utils/format.js'
import { analyzeNetwork, incidentPriority } from './model.js'
import { PROBLEM_TYPES } from './constants.js'
import { audit, dueAt, iso, makePriority, nextId, notify, updateIn } from './helpers.js'

export function engineTick(state, now) {
  const analysis = analyzeNetwork(state, now)
  let s = state

  // 1. New problems detected by sensors become incidents automatically.
  for (const asset of s.assets) {
    const a = analysis.assets[asset.id]
    if (!a.problem || a.likelihood < 55) continue
    if (s.incidents.some((i) => i.assetId === asset.id && i.status !== 'Resolved')) continue
    const type = PROBLEM_TYPES[a.problem.kind]
    const priority = makePriority(a.likelihood, asset.criticality)
    const id = nextId(s.incidents, 'INC', 1000)
    const incident = {
      id,
      source: 'sensor',
      type,
      title: `${type} at ${asset.landmark}`,
      description: `${a.problem.label}. ${a.problem.where}. ${a.problem.summary}.`,
      assetId: asset.id,
      area: asset.area,
      lat: asset.lat,
      lng: asset.lng,
      status: 'Unattended',
      priority,
      prediction: { daysToFailure: a.problem.daysToFailure, confidence: a.problem.confidence, evidence: a.problem.evidence },
      reportIds: [],
      crewId: null,
      workOrderId: null,
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
    const roles = priority.level === 'High' ? ['admin', 'supervisor', 'manager'] : ['admin', 'supervisor']
    s = notify(s, { roles, title: `Predicted: ${type.toLowerCase()} at ${asset.id}`, body: `${asset.landmark}. ${a.problem.summary}.`, link: `/admin/incidents/${id}`, severity: priority.level === 'High' ? 'high' : 'info' }, now)
    s = audit(s, null, `Created ${id} from sensor data`, now)
  }

  // 2. Sensors that stop working or start giving bad readings.
  const faulty = Object.values(analysis.sensors).filter((x) => !x.healthy)
  const faultyIds = faulty.map((x) => x.sensorId).sort()
  const known = s.knownFaults ?? []
  for (const f of faulty) {
    if (known.includes(f.sensorId)) continue
    const sensor = s.sensors.find((x) => x.id === f.sensorId)
    s = notify(s, { roles: ['admin', 'supervisor'], title: `Sensor ${f.sensorId} ${f.status === 'Offline' ? 'offline' : 'faulty'}`, body: `${sensor.assetId}: ${f.faultReason}. Its readings are ignored until it is fixed.`, link: `/admin/sensors/${f.sensorId}` }, now)
  }
  if (faultyIds.join() !== [...known].sort().join()) s = { ...s, knownFaults: faultyIds }

  // 3. Escalate high-priority incidents nobody has picked up.
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
        timeline: [...i.timeline, { at: iso(now), text: `Escalated to managers: not assigned within ${s.settings.escalationMinutes} min` }],
      })),
    }
    s = notify(s, { roles: ['manager', 'admin'], title: `Escalated: ${inc.id} not assigned`, body: `${inc.title} has waited more than ${s.settings.escalationMinutes} min.`, link: `/admin/incidents/${inc.id}`, severity: 'high' }, now)
  }

  return s
}

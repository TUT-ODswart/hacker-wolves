// Runs every few seconds: turns sensor analysis into incidents and alerts.
import { MINUTE } from '../utils/format.js'
import { analyzeNetwork, incidentPriority } from './model.js'
import { PROBLEM_TYPES } from './constants.js'
import { audit, dueAt, iso, makePriority, nextId, notify, updateIn } from './helpers.js'

export function engineTick(state, now) {
  const analysis = analyzeNetwork(state, now)
  let s = state
  const simulationAlerts = { ...(s.simulationAlerts ?? {}) }

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
      sensorId: null,
      area: asset.area,
      lat: asset.lat,
      lng: asset.lng,
      status: 'Unattended',
      kind: 'Proactive',
      priority,
      prediction: { daysToFailure: a.problem.daysToFailure, confidence: a.problem.confidence, evidence: a.problem.evidence },
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
    s = notify(s, { roles: ['admin'], title: `Predicted: ${type.toLowerCase()} at ${asset.id}`, body: `${asset.landmark}. ${a.problem.summary}.`, link: `/admin/incidents/${id}`, severity: priority.level === 'High' ? 'high' : 'info' }, now)
    s = audit(s, null, `Created ${id} from sensor data`, now)
  }

  // 2. Simulations notify admins as their evidence moves from prediction to danger.
  for (const asset of s.assets) {
    const scenario = asset.scenario
    if (!scenario?.sim) continue

    const a = analysis.assets[asset.id]
    const progress = Math.min(1, Math.max(0, (now - scenario.sim.startedAt) / scenario.sim.durationMs))
    const sensors = Object.values(analysis.sensors).filter((x) => {
      const sensor = s.sensors.find((item) => item.id === x.sensorId)
      return sensor?.assetId === asset.id
    })
    const reachesAlert = sensors.some((sensor) => sensor.status === 'Alert')
    const reachesCritical = a?.condition === 'Critical' || a?.problem?.likelihood >= 90 || progress >= 0.85
    const reachesPrediction = (a?.problem && a.likelihood >= 55) || progress >= 0.25
    const previous = simulationAlerts[asset.id]?.startedAt === scenario.sim.startedAt
      ? simulationAlerts[asset.id]
      : { startedAt: scenario.sim.startedAt }
    const incident = s.incidents.find((i) => i.assetId === asset.id && i.status !== 'Resolved')
    const link = incident ? `/admin/incidents/${incident.id}` : `/admin/sensors/${sensors[0]?.sensorId ?? ''}`

    if (reachesPrediction && !previous.predicted) {
      s = notify(
        s,
        {
          roles: ['admin'],
          title: `Simulation predicted: ${asset.id}`,
          body: `${asset.landmark}. ${a?.problem?.summary ?? `The simulated ${scenario.kind.replace('_', ' ')} is now showing a predicted issue.`}`,
          link,
          severity: 'info',
        },
        now,
      )
      previous.predicted = true
    }
    if ((reachesAlert || progress >= 0.6) && !previous.alert) {
      s = notify(
        s,
        {
          roles: ['admin'],
          title: `Simulation alert: ${asset.id}`,
          body: `${asset.landmark} has reached the sensor alert level.`,
          link,
          severity: 'high',
        },
        now,
      )
      previous.alert = true
    }
    if (reachesCritical && !previous.critical) {
      s = notify(
        s,
        {
          roles: ['admin'],
          title: `Critical alert: ${asset.id}`,
          body: `${asset.landmark} has reached a critical condition and needs urgent attention.`,
          link,
          severity: 'high',
        },
        now,
      )
      previous.critical = true
    }
    simulationAlerts[asset.id] = previous
  }
  s = { ...s, simulationAlerts }

  // 3. Sensors that stop working or start giving bad readings.
  const faulty = Object.values(analysis.sensors).filter((x) => !x.healthy)
  const faultyIds = faulty.map((x) => x.sensorId).sort()
  const known = s.knownFaults ?? []
  for (const f of faulty) {
    if (known.includes(f.sensorId)) continue
    const sensor = s.sensors.find((x) => x.id === f.sensorId)
    s = notify(s, { roles: ['admin'], title: `Sensor ${f.sensorId} ${f.status === 'Offline' ? 'offline' : 'faulty'}`, body: `${sensor.assetId}: ${f.faultReason}. Its readings are ignored until it is fixed.`, link: `/admin/sensors/${f.sensorId}` }, now)
  }
  if (faultyIds.join() !== [...known].sort().join()) s = { ...s, knownFaults: faultyIds }

  // 4. Escalate high-priority problems nobody has picked up (notify admin).
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
    s = notify(s, { roles: ['admin'], title: `Still new: ${inc.id} needs a crew`, body: `${inc.title} has waited more than ${s.settings.escalationMinutes} min.`, link: `/admin/incidents/${inc.id}`, severity: 'high' }, now)
  }

  return s
}

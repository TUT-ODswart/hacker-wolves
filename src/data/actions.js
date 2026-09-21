// Every change to the data goes through one of these functions.
// Each takes the current state and returns the new state.
import { DAY, HOUR, MINUTE, distanceKm } from '../utils/format.js'
import { analyzeNetwork, incidentPriority, RESIDENT_LIKELIHOOD } from './model.js'
import { AREAS, createSeedState } from './seed.js'
import { audit, crewMembers, dueAt, iso, makePriority, nextId, notify, sms, updateIn } from './helpers.js'

const ADMIN = ['admin']
const crewName = (s, id) => s.crews.find((c) => c.id === id)?.name ?? id

function smsResidents(s, incident, text, now) {
  for (const rid of incident.reportIds) {
    const r = s.reports.find((x) => x.id === rid)
    if (r?.phone && r.consent) s = sms(s, { to: `${r.name || 'Resident'} (${r.phone})`, audience: 'Resident', text: text(r) }, now)
  }
  return s
}

function notifyCrew(s, crewId, title, body, link, now) {
  const members = crewMembers(s, crewId)
  s = notify(s, { userIds: members.map((m) => m.id), title, body, link }, now)
  for (const m of members) s = sms(s, { to: `${m.name} (${m.phone})`, audience: 'Crew', text: `${title}. ${body}` }, now)
  return s
}

function blankJobFields() {
  return {
    crewId: null,
    scheduledFor: null,
    startedAt: null,
    beforePhoto: null,
    afterPhoto: null,
    notes: '',
  }
}

// ---------- residents ----------
export function nearestAsset(s, point, maxKm = 0.4) {
  let best = null
  for (const a of s.assets) {
    const d = distanceKm(point, a)
    if (d <= maxKm && (!best || d < best.d)) best = { asset: a, d }
  }
  return best?.asset ?? null
}

export function findDuplicate(s, { lat, lng, assetId }) {
  const open = s.incidents.filter((i) => i.status !== 'Resolved')
  if (assetId) return open.find((i) => i.assetId === assetId) ?? null
  if (lat != null) return open.find((i) => distanceKm({ lat, lng }, i) <= 0.2) ?? null
  return null
}

export function submitReport(s, p, { now }) {
  const area = AREAS.find((a) => a.name === p.area) ?? AREAS[0]
  const point = p.lat != null ? { lat: p.lat, lng: p.lng } : null
  const asset = p.assetId ? s.assets.find((a) => a.id === p.assetId) : point ? nearestAsset(s, point) : null
  const lat = point?.lat ?? asset?.lat ?? area.lat
  const lng = point?.lng ?? asset?.lng ?? area.lng

  const report = {
    id: p.reportId,
    incidentId: p.attachTo ?? p.incidentId,
    type: p.type,
    area: p.area,
    address: p.address?.trim() || '',
    lat,
    lng,
    assetId: asset?.id ?? null,
    photo: p.photo ?? null,
    description: p.description?.trim() || '',
    name: p.name?.trim() || '',
    phone: p.phone?.trim() || null,
    consent: !!p.consent,
    createdAt: iso(now),
    rating: null,
  }
  s = { ...s, reports: [report, ...s.reports] }

  if (p.attachTo) {
    const inc = s.incidents.find((i) => i.id === p.attachTo)
    const count = inc.reportIds.length + 1
    s = {
      ...s,
      incidents: updateIn(s.incidents, inc.id, (i) => ({
        reportIds: [...i.reportIds, report.id],
        timeline: [...i.timeline, { at: iso(now), text: `Another resident reported this (${count} reports)` }],
      })),
    }
    s = notify(s, { roles: ADMIN, title: `${count} residents now reporting ${inc.id}`, body: inc.title, link: `/admin/incidents/${inc.id}` }, now)
  } else {
    const impact = asset?.criticality ?? 3
    const priority = makePriority(RESIDENT_LIKELIHOOD[p.type] ?? 60, impact)
    const place = report.address || asset?.landmark || p.area
    const incident = {
      id: p.incidentId,
      source: 'resident',
      type: p.type,
      title: `${p.type} at ${place}`,
      description: report.description,
      assetId: asset?.id ?? null,
      sensorId: null,
      area: p.area,
      lat,
      lng,
      status: 'Unattended',
      kind: 'Reactive',
      priority,
      prediction: null,
      reportIds: [report.id],
      ...blankJobFields(),
      reportedAt: iso(now),
      assignedAt: null,
      resolvedAt: null,
      dueAt: dueAt(priority.level, s.settings, now),
      resolutionNote: null,
      escalated: false,
      timeline: [{ at: iso(now), text: `Reported by resident${report.name ? ` (${report.name})` : ''}` }],
      comments: [],
    }
    s = { ...s, incidents: [incident, ...s.incidents] }
    s = notify(s, { roles: ADMIN, title: `New resident report: ${p.type}`, body: `${place}, ${p.area}.`, link: `/admin/incidents/${incident.id}`, severity: priority.level === 'High' ? 'high' : 'info' }, now)
  }

  if (report.phone && report.consent) {
    s = sms(s, { to: `${report.name || 'Resident'} (${report.phone})`, audience: 'Resident', text: `City of Tshwane: we received your report ${report.id}. Track it on our website.` }, now)
  }
  return s
}

export function rateReport(s, { reportId, stars, comment }) {
  return { ...s, reports: updateIn(s.reports, reportId, { rating: { stars, comment } }) }
}

// ---------- problems (formerly incidents + work orders) ----------
export function assignIncident(s, { incidentId, crewId, scheduledFor }, { now, user }) {
  const inc = s.incidents.find((i) => i.id === incidentId)
  s = {
    ...s,
    incidents: updateIn(s.incidents, incidentId, (i) => ({
      status: 'Pending',
      crewId,
      scheduledFor: iso(scheduledFor),
      assignedAt: iso(now),
      startedAt: null,
      beforePhoto: null,
      afterPhoto: null,
      notes: '',
      timeline: [...i.timeline, { at: iso(now), text: `Crew sent: ${crewName(s, crewId)} by ${user.name}` }],
    })),
  }
  s = notifyCrew(s, crewId, 'New job', inc.title, `/admin/jobs/${incidentId}`, now)
  s = smsResidents(s, inc, (r) => `City of Tshwane: a crew has been assigned to your report ${r.id}.`, now)
  return audit(s, user, `Sent ${crewName(s, crewId)} to ${incidentId}`, now)
}

export function addComment(s, { incidentId, text }, { now, user }) {
  return {
    ...s,
    incidents: updateIn(s.incidents, incidentId, (i) => ({ comments: [...i.comments, { at: iso(now), user: user.name, text }] })),
  }
}

export function closeIncident(s, { incidentId, reason }, { now, user }) {
  const analysis = analyzeNetwork(s, now)
  const inc = s.incidents.find((i) => i.id === incidentId)
  const priority = incidentPriority(inc, s, analysis)
  const note = reason?.trim() || 'Closed. No repair needed.'
  s = {
    ...s,
    incidents: updateIn(s.incidents, incidentId, (i) => ({
      status: 'Resolved',
      resolvedAt: iso(now),
      resolutionNote: note,
      priority,
      timeline: [...i.timeline, { at: iso(now), text: `Closed by ${user.name}: ${note}` }],
    })),
  }
  s = smsResidents(s, inc, (r) => `City of Tshwane: your report ${r.id} has been closed. ${note}`, now)
  return audit(s, user, `Closed ${incidentId} without a repair`, now)
}

/** Admin sends a crew to fix a broken sensor — creates a Sensor repair problem. */
export function createSensorRepair(s, { incidentId, assetId, sensorId, title, crewId, scheduledFor }, { now, user }) {
  const asset = s.assets.find((a) => a.id === assetId)
  const incident = {
    id: incidentId,
    source: 'sensor',
    type: 'Sensor repair',
    title,
    description: title,
    assetId,
    sensorId,
    area: asset.area,
    lat: asset.lat,
    lng: asset.lng,
    status: 'Pending',
    kind: 'Sensor repair',
    priority: makePriority(40, asset.criticality),
    prediction: null,
    reportIds: [],
    crewId,
    scheduledFor: iso(scheduledFor),
    startedAt: null,
    beforePhoto: null,
    afterPhoto: null,
    notes: '',
    reportedAt: iso(now),
    assignedAt: iso(now),
    resolvedAt: null,
    dueAt: dueAt('Medium', s.settings, now),
    resolutionNote: null,
    escalated: false,
    timeline: [
      { at: iso(now), text: `Sensor repair created by ${user.name}` },
      { at: iso(now), text: `Crew sent: ${crewName(s, crewId)} by ${user.name}` },
    ],
    comments: [],
  }
  s = { ...s, incidents: [incident, ...s.incidents] }
  s = notifyCrew(s, crewId, 'New job', title, `/admin/jobs/${incidentId}`, now)
  return audit(s, user, `Sent crew to fix sensor ${sensorId}`, now)
}

export function startJob(s, { incidentId, beforePhoto }, { now, user }) {
  s = {
    ...s,
    incidents: updateIn(s.incidents, incidentId, (i) => ({
      startedAt: iso(now),
      beforePhoto: beforePhoto ?? null,
      timeline: [...i.timeline, { at: iso(now), text: `${user.name} started work on site` }],
    })),
  }
  return audit(s, user, `Started job ${incidentId}`, now)
}

export function completeJob(s, { incidentId, afterPhoto, notes }, { now, user }) {
  const inc = s.incidents.find((i) => i.id === incidentId)
  const note = notes?.trim() || 'Repair completed.'
  s = {
    ...s,
    incidents: updateIn(s.incidents, incidentId, {
      afterPhoto: afterPhoto ?? null,
      notes: note,
    }),
  }

  // The repair fixes the problem and the sensors go back to normal.
  if (inc.kind !== 'Sensor repair' && inc.assetId) s = { ...s, assets: updateIn(s.assets, inc.assetId, { scenario: null }) }
  if (inc.sensorId) s = { ...s, sensors: updateIn(s.sensors, inc.sensorId, { fault: null, battery: 100 }) }

  const analysis = analyzeNetwork(s, now)
  const priority = incidentPriority(inc, s, analysis) ?? inc.priority
  s = {
    ...s,
    incidents: updateIn(s.incidents, incidentId, (i) => ({
      status: 'Resolved',
      resolvedAt: iso(now),
      resolutionNote: note,
      priority: { ...i.priority, ...priority, score: i.priority.score, level: i.priority.level },
      timeline: [...i.timeline, { at: iso(now), text: `Fixed by ${user.name}: ${note}` }],
    })),
  }
  s = smsResidents(s, inc, (r) => `City of Tshwane: the problem you reported (${r.id}) has been fixed. Thank you for reporting.`, now)
  s = notify(s, { roles: ADMIN, title: `Job fixed: ${inc.title}`, body: note, link: `/admin/incidents/${incidentId}` }, now)
  return audit(s, user, `Fixed ${incidentId}`, now)
}

// ---------- settings, users, crews ----------
export function updateSettings(s, patch, { now, user }) {
  const settings = { ...s.settings }
  for (const [k, v] of Object.entries(patch)) settings[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...settings[k], ...v } : v
  return audit({ ...s, settings }, user, 'Updated settings', now)
}

export function saveUser(s, u, { now, user }) {
  const exists = s.users.some((x) => x.id === u.id)
  const users = exists ? updateIn(s.users, u.id, u) : [...s.users, { ...u, id: nextId(s.users, 'U', 0), active: true }]
  return audit({ ...s, users }, user, `${exists ? 'Updated' : 'Added'} user ${u.name}`, now)
}

export function saveCrew(s, c, { now, user }) {
  const exists = s.crews.some((x) => x.id === c.id)
  const crews = exists ? updateIn(s.crews, c.id, c) : [...s.crews, { ...c, id: `C-${Date.now().toString(36).slice(-4).toUpperCase()}`, active: true }]
  return audit({ ...s, crews }, user, `${exists ? 'Updated' : 'Added'} crew ${c.name}`, now)
}

export function updateProfile(s, { name, phone }, { now, user }) {
  return audit({ ...s, users: updateIn(s.users, user.id, { name, phone }) }, user, 'Updated own profile', now)
}

export function changePassword(s, { password }, { now, user }) {
  return audit({ ...s, users: updateIn(s.users, user.id, { password }) }, user, 'Changed own password', now)
}

export function markAllRead(s, _p, { user }) {
  return {
    ...s,
    notifications: s.notifications.map((n) => (n.readBy.includes(user.id) ? n : { ...n, readBy: [...n.readBy, user.id] })),
  }
}

// ---------- simulation (demo tools) ----------
export function startScenario(s, { assetId, kind, days, durationMs, rate }, { now, user }) {
  const asset = s.assets.find((a) => a.id === assetId)
  s = { ...s, assets: updateIn(s.assets, assetId, { scenario: { kind, rate, startedAt: now, sim: { startedAt: now, durationMs, days } } }) }
  s = notify(
    s,
    {
      roles: ADMIN,
      title: `Simulation started: ${assetId}`,
      body: `${asset?.landmark ?? assetId}. Monitoring for a predicted ${kind.replace('_', ' ')}.`,
      link: `/admin/sensors/${s.sensors.find((sensor) => sensor.assetId === assetId)?.id ?? ''}`,
      severity: 'info',
    },
    now,
  )
  return audit(s, user, `Simulation: started ${kind} at ${assetId}`, now)
}

export function stopScenario(s, { assetId }, { now, user }) {
  return audit({ ...s, assets: updateIn(s.assets, assetId, { scenario: null }) }, user, `Simulation: cleared ${assetId}`, now)
}

export function injectFault(s, { sensorId, kind }, { now, user }) {
  // Offline skips ahead past the missed-heartbeat limit so it shows straight away.
  const limit = s.settings.heartbeatMinutes * s.settings.missedBeats * MINUTE
  const since = kind === 'offline' ? now - limit - MINUTE : kind === 'frozen' ? now - 3 * HOUR : now - MINUTE
  if (kind === 'low_battery') return audit({ ...s, sensors: updateIn(s.sensors, sensorId, { battery: 9 }) }, user, `Simulation: low battery on ${sensorId}`, now)
  return audit({ ...s, sensors: updateIn(s.sensors, sensorId, { fault: { kind, since } }) }, user, `Simulation: ${kind} fault on ${sensorId}`, now)
}

export function clearFault(s, { sensorId }, { now, user }) {
  return audit({ ...s, sensors: updateIn(s.sensors, sensorId, { fault: null, battery: 100 }) }, user, `Simulation: fixed ${sensorId}`, now)
}

export function setRain(s, { on }, { now, user }) {
  s = { ...s, settings: { ...s.settings, rainForecast: on } }
  if (on) s = notify(s, { roles: ADMIN, title: 'Heavy rain forecast', body: 'Manholes that are already filling up have moved up the priority list.', link: '/admin', severity: 'high' }, now)
  return audit(s, user, `Rain forecast ${on ? 'on' : 'off'}`, now)
}

export function resetDemo(_s, _p, { now }) {
  return createSeedState(now)
}

export { DAY }

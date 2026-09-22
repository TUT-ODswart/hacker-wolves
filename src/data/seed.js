import { DAY, HOUR, MINUTE } from '../utils/format.js'
import { analyzeNetwork } from './model.js'
import { engineTick } from './engine.js'
import { dueAt, iso, makePriority } from './helpers.js'

export const STATE_VERSION = 7

export const AREAS = [
  { name: 'Soshanguve', lat: -25.525, lng: 28.1 },
  { name: 'Mabopane', lat: -25.497, lng: 28.083 },
  { name: 'Ga-Rankuwa', lat: -25.617, lng: 28.0 },
  { name: 'Winterveld', lat: -25.415, lng: 27.99 },
]

// [landmark, criticality 1-5, why it matters]
const LANDMARKS = {
  Soshanguve: [
    ['Block L, near the tuck shop', 3, 'Busy residential street'],
    ['Block H, Mahlangu Street', 2, 'Quiet residential street'],
    ['Block X taxi rank', 4, 'Busy taxi rank'],
    ['Opposite Block F clinic', 5, 'Next to a clinic'],
    ['Block F park', 4, 'Park where children play'],
  ],
  Mabopane: [
    ['Unit C main line', 2, 'Residential street'],
    ['Block B, opposite the clinic', 5, 'Next to a clinic'],
    ['Block E, near the primary school', 5, 'Near a primary school'],
    ['Unit U feeder line', 2, 'Residential street'],
    ['Mabopane station', 4, 'Busy station and taxi rank'],
  ],
  'Ga-Rankuwa': [
    ['Zone 16 taxi rank', 4, 'Busy taxi rank'],
    ['Zone 5, next to the church', 3, 'Church and busy street'],
    ['Zone 1 shopping centre', 4, 'Busy shopping area'],
    ['Zone 9, near the high school', 5, 'Near a high school'],
    ['Zone 2 community hall', 3, 'Community hall'],
  ],
  Winterveld: [
    ['Winterveld community hall', 3, 'Community hall'],
    ['Stand 1022, main road', 3, 'Main road'],
    ['Clinic road', 5, 'Near a clinic'],
    ['Winterveld market', 4, 'Busy market'],
    ['Sports ground', 2, 'Open sports ground'],
  ],
}

const DEPTHS = [160, 180, 150, 200, 170]

export const DEFAULT_SETTINGS = {
  orgName: 'City of Tshwane',
  heartbeatMinutes: 15,
  missedBeats: 3,
  thresholds: { levelWarnPct: 60, levelAlertPct: 80, flowDropPct: 30, pressureMin: 3 },
  sla: { High: 24, Medium: 72, Low: 168 },
  escalationMinutes: 30,
  notify: { smsResidents: true, smsCrews: true, emailManagers: true },
  rainForecast: false,
}

const USERS = [
  { id: 'U-1', name: 'Naledi Mokoena', email: 'admin@gmail.com', password: 'admin123', role: 'admin', phone: '071 555 0101', crewId: null },
  { id: 'U-4', name: 'Sipho Nkosi', email: 'tech@gmail.com', password: 'tech123', role: 'technician', phone: '074 555 0104', crewId: 'C-B' },
  { id: 'U-5', name: 'Thabo Mahlangu', email: 'thabo@gmail.com', password: 'tech123', role: 'technician', phone: '074 555 0105', crewId: 'C-A' },
  { id: 'U-6', name: 'Lerato Molefe', email: 'lerato@gmail.com', password: 'tech123', role: 'technician', phone: '074 555 0106', crewId: 'C-B' },
  { id: 'U-7', name: 'Kagiso Sithole', email: 'kagiso@gmail.com', password: 'tech123', role: 'technician', phone: '074 555 0107', crewId: 'C-B' },
  { id: 'U-8', name: 'Pieter Botha', email: 'pieter@gmail.com', password: 'tech123', role: 'technician', phone: '074 555 0108', crewId: 'C-C' },
  { id: 'U-9', name: 'Mpho Ndlovu', email: 'mpho@gmail.com', password: 'tech123', role: 'technician', phone: '074 555 0109', crewId: 'C-D' },
].map((u) => ({ ...u, active: true }))

const CREWS = [
  { id: 'C-A', name: 'Crew A', area: 'Soshanguve', active: true },
  { id: 'C-B', name: 'Crew B', area: 'Mabopane', active: true },
  { id: 'C-C', name: 'Crew C', area: 'Ga-Rankuwa', active: true },
  { id: 'C-D', name: 'Crew D', area: 'Winterveld', active: true },
]

function buildNetwork() {
  const assets = []
  const sensors = []
  let n = 1
  const addSensor = (assetId, type, battery) =>
    sensors.push({ id: `S-${String(n++).padStart(3, '0')}`, assetId, type, battery, installedYear: 2025, fault: null })

  AREAS.forEach((area, ai) => {
    const a = ai + 1
    for (let i = 1; i <= 6; i++) {
      const pump = i === 6
      const id = pump ? `PS-${a}` : `MH-${a}0${i}`
      const [landmark, criticality, note] = pump ? [`${area.name} pump station`, 5, 'Serves about 6,000 households'] : LANDMARKS[area.name][i - 1]
      assets.push({
        id,
        type: pump ? 'pump_station' : 'manhole',
        name: pump ? `${area.name} pump station` : `Manhole ${id}`,
        landmark,
        area: area.name,
        lat: +(area.lat + (i - 3.5) * 0.0042 + (i % 2) * 0.0011).toFixed(5),
        lng: +(area.lng + (i - 3.5) * 0.0052).toFixed(5),
        depthCm: pump ? 300 : DEPTHS[i - 1],
        baseFlowLps: pump ? null : 4 + 2 * i,
        installedYear: 1982 + ((ai * 7 + i * 5) % 32),
        criticality,
        criticalityNote: note,
        downstreamId: pump ? null : i === 5 ? `PS-${a}` : `MH-${a}0${i + 1}`,
        scenario: null,
      })
      const battery = 55 + ((ai * 13 + i * 17) % 45)
      if (pump) {
        addSensor(id, 'pressure', battery)
        addSensor(id, 'level', battery - 5)
      } else {
        addSensor(id, 'level', battery)
        if (i % 2 === 1) addSensor(id, 'flow', battery - 3)
      }
    }
  })
  return { assets, sensors }
}

function seeded(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Six months of completed repairs so Home can show "fixed before overflowing".
function buildHistory(now, assets) {
  const rand = seeded(7)
  const manholes = assets.filter((a) => a.type === 'manhole')
  const incidents = []
  const counts = [9, 9, 10, 9, 10, 8]
  const proactiveShare = [0.2, 0.3, 0.4, 0.5, 0.6, 0.72]
  const responseHrs = [16, 13, 10, 7, 5, 3]
  const reactiveTypes = ['Overflowing manhole', 'Sewage on the street', 'Blocked drain']
  let inc = 1001

  counts.forEach((count, m) => {
    const monthsAgo = 6 - m
    for (let k = 0; k < count; k++) {
      const asset = rand() < 0.35 ? manholes[Math.floor(rand() * 5)] : manholes[Math.floor(rand() * manholes.length)]
      const proactive = rand() < proactiveShare[m]
      const resident = !proactive && rand() < 0.6
      const reported = now - monthsAgo * 30 * DAY + (k / count) * 27 * DAY + rand() * DAY
      const assigned = reported + responseHrs[m] * (0.5 + rand()) * HOUR
      const resolved = assigned + (proactive ? 3 + rand() * 8 : 6 + rand() * 20) * HOUR
      const type = proactive ? (rand() < 0.75 ? 'Blockage' : 'Pipe leak') : resident ? reactiveTypes[Math.floor(rand() * 3)] : 'Overflowing manhole'
      const crewId = ['C-A', 'C-B', 'C-C', 'C-D'][AREAS.findIndex((x) => x.name === asset.area)]
      const incId = `INC-${inc++}`
      const note = proactive ? 'Cleared build-up before it overflowed.' : 'Cleared blockage, cleaned and disinfected the area.'

      incidents.push({
        id: incId,
        source: resident ? 'resident' : 'sensor',
        type,
        title: `${type} at ${asset.landmark}`,
        description: proactive ? 'Detected early from sensor trends.' : 'Sewage reached the surface.',
        assetId: asset.id,
        sensorId: null,
        area: asset.area,
        lat: asset.lat,
        lng: asset.lng,
        status: 'Resolved',
        kind: proactive ? 'Proactive' : 'Reactive',
        priority: makePriority(proactive ? 60 : 95, asset.criticality),
        prediction: null,
        reportIds: [],
        crewId,
        scheduledFor: iso(assigned),
        startedAt: iso(assigned + HOUR),
        beforePhoto: null,
        afterPhoto: null,
        notes: note,
        reportedAt: iso(reported),
        assignedAt: iso(assigned),
        resolvedAt: iso(resolved),
        dueAt: iso(reported + 72 * HOUR),
        resolutionNote: note,
        escalated: false,
        timeline: [
          { at: iso(reported), text: resident ? 'Reported by a resident' : proactive ? 'Detected by sensors before any overflow' : 'Detected by sensors' },
          { at: iso(assigned), text: `Crew sent: ${crewId.replace('C-', 'Crew ')}` },
          { at: iso(resolved), text: `Fixed: ${note}` },
        ],
        comments: [],
      })
    }
  })
  return { incidents, nextInc: inc }
}

export function createSeedState(now) {
  const { assets, sensors } = buildNetwork()
  const asset = (id) => assets.find((a) => a.id === id)
  const sensorOf = (assetId, type) => sensors.find((s) => s.assetId === assetId && s.type === type)

  // Problems already developing in the network
  asset('MH-202').scenario = { kind: 'blockage', rate: 1.5, startedAt: now - 16 * DAY, sim: null }
  asset('MH-103').scenario = { kind: 'blockage', rate: 1.3, startedAt: now - 11 * DAY, sim: null }
  asset('MH-305').scenario = { kind: 'leak', rate: 1, startedAt: now - 10 * DAY, sim: null }
  asset('PS-4').scenario = { kind: 'pressure_drop', rate: 1, startedAt: now - 6 * DAY, sim: null }

  // Sensor faults
  sensorOf('MH-105', 'level').fault = { kind: 'frozen', since: now - 3 * DAY }
  sensorOf('MH-402', 'level').fault = { kind: 'offline', since: now - 5 * HOUR }
  sensorOf('MH-204', 'level').fault = { kind: 'impossible', since: now - DAY }
  sensorOf('MH-301', 'flow').fault = { kind: 'no_signal', since: now - 8 * HOUR }
  sensorOf('MH-401', 'level').battery = 12

  const history = buildHistory(now, assets)

  const reports = [
    { id: 'RPT-2001', incidentId: 'INC-1103', type: 'Sewage on the street', area: 'Soshanguve', address: 'Block F, next to the park', name: 'Thabo M.', phone: '072 *** 4418', ago: 2.2 * HOUR, desc: 'Sewage coming out of the manhole and running into the street. Kids play in this park.' },
    { id: 'RPT-2002', incidentId: 'INC-1103', type: 'Overflowing manhole', area: 'Soshanguve', address: 'Block F park', name: '', phone: '', ago: 1.6 * HOUR, desc: 'Manhole overflowing.' },
    { id: 'RPT-2003', incidentId: 'INC-1103', type: 'Sewage on the street', area: 'Soshanguve', address: 'Corner of the park, Block F', name: 'Nomsa D.', phone: '083 *** 2290', ago: 40 * MINUTE, desc: 'Still running. The smell is very bad.' },
    { id: 'RPT-2004', incidentId: 'INC-1106', type: 'Bad smell', area: 'Winterveld', address: 'Winterveld market', name: 'Anonymous', phone: '', ago: 20 * HOUR, desc: 'Bad smell near the market stalls for three days.' },
  ].map((r) => {
    const a = r.incidentId === 'INC-1103' ? asset('MH-105') : asset('MH-404')
    return {
      id: r.id,
      incidentId: r.incidentId,
      type: r.type,
      area: r.area,
      address: r.address,
      lat: a.lat + 0.0003,
      lng: a.lng - 0.0002,
      assetId: a.id,
      photo: null,
      description: r.desc,
      name: r.name,
      phone: r.phone || null,
      consent: !!r.phone,
      createdAt: iso(now - r.ago),
      rating: null,
    }
  })

  const settings = structuredClone(DEFAULT_SETTINGS)
  const base = { version: STATE_VERSION, settings, assets, sensors, users: structuredClone(USERS), crews: structuredClone(CREWS) }
  const analysis = analyzeNetwork({ ...base }, now)
  const snap = (assetId, fallback) => makePriority(analysis.assets[assetId]?.problem ? analysis.assets[assetId].likelihood : fallback, asset(assetId).criticality)
  const problemOf = (assetId) => analysis.assets[assetId].problem

  const sensorIncident = (id, assetId, type, status, agoH, extra = {}) => {
    const a = asset(assetId)
    const p = problemOf(assetId)
    const reported = now - agoH * HOUR
    const priority = snap(assetId, 60)
    return {
      id,
      source: 'sensor',
      type,
      title: `${type} at ${a.landmark}`,
      description: p ? `${p.label}. ${p.where}. ${p.summary}.` : 'Detected by sensors.',
      assetId,
      sensorId: null,
      area: a.area,
      lat: a.lat,
      lng: a.lng,
      status,
      kind: 'Proactive',
      priority,
      prediction: p ? { daysToFailure: p.daysToFailure, confidence: p.confidence, evidence: p.evidence } : null,
      reportIds: [],
      crewId: null,
      scheduledFor: null,
      startedAt: null,
      beforePhoto: null,
      afterPhoto: null,
      notes: '',
      reportedAt: iso(reported),
      assignedAt: null,
      resolvedAt: null,
      dueAt: dueAt(priority.level, settings, reported),
      resolutionNote: null,
      escalated: false,
      timeline: [{ at: iso(reported), text: `Detected automatically by sensors on ${assetId}` }],
      comments: [],
      ...extra,
    }
  }

  const tomorrow = new Date(now + DAY)
  tomorrow.setHours(8, 0, 0, 0)
  const today9 = new Date(now)
  today9.setHours(9, 0, 0, 0)

  const open = [
    sensorIncident('INC-1101', 'MH-202', 'Blockage', 'Pending', 26, {
      crewId: 'C-B',
      assignedAt: iso(now - 24 * HOUR),
      scheduledFor: iso(today9.getTime()),
      startedAt: iso(now - 2 * HOUR),
    }),
    sensorIncident('INC-1102', 'MH-103', 'Blockage', 'Unattended', 3),
    sensorIncident('INC-1104', 'MH-305', 'Pipe leak', 'Unattended', 7),
    sensorIncident('INC-1105', 'PS-4', 'Rising main leak', 'Pending', 20, {
      crewId: 'C-D',
      assignedAt: iso(now - 18 * HOUR),
      scheduledFor: iso(tomorrow.getTime()),
    }),
  ]
  open[0].timeline.push({ at: iso(now - 24 * HOUR), text: 'Crew sent: Crew B by Naledi Mokoena' })
  open[0].timeline.push({ at: iso(now - 2 * HOUR), text: 'Lerato Molefe started work on site' })
  open[3].timeline.push({ at: iso(now - 18 * HOUR), text: 'Crew sent: Crew D by Naledi Mokoena' })
  open[0].comments.push({ at: iso(now - 23 * HOUR), user: 'Naledi Mokoena', text: 'Clinic is open until 18:00. Please work outside clinic hours if possible.' })
  const mh105 = asset('MH-105')
  const residentPriority = makePriority(100, mh105.criticality)
  open.push({
    id: 'INC-1103',
    source: 'resident',
    type: 'Sewage on the street',
    title: `Sewage on the street at ${mh105.landmark}`,
    description: 'Sewage coming out of the manhole and running into the street. Note: the level sensor at MH-105 has been stuck for 3 days and did not catch this.',
    assetId: 'MH-105',
    sensorId: null,
    area: 'Soshanguve',
    lat: mh105.lat,
    lng: mh105.lng,
    status: 'Unattended',
    kind: 'Reactive',
    priority: residentPriority,
    prediction: null,
    reportIds: ['RPT-2001', 'RPT-2002', 'RPT-2003'],
    crewId: null,
    scheduledFor: null,
    startedAt: null,
    beforePhoto: null,
    afterPhoto: null,
    notes: '',
    reportedAt: reports[0].createdAt,
    assignedAt: null,
    resolvedAt: null,
    dueAt: dueAt(residentPriority.level, settings, now - 2.2 * HOUR),
    resolutionNote: null,
    escalated: false,
    timeline: [
      { at: reports[0].createdAt, text: 'Reported by resident (Thabo M.)' },
      { at: reports[1].createdAt, text: 'Another resident reported this (2 reports)' },
      { at: reports[2].createdAt, text: 'Another resident reported this (3 reports)' },
    ],
    comments: [],
  })

  const mh404 = asset('MH-404')
  const smellPriority = makePriority(55, mh404.criticality)
  open.push({
    id: 'INC-1106',
    source: 'resident',
    type: 'Bad smell',
    title: `Bad smell at ${mh404.landmark}`,
    description: 'Bad smell near the market stalls for three days.',
    assetId: 'MH-404',
    sensorId: null,
    area: 'Winterveld',
    lat: mh404.lat,
    lng: mh404.lng,
    status: 'Pending',
    kind: 'Reactive',
    priority: smellPriority,
    prediction: null,
    reportIds: ['RPT-2004'],
    crewId: 'C-D',
    scheduledFor: iso(today9.getTime()),
    startedAt: null,
    beforePhoto: null,
    afterPhoto: null,
    notes: '',
    reportedAt: reports[3].createdAt,
    assignedAt: iso(now - 16 * HOUR),
    resolvedAt: null,
    dueAt: dueAt(smellPriority.level, settings, now - 20 * HOUR),
    resolutionNote: null,
    escalated: false,
    timeline: [
      { at: reports[3].createdAt, text: 'Reported by resident' },
      { at: iso(now - 16 * HOUR), text: 'Crew sent: Crew D by Naledi Mokoena' },
    ],
    comments: [],
  })

  const seeded = {
    ...base,
    incidents: [...open, ...history.incidents],
    reports,
    notifications: [],
    sms: reports
      .filter((r) => r.phone)
      .map((r, i) => ({ id: `M-seed-${i}`, at: r.createdAt, to: `${r.name} (${r.phone})`, audience: 'Resident', text: `City of Tshwane: we received your report ${r.id}. Track it on our website.` })),
    audit: [{ id: 'A-seed', at: iso(now - 24 * HOUR), user: 'Naledi Mokoena', action: 'Sent Crew B to INC-1101' }],
    knownFaults: [],
    knownLowBattery: [],
    alertLevels: {},
  }
  // Run the engine once so the starting alerts are already in the bell, instead of all popping up at login.
  return engineTick(seeded, now - MINUTE)
}

// All demo data lives here. Numbers are made up but realistic.

export const AREAS = [
  { name: 'Soshanguve', lat: -25.525, lng: 28.1 },
  { name: 'Mabopane', lat: -25.497, lng: 28.083 },
  { name: 'Ga-Rankuwa', lat: -25.617, lng: 28.0 },
  { name: 'Winterveld', lat: -25.415, lng: 27.99 },
]

export const CREWS = ['Crew A', 'Crew B', 'Crew C', 'Crew D']

export const REPORT_TYPES = [
  'Overflowing manhole',
  'Leaking pipe',
  'Sewage on the street',
  'Blocked drain',
  'Bad smell',
  'Other',
]

export const SENSOR_TYPES = {
  level: {
    label: 'Water level',
    unit: 'cm',
    threshold: 120,
    explanation: 'Water rising in a manhole means a blockage downstream. If it keeps rising, the manhole overflows.',
  },
  flow: {
    label: 'Flow loss',
    unit: '%',
    threshold: 10,
    explanation: 'Less sewage arriving at the second flow meter than left the first means it is leaking out of the pipe.',
  },
  pressure: {
    label: 'Pipe pressure',
    unit: 'bar',
    threshold: 3,
    below: true,
    explanation: 'Pressure dropping in a pumped pipe means it is leaking or has burst.',
  },
  pump: {
    label: 'Pump current',
    unit: 'A',
    threshold: 45,
    explanation: 'A pump drawing more power than usual is straining, usually because of a blockage or wear.',
  },
}

// Small seeded random generator so the sensor list is the same every time.
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

function makeSensors() {
  const rand = seeded(42)
  const types = Object.keys(SENSOR_TYPES)
  const list = []

  for (let n = 1; n <= 300; n++) {
    const area = AREAS[Math.floor(rand() * AREAS.length)].name
    const type = types[Math.floor(rand() * types.length)]
    const r = rand()
    let status = 'Online'
    if (r > 0.97) status = 'Offline'
    else if (r > 0.93) status = 'Alert'
    else if (r > 0.87) status = 'Warning'

    const battery = status === 'Offline' ? Math.floor(rand() * 12) : 20 + Math.floor(rand() * 81)
    const lastReadingMin = status === 'Offline' ? 360 + Math.floor(rand() * 1200) : 1 + Math.floor(rand() * 15)

    list.push({ id: `S-${String(n).padStart(3, '0')}`, area, type, status, battery, lastReadingMin })
  }

  // Match the first four rows of the design.
  Object.assign(list[0], { area: 'Soshanguve', status: 'Online', battery: 95, lastReadingMin: 8 })
  Object.assign(list[1], { area: 'Mabopane', type: 'flow', status: 'Warning', battery: 60, lastReadingMin: 7 })
  Object.assign(list[2], { area: 'Ga-Rankuwa', type: 'level', status: 'Alert', battery: 45, lastReadingMin: 5 })
  Object.assign(list[3], { area: 'Soshanguve', status: 'Online', battery: 82, lastReadingMin: 2 })

  return list
}

export const SENSORS = makeSensors()

function areaCoords(name) {
  const a = AREAS.find((x) => x.name === name) ?? AREAS[0]
  return { lat: a.lat, lng: a.lng }
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString()
}

// Builds one incident with a realistic timeline.
function incident({ id, source, sensorId, reading, reporter, type, area, address, severity, status, reported, assignedAfter, crew, resolvedAfter, note, description }) {
  const timeline = [
    {
      at: hoursAgo(reported),
      text: source === 'sensor' ? `Detected automatically by sensor ${sensorId}` : `Reported by resident${reporter?.name ? ` (${reporter.name})` : ''}`,
    },
  ]
  if (crew) timeline.push({ at: hoursAgo(reported - assignedAfter), text: `Assigned to ${crew}` })
  if (status === 'Resolved') timeline.push({ at: hoursAgo(reported - resolvedAfter), text: `Resolved: ${note}` })

  return {
    id,
    source,
    sensorId: sensorId ?? null,
    reading: reading ?? null,
    reporter: reporter ?? null,
    type,
    area,
    address,
    ...areaCoords(area),
    severity,
    status,
    reportedAt: hoursAgo(reported),
    assignedCrew: crew ?? null,
    resolvedAt: status === 'Resolved' ? hoursAgo(reported - resolvedAfter) : null,
    resolutionNote: status === 'Resolved' ? note : null,
    description,
    photo: null,
    timeline,
  }
}

export function seedIncidents() {
  return [
    // Unattended
    incident({ id: 'INC-1015', source: 'sensor', sensorId: 'S-003', reading: { type: 'level', value: 134 }, type: 'Overflowing manhole', area: 'Ga-Rankuwa', address: 'Manhole next to Zone 16 taxi rank', severity: 'High', status: 'Unattended', reported: 0.6, description: 'Water level rose 40 cm in 3 hours after rain. Likely blockage downstream.' }),
    incident({ id: 'INC-1014', source: 'citizen', reporter: { name: 'Thabo M.', phone: '072 *** 4418' }, type: 'Sewage on the street', area: 'Soshanguve', address: 'Block L, corner by the tuck shop', severity: 'High', status: 'Unattended', reported: 2, description: 'Sewage running down the street since this morning. Kids walk past here to school.' }),
    incident({ id: 'INC-1013', source: 'sensor', sensorId: 'S-002', reading: { type: 'flow', value: 13 }, type: 'Leaking pipe', area: 'Mabopane', address: 'Main line, Unit C', severity: 'Medium', status: 'Unattended', reported: 5, description: 'Flow loss between the two meters on this section has been climbing for 9 days.' }),

    // Pending
    incident({ id: 'INC-1012', source: 'citizen', reporter: { name: 'Anonymous' }, type: 'Blocked drain', area: 'Winterveld', address: 'Near Winterveld community hall', severity: 'Medium', status: 'Pending', reported: 9, assignedAfter: 1, crew: 'Crew D', description: 'Drain full and backing up. Bad smell getting worse.' }),
    incident({ id: 'INC-1011', source: 'sensor', sensorId: 'S-118', reading: { type: 'pressure', value: 2.4 }, type: 'Leaking pipe', area: 'Soshanguve', address: 'Rising main from Block X pump station', severity: 'High', status: 'Pending', reported: 20, assignedAfter: 0.5, crew: 'Crew A', description: 'Pressure dropped from 4.2 to 2.4 bar over two days. Possible burst.' }),
    incident({ id: 'INC-1010', source: 'citizen', reporter: { name: 'Lerato K.', phone: '083 *** 2290' }, type: 'Overflowing manhole', area: 'Mabopane', address: 'Block B, opposite the clinic', severity: 'High', status: 'Pending', reported: 30, assignedAfter: 2, crew: 'Crew B', description: 'Manhole overflowing onto the road outside the clinic.' }),
    incident({ id: 'INC-1009', source: 'sensor', sensorId: 'S-207', reading: { type: 'pump', value: 51 }, type: 'Pump fault', area: 'Ga-Rankuwa', address: 'Ga-Rankuwa pump station 2', severity: 'Medium', status: 'Pending', reported: 44, assignedAfter: 4, crew: 'Crew C', description: 'Pump current well above normal. Possible blockage at the intake.' }),

    // Resolved
    incident({ id: 'INC-1008', source: 'sensor', sensorId: 'S-045', reading: { type: 'level', value: 126 }, type: 'Overflowing manhole', area: 'Soshanguve', address: 'Block H, Mahlangu St', severity: 'High', status: 'Resolved', reported: 70, assignedAfter: 1, crew: 'Crew A', resolvedAfter: 6, note: 'Cleared rags and fat blockage 40 m downstream.', description: 'Level rising fast. Caught before overflow.' }),
    incident({ id: 'INC-1007', source: 'citizen', reporter: { name: 'Sipho N.' }, type: 'Leaking pipe', area: 'Winterveld', address: 'Stand 1022, main road', severity: 'Medium', status: 'Resolved', reported: 96, assignedAfter: 3, crew: 'Crew D', resolvedAfter: 20, note: 'Replaced cracked joint.', description: 'Wet patch and smell along the verge.' }),
    incident({ id: 'INC-1006', source: 'sensor', sensorId: 'S-163', reading: { type: 'flow', value: 11 }, type: 'Leaking pipe', area: 'Mabopane', address: 'Unit U feeder line', severity: 'Medium', status: 'Resolved', reported: 150, assignedAfter: 5, crew: 'Crew B', resolvedAfter: 30, note: 'Sealed leaking section.', description: 'Slow flow loss detected before any surface signs.' }),
    incident({ id: 'INC-1005', source: 'citizen', reporter: { name: 'Anonymous' }, type: 'Bad smell', area: 'Soshanguve', address: 'Block F park', severity: 'Low', status: 'Resolved', reported: 200, assignedAfter: 12, crew: 'Crew A', resolvedAfter: 48, note: 'Vent pipe cover replaced.', description: 'Strong smell near the park most evenings.' }),
    incident({ id: 'INC-1004', source: 'sensor', sensorId: 'S-088', reading: { type: 'pump', value: 48 }, type: 'Pump fault', area: 'Ga-Rankuwa', address: 'Ga-Rankuwa pump station 1', severity: 'Medium', status: 'Resolved', reported: 260, assignedAfter: 2, crew: 'Crew C', resolvedAfter: 8, note: 'Worn bearing replaced before pump seized.', description: 'Pump current creeping up for two weeks.' }),
    incident({ id: 'INC-1003', source: 'citizen', reporter: { name: 'Nomsa D.' }, type: 'Overflowing manhole', area: 'Mabopane', address: 'Block E, near the primary school', severity: 'High', status: 'Resolved', reported: 330, assignedAfter: 1, crew: 'Crew B', resolvedAfter: 5, note: 'Blockage cleared, area disinfected.', description: 'Manhole overflowing near the school gate.' }),
    incident({ id: 'INC-1002', source: 'sensor', sensorId: 'S-231', reading: { type: 'pressure', value: 2.8 }, type: 'Leaking pipe', area: 'Winterveld', address: 'Rising main, Winterveld pump station', severity: 'High', status: 'Resolved', reported: 400, assignedAfter: 1, crew: 'Crew D', resolvedAfter: 16, note: 'Burst section replaced.', description: 'Pressure drop detected overnight.' }),
    incident({ id: 'INC-1001', source: 'citizen', reporter: { name: 'Anonymous' }, type: 'Blocked drain', area: 'Ga-Rankuwa', address: 'Zone 5, next to the church', severity: 'Low', status: 'Resolved', reported: 480, assignedAfter: 10, crew: 'Crew C', resolvedAfter: 30, note: 'Drain jetted and cleared.', description: 'Slow-draining, water pooling after rain.' }),
  ]
}

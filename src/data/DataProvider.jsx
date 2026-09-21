import { useEffect, useState } from 'react'
import { DataContext } from './DataContext.js'
import { AREAS, SENSORS, seedIncidents } from './seed.js'

const STORAGE_KEY = 'hw-incidents-v1'

function loadIncidents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved)) return saved
  } catch {
    // ignore and use seed data
  }
  return seedIncidents()
}

const HIGH_TYPES = ['Overflowing manhole', 'Sewage on the street']

export default function DataProvider({ children }) {
  const [incidents, setIncidents] = useState(loadIncidents)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents))
    } catch {
      // storage full or blocked; the demo still works in memory
    }
  }, [incidents])

  function update(id, change) {
    setIncidents((list) => list.map((inc) => (inc.id === id ? change(inc) : inc)))
  }

  // Resident report. No account needed.
  function addCitizenReport({ type, area, address, description, photo, lat, lng, name, phone }) {
    const maxId = incidents.reduce((max, inc) => Math.max(max, Number(inc.id.split('-')[1]) || 0), 1000)
    const now = new Date().toISOString()
    const fallback = AREAS.find((a) => a.name === area) ?? AREAS[0]

    const report = {
      id: `INC-${maxId + 1}`,
      source: 'citizen',
      sensorId: null,
      reading: null,
      reporter: { name: name?.trim() || 'Anonymous', phone: phone?.trim() || null },
      type,
      area,
      address: address?.trim() || 'Not given',
      lat: lat ?? fallback.lat,
      lng: lng ?? fallback.lng,
      severity: HIGH_TYPES.includes(type) ? 'High' : type === 'Bad smell' ? 'Low' : 'Medium',
      status: 'Unattended',
      reportedAt: now,
      assignedCrew: null,
      resolvedAt: null,
      resolutionNote: null,
      description: description?.trim() || '',
      photo: photo ?? null,
      timeline: [{ at: now, text: `Reported by resident${name?.trim() ? ` (${name.trim()})` : ''}` }],
    }

    setIncidents((list) => [report, ...list])
    return report
  }

  function assignCrew(id, crew) {
    const now = new Date().toISOString()
    update(id, (inc) => ({
      ...inc,
      status: 'Pending',
      assignedCrew: crew,
      timeline: [...inc.timeline, { at: now, text: `Assigned to ${crew}` }],
    }))
  }

  function resolveIncident(id, note) {
    const now = new Date().toISOString()
    const text = note.trim() || 'Repair completed.'
    update(id, (inc) => ({
      ...inc,
      status: 'Resolved',
      resolvedAt: now,
      resolutionNote: text,
      timeline: [...inc.timeline, { at: now, text: `Resolved: ${text}` }],
    }))
  }

  function resetDemo() {
    setIncidents(seedIncidents())
  }

  const value = {
    incidents,
    sensors: SENSORS,
    incidentById: (id) => incidents.find((inc) => inc.id === id),
    addCitizenReport,
    assignCrew,
    resolveIncident,
    resetDemo,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

import { HOUR } from '../utils/format.js'
import { priorityLevel } from './model.js'

export const iso = (ms) => new Date(ms).toISOString()

export function nextId(list, prefix, start) {
  const max = list.reduce((m, x) => Math.max(m, Number(String(x.id).split('-')[1]) || 0), start)
  return `${prefix}-${max + 1}`
}

// audience: { roles: [...], userIds: [...] }
// size 'small' shows as a quiet popup in the corner instead of the big one at the top.
export function notify(s, { roles = [], userIds = [], title, body, link, severity = 'info', size = 'big' }, now) {
  const n = { id: `N-${now}-${s.notifications.length}`, at: iso(now), roles, userIds, title, body, link, severity, size, readBy: [] }
  return { ...s, notifications: [n, ...s.notifications].slice(0, 150) }
}

export function sms(s, { to, audience, text }, now) {
  if (audience === 'Resident' && !s.settings.notify.smsResidents) return s
  if (audience === 'Crew' && !s.settings.notify.smsCrews) return s
  const m = { id: `M-${now}-${s.sms.length}`, at: iso(now), to, audience, text }
  return { ...s, sms: [m, ...s.sms].slice(0, 150) }
}

export function audit(s, user, action, now) {
  const e = { id: `A-${now}-${s.audit.length}`, at: iso(now), user: user?.name ?? 'System', action }
  return { ...s, audit: [e, ...s.audit].slice(0, 300) }
}

export function crewMembers(s, crewId) {
  return s.users.filter((u) => u.crewId === crewId && u.active)
}

export function dueAt(level, settings, from) {
  return iso(from + settings.sla[level] * HOUR)
}

export function makePriority(likelihood, impact) {
  const score = Math.round((likelihood * impact) / 5)
  return { score, level: priorityLevel(score), likelihood, impact }
}

export function updateIn(list, id, change) {
  return list.map((x) => (x.id === id ? { ...x, ...(typeof change === 'function' ? change(x) : change) } : x))
}

export function isOverdue(item, now) {
  return item.status !== 'Resolved' && !!item.dueAt && now > new Date(item.dueAt).getTime()
}

export function defaultCrew(s, area) {
  return (s.crews.find((c) => c.area === area && c.active) ?? s.crews.find((c) => c.active))?.id ?? ''
}

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export function durationText(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.round(mins / 60)
  if (h < 48) return `${h} h`
  return `${Math.round(h / 24)} d`
}

export function timeAgo(iso, now) {
  const mins = Math.round((now - new Date(iso).getTime()) / MINUTE)
  if (mins < 0) return `in ${durationText(-mins)}`
  if (mins < 1) return 'just now'
  return `${durationText(mins)} ago`
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function money(n) {
  return Number(n || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 })
}

export function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

export function toDateInput(ms) {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function distanceKm(a, b) {
  const R = 6371
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Shrinks a photo so it fits in browser storage.
export function resizeImage(file, maxSide = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function startOfDayMs(t) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

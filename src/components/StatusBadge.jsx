const styles = {
  // Sensors
  Online: 'bg-green-100 text-green-800',
  Warning: 'bg-orange-100 text-orange-800',
  Alert: 'bg-red-100 text-red-800',
  Offline: 'bg-slate-200 text-slate-700',
  // Incidents
  Unattended: 'bg-orange-100 text-orange-800',
  Pending: 'bg-violet-100 text-violet-800',
  Resolved: 'bg-blue-100 text-blue-800',
  // Severity
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-slate-100 text-slate-700',
  // Source
  Sensor: 'bg-brand-light text-brand-dark',
  Resident: 'bg-sky-100 text-sky-800',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}

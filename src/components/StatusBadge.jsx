const styles = {
  Good: 'bg-emerald-100 text-emerald-800',
  Warning: 'bg-amber-100 text-amber-800',
  Critical: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}

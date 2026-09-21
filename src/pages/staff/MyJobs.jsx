import { Link } from 'react-router-dom'
import { useStore } from '../../data/StoreContext.js'
import { Empty, PageHeader, StatusBadge } from '../../components/ui.jsx'
import { formatDate, startOfDayMs, timeAgo } from '../../utils/format.js'

function isToday(iso, now) {
  return startOfDayMs(new Date(iso).getTime()) === startOfDayMs(now)
}

export default function MyJobs() {
  const { state, now, user } = useStore()
  const crew = state.crews.find((c) => c.id === user.crewId)
  const mine = state.incidents.filter((i) => i.crewId === user.crewId && i.status !== 'Resolved')
  const today = mine.filter((i) => i.scheduledFor && isToday(i.scheduledFor, now))
  const later = mine.filter((i) => !i.scheduledFor || !isToday(i.scheduledFor, now))
  const sortJobs = (list) =>
    [...list].sort((a, b) => {
      if (a.startedAt && !b.startedAt) return -1
      if (!a.startedAt && b.startedAt) return 1
      return (a.scheduledFor ?? a.assignedAt ?? '').localeCompare(b.scheduledFor ?? b.assignedAt ?? '')
    })
  const done = state.incidents
    .filter((i) => i.crewId === user.crewId && i.status === 'Resolved')
    .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
    .slice(0, 5)
  const members = state.users.filter((u) => u.crewId === user.crewId && u.active)

  function JobCard({ job }) {
    const asset = state.assets.find((a) => a.id === job.assetId)
    return (
      <Link to={`/admin/jobs/${job.id}`} className="block rounded-2xl border-2 border-slate-200 bg-white p-5 hover:border-brand">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-extrabold text-slate-900">{job.title}</h2>
          <StatusBadge status={job.status} />
        </div>
        <p className="mt-1 text-xs text-slate-400">{job.id}</p>
        <p className="mt-2 text-slate-600">
          {asset?.name ?? 'Location'}{asset ? `, ${asset.landmark}` : ''} · {job.area}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {job.startedAt ? 'Started — ready to mark as fixed' : job.scheduledFor ? `Scheduled ${formatDate(job.scheduledFor)}` : `Assigned ${timeAgo(job.assignedAt, now)}`}
        </p>
      </Link>
    )
  }

  return (
    <>
      <PageHeader
        title="My jobs"
        subtitle={crew ? `${crew.name}, ${crew.area}. With ${members.filter((m) => m.id !== user.id).map((m) => m.name).join(', ') || 'no one else'}.` : 'You are not in a crew yet. Ask your admin.'}
      />

      <h2 className="mb-3 font-bold text-slate-900">Today ({today.length})</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {sortJobs(today).map((job) => <JobCard key={job.id} job={job} />)}
      </div>
      {today.length === 0 && <Empty>No jobs scheduled for today.</Empty>}

      {later.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-bold text-slate-900">Coming up ({later.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sortJobs(later).map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </>
      )}

      <h2 className="mb-3 mt-8 font-bold text-slate-900">Recently fixed</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {done.map((job) => <JobCard key={job.id} job={job} />)}
      </div>
      {done.length === 0 && <Empty>Nothing fixed yet.</Empty>}
    </>
  )
}

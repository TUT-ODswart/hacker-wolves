import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { can } from '../../data/constants.js'
import { defaultCrew } from '../../data/helpers.js'
import { Badge, Card, Empty, Field, PageHeader, Tabs, buttonClass, inputClass } from '../../components/ui.jsx'
import { downloadCsv, formatDate, formatDateTime, startOfDayMs, toDateInput } from '../../utils/format.js'

function isLate(wo, now) {
  return wo.status === 'Scheduled' && new Date(wo.scheduledFor).getTime() < startOfDayMs(now)
}

export function WorkOrderRow({ wo, state, now }) {
  const asset = state.assets.find((a) => a.id === wo.assetId)
  const crew = state.crews.find((c) => c.id === wo.crewId)
  return (
    <Link to={`/admin/work-orders/${wo.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{wo.id}</span>
        <div className="flex flex-wrap gap-1">
          {isLate(wo, now) && <Badge tone="Overdue">Late</Badge>}
          <Badge>{wo.kind}</Badge>
          <Badge>{wo.status}</Badge>
        </div>
      </div>
      <p className="mt-1 text-slate-900">{wo.title}</p>
      <p className="text-sm text-slate-500">
        {asset?.id} · {asset?.area} · {crew?.name ?? 'No crew'}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {wo.status === 'Completed' ? `Done ${formatDateTime(wo.completedAt)}` : `Scheduled ${formatDate(wo.scheduledFor)}`}
      </p>
    </Link>
  )
}

function PlanForm({ onDone }) {
  const { state, now, actions } = useStore()
  const manholes = state.assets
  const [assetId, setAssetId] = useState(manholes[0].id)
  const asset = state.assets.find((a) => a.id === assetId)
  const [crewId, setCrewId] = useState(defaultCrew(state, manholes[0].area))
  const [date, setDate] = useState(toDateInput(now + 2 * 86400000))
  const [title, setTitle] = useState('Routine jetting and inspection')

  function submit(e) {
    e.preventDefault()
    const [y, m, d] = date.split('-').map(Number)
    actions.createWorkOrder({ assetId, kind: 'Planned', title: `${title}, ${asset.landmark}`, crewId, scheduledFor: new Date(y, m - 1, d, 8).getTime() })
    onDone()
  }

  return (
    <Card title="Plan routine maintenance" className="mb-6">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Where">
          <select
            value={assetId}
            onChange={(e) => {
              setAssetId(e.target.value)
              setCrewId(defaultCrew(state, state.assets.find((a) => a.id === e.target.value).area))
            }}
            className={inputClass}
          >
            {manholes.map((a) => <option key={a.id} value={a.id}>{a.id}, {a.landmark}</option>)}
          </select>
        </Field>
        <Field label="Job">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Crew">
          <select value={crewId} onChange={(e) => setCrewId(e.target.value)} className={inputClass}>
            {state.crews.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.area})</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <button className={buttonClass}>Create job</button>
          <button type="button" onClick={onDone} className="px-4 text-sm text-slate-500 underline">Cancel</button>
        </div>
      </form>
    </Card>
  )
}

export default function WorkOrders() {
  const { state, now, user } = useStore()
  const [tab, setTab] = useState('Scheduled')
  const [crew, setCrew] = useState('')
  const [kind, setKind] = useState('')
  const [planning, setPlanning] = useState(false)

  const list = state.workOrders.filter((w) => (!crew || w.crewId === crew) && (!kind || w.kind === kind))
  const rows = list
    .filter((w) => w.status === tab)
    .sort((a, b) => (tab === 'Completed' ? b.completedAt.localeCompare(a.completedAt) : a.scheduledFor.localeCompare(b.scheduledFor)))

  return (
    <>
      <PageHeader
        title="Work orders"
        subtitle="Repairs, planned maintenance and sensor repairs"
        actions={
          <>
            {can(user, 'planWork') && (
              <button onClick={() => setPlanning(true)} className={`flex items-center gap-2 ${buttonClass}`}>
                <Plus size={18} /> Plan maintenance
              </button>
            )}
            <button
              onClick={() => downloadCsv('work-orders.csv', rows.map((w) => ({ id: w.id, title: w.title, kind: w.kind, status: w.status, crew: w.crewId, asset: w.assetId, scheduled: formatDate(w.scheduledFor), completed: w.completedAt ? formatDate(w.completedAt) : '' })))}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Download size={16} /> Export CSV
            </button>
          </>
        }
      />
      {planning && <PlanForm onDone={() => setPlanning(false)} />}

      <Tabs value={tab} onChange={setTab} tabs={['Scheduled', 'In progress', 'Completed'].map((t) => ({ value: t, label: t, count: list.filter((w) => w.status === t).length }))} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select value={crew} onChange={(e) => setCrew(e.target.value)} className={`${inputClass} sm:w-52`}>
          <option value="">All crews</option>
          {state.crews.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.area})</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${inputClass} sm:w-52`}>
          <option value="">All types</option>
          {['Proactive', 'Reactive', 'Planned', 'Sensor repair'].map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((wo) => <WorkOrderRow key={wo.id} wo={wo} state={state} now={now} />)}
      </div>
      {rows.length === 0 && <div className="mt-4"><Empty>Nothing here.</Empty></div>}
    </>
  )
}

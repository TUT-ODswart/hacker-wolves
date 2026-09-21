import { useStore } from '../../data/StoreContext.js'
import { Empty, PageHeader } from '../../components/ui.jsx'
import { WorkOrderRow } from './WorkOrders.jsx'

export default function MyJobs() {
  const { state, now, user } = useStore()
  const crew = state.crews.find((c) => c.id === user.crewId)
  const mine = state.workOrders.filter((w) => w.crewId === user.crewId)
  const active = mine.filter((w) => w.status !== 'Completed').sort((a, b) => (a.status === 'In progress' ? -1 : b.status === 'In progress' ? 1 : a.scheduledFor.localeCompare(b.scheduledFor)))
  const done = mine.filter((w) => w.status === 'Completed').sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 5)
  const members = state.users.filter((u) => u.crewId === user.crewId && u.active)

  return (
    <>
      <PageHeader title="My jobs" subtitle={crew ? `${crew.name}, ${crew.area}. With ${members.filter((m) => m.id !== user.id).map((m) => m.name).join(', ') || 'no one else'}.` : 'You are not in a crew yet. Ask your admin.'} />
      <h2 className="mb-3 font-bold text-slate-900">To do ({active.length})</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {active.map((wo) => <WorkOrderRow key={wo.id} wo={wo} state={state} now={now} />)}
      </div>
      {active.length === 0 && <Empty>No open jobs. Nice work.</Empty>}

      <h2 className="mb-3 mt-8 font-bold text-slate-900">Recently completed</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {done.map((wo) => <WorkOrderRow key={wo.id} wo={wo} state={state} now={now} />)}
      </div>
      {done.length === 0 && <Empty>Nothing completed yet.</Empty>}
    </>
  )
}

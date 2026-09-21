import { useState } from 'react'
import { useStore } from '../../data/StoreContext.js'
import { ROLES } from '../../data/constants.js'
import { AREAS } from '../../data/seed.js'
import { Badge, Card, Field, PageHeader, buttonClass, inputClass } from '../../components/ui.jsx'

const emptyUser = { name: '', email: '', phone: '', role: 'technician', crewId: '', password: '' }

export default function CrewsUsers() {
  const { state, user: me, actions } = useStore()
  const [form, setForm] = useState(emptyUser)
  const [editing, setEditing] = useState(null)
  const [crewName, setCrewName] = useState('')
  const [crewArea, setCrewArea] = useState(AREAS[0].name)

  function submitUser(e) {
    e.preventDefault()
    actions.saveUser({ ...form, crewId: form.role === 'technician' ? form.crewId || null : null, ...(editing ? { id: editing } : {}) })
    setForm(emptyUser)
    setEditing(null)
  }

  return (
    <>
      <PageHeader title="Crews & users" subtitle="Add or deactivate people and crews" />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Users" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr>{['Name', 'Email', 'Role', 'Crew', 'Status', ''].map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 pr-3">{u.name}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3">{ROLES[u.role]}</td>
                    <td className="py-2 pr-3">{state.crews.find((c) => c.id === u.crewId)?.name ?? '—'}</td>
                    <td className="py-2 pr-3"><Badge>{u.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="whitespace-nowrap py-2 text-right">
                      <button onClick={() => { setEditing(u.id); setForm({ ...emptyUser, ...u, crewId: u.crewId ?? '' }) }} className="mr-3 text-brand underline">Edit</button>
                      {u.id !== me.id && (
                        <button onClick={() => actions.saveUser({ id: u.id, active: !u.active })} className="text-slate-500 underline">
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={editing ? 'Edit user' : 'Add user'}>
          <form onSubmit={submitUser} className="space-y-3">
            <Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
            <Field label="Email"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            {form.role === 'technician' && (
              <Field label="Crew">
                <select value={form.crewId} onChange={(e) => setForm({ ...form, crewId: e.target.value })} className={inputClass}>
                  <option value="">No crew</option>
                  {state.crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            )}
            <Field label={editing ? 'New password (optional)' : 'Password'}>
              <input required={!editing} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
            </Field>
            <div className="flex gap-2">
              <button className={buttonClass}>{editing ? 'Save' : 'Add user'}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyUser) }} className="text-sm underline">Cancel</button>}
            </div>
          </form>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
          {state.crews.map((c) => {
            const members = state.users.filter((u) => u.crewId === c.id && u.active)
            const open = state.incidents.filter((i) => i.crewId === c.id && i.status !== 'Resolved').length
            return (
              <Card key={c.id} title={c.name} action={<Badge>{c.active ? 'Active' : 'Inactive'}</Badge>}>
                <p className="text-sm text-slate-600">Area: {c.area}</p>
                <p className="text-sm text-slate-600">Members: {members.map((m) => m.name).join(', ') || 'none'}</p>
                <p className="text-sm text-slate-600">Open jobs: {open}</p>
                <button onClick={() => actions.saveCrew({ id: c.id, active: !c.active })} className="mt-2 text-sm text-slate-500 underline">
                  {c.active ? 'Deactivate' : 'Activate'}
                </button>
              </Card>
            )
          })}
        </div>
        <Card title="Add crew">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              actions.saveCrew({ name: crewName, area: crewArea })
              setCrewName('')
            }}
            className="space-y-3"
          >
            <Field label="Name"><input required value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="Crew E" className={inputClass} /></Field>
            <Field label="Area">
              <select value={crewArea} onChange={(e) => setCrewArea(e.target.value)} className={inputClass}>
                {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
              </select>
            </Field>
            <button className={buttonClass}>Add crew</button>
            <p className="text-xs text-slate-500">Add technicians to a crew when you edit a user.</p>
          </form>
        </Card>
      </div>
    </>
  )
}

import { useState } from 'react'
import { useStore } from '../../data/StoreContext.js'
import { ROLES } from '../../data/constants.js'
import { AREAS } from '../../data/seed.js'
import { Badge, Card, Field, PageHeader, Tabs, buttonClass, inputClass } from '../../components/ui.jsx'
import { formatDateTime } from '../../utils/format.js'

const TABS = ['Alerts', 'Response times', 'Users', 'Crews', 'Notifications', 'SMS sent', 'Audit log']

function Saved({ show }) {
  return show ? <span className="text-sm font-semibold text-green-700">Saved</span> : null
}

function NumberField({ label, value, onChange, hint, suffix }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputClass} />
        {suffix && <span className="shrink-0 text-sm text-slate-500">{suffix}</span>}
      </div>
    </Field>
  )
}

function AlertsTab() {
  const { state, actions } = useStore()
  const [f, setF] = useState(() => ({ heartbeatMinutes: state.settings.heartbeatMinutes, missedBeats: state.settings.missedBeats, ...state.settings.thresholds }))
  const [saved, setSaved] = useState(false)
  const set = (k) => (v) => {
    setF({ ...f, [k]: v })
    setSaved(false)
  }

  function save() {
    const { heartbeatMinutes, missedBeats, ...thresholds } = f
    actions.updateSettings({ heartbeatMinutes, missedBeats, thresholds })
    setSaved(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Sensor health">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Heartbeat every" value={f.heartbeatMinutes} onChange={set('heartbeatMinutes')} suffix="min" />
          <NumberField label="Offline after missing" value={f.missedBeats} onChange={set('missedBeats')} suffix="heartbeats" />
        </div>
        <p className="mt-3 text-sm text-slate-500">A sensor is marked offline after {f.heartbeatMinutes * f.missedBeats} minutes of silence.</p>
      </Card>
      <Card title="Alert levels">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Manhole warning" value={f.levelWarnPct} onChange={set('levelWarnPct')} suffix="% full" />
          <NumberField label="Manhole alert" value={f.levelAlertPct} onChange={set('levelAlertPct')} suffix="% full" />
          <NumberField label="Flow drop alert" value={f.flowDropPct} onChange={set('flowDropPct')} suffix="% less than normal" />
          <NumberField label="Lowest safe pressure" value={f.pressureMin} onChange={set('pressureMin')} suffix="bar" />
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <button onClick={save} className={buttonClass}>Save</button>
        <Saved show={saved} />
      </div>
    </div>
  )
}

function ResponseTab() {
  const { state, actions } = useStore()
  const [sla, setSla] = useState(state.settings.sla)
  const [esc, setEsc] = useState(state.settings.escalationMinutes)
  const [saved, setSaved] = useState(false)

  return (
    <Card title="How fast each priority must be handled">
      <div className="grid gap-4 sm:grid-cols-4">
        {['High', 'Medium', 'Low'].map((k) => (
          <NumberField key={k} label={`${k} priority`} value={sla[k]} onChange={(v) => { setSla({ ...sla, [k]: v }); setSaved(false) }} suffix="hours" />
        ))}
        <NumberField label="Escalate unassigned High after" value={esc} onChange={(v) => { setEsc(v); setSaved(false) }} suffix="min" hint="Managers are notified." />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={() => { actions.updateSettings({ sla, escalationMinutes: esc }); setSaved(true) }} className={buttonClass}>Save</button>
        <Saved show={saved} />
      </div>
      <p className="mt-3 text-xs text-slate-500">New targets apply to new incidents.</p>
    </Card>
  )
}

const emptyUser = { name: '', email: '', phone: '', role: 'technician', crewId: '', password: '' }

function UsersTab() {
  const { state, user: me, actions } = useStore()
  const [form, setForm] = useState(emptyUser)
  const [editing, setEditing] = useState(null)

  function submit(e) {
    e.preventDefault()
    actions.saveUser({ ...form, crewId: form.role === 'technician' ? form.crewId || null : null, ...(editing ? { id: editing } : {}) })
    setForm(emptyUser)
    setEditing(null)
  }

  return (
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
        <form onSubmit={submit} className="space-y-3">
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
  )
}

function CrewsTab() {
  const { state, actions } = useStore()
  const [name, setName] = useState('')
  const [area, setArea] = useState(AREAS[0].name)

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
        {state.crews.map((c) => {
          const members = state.users.filter((u) => u.crewId === c.id && u.active)
          const open = state.workOrders.filter((w) => w.crewId === c.id && w.status !== 'Completed').length
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
            actions.saveCrew({ name, area })
            setName('')
          }}
          className="space-y-3"
        >
          <Field label="Name"><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Crew E" className={inputClass} /></Field>
          <Field label="Area">
            <select value={area} onChange={(e) => setArea(e.target.value)} className={inputClass}>
              {AREAS.map((a) => <option key={a.name}>{a.name}</option>)}
            </select>
          </Field>
          <button className={buttonClass}>Add crew</button>
          <p className="text-xs text-slate-500">Add technicians to a crew from the Users tab.</p>
        </form>
      </Card>
    </div>
  )
}

function NotificationsTab() {
  const { state, actions } = useStore()
  const n = state.settings.notify
  const rows = [
    ['smsResidents', 'SMS residents when their report is received, assigned and fixed'],
    ['smsCrews', 'SMS crews when they get a new job'],
    ['emailManagers', 'Email managers a daily summary'],
  ]
  return (
    <Card title="Notifications">
      <ul className="space-y-4">
        {rows.map(([k, label]) => (
          <li key={k}>
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-700">{label}</span>
              <input type="checkbox" checked={n[k]} onChange={(e) => actions.updateSettings({ notify: { [k]: e.target.checked } })} className="h-5 w-5" />
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">This prototype has no SMS gateway. Messages are logged in the SMS sent tab instead.</p>
    </Card>
  )
}

function LogList({ items, render }) {
  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {items.map((m) => <li key={m.id} className="py-3 text-sm">{render(m)}</li>)}
        {items.length === 0 && <li className="py-3 text-sm text-slate-500">Nothing yet.</li>}
      </ul>
    </Card>
  )
}

export default function Settings() {
  const { state } = useStore()
  const [tab, setTab] = useState('Alerts')

  return (
    <>
      <PageHeader title="Settings" subtitle={state.settings.orgName} />
      <Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => ({ value: t, label: t }))} />
      <div className="mt-6">
        {tab === 'Alerts' && <AlertsTab />}
        {tab === 'Response times' && <ResponseTab />}
        {tab === 'Users' && <UsersTab />}
        {tab === 'Crews' && <CrewsTab />}
        {tab === 'Notifications' && <NotificationsTab />}
        {tab === 'SMS sent' && (
          <LogList
            items={state.sms}
            render={(m) => (
              <>
                <p className="text-slate-900">{m.text}</p>
                <p className="text-xs text-slate-500">To {m.to} · {m.audience} · {formatDateTime(m.at)}</p>
              </>
            )}
          />
        )}
        {tab === 'Audit log' && (
          <LogList
            items={state.audit}
            render={(a) => (
              <>
                <p className="text-slate-900">{a.action}</p>
                <p className="text-xs text-slate-500">{a.user} · {formatDateTime(a.at)}</p>
              </>
            )}
          />
        )}
      </div>
    </>
  )
}

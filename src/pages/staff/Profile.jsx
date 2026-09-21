import { useState } from 'react'
import { useStore } from '../../data/StoreContext.js'
import { ROLES } from '../../data/constants.js'
import { Card, Field, PageHeader, buttonClass, inputClass } from '../../components/ui.jsx'

export default function Profile() {
  const { user, actions } = useStore()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [saved, setSaved] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwMsg, setPwMsg] = useState(null)

  function changePassword(e) {
    e.preventDefault()
    if (current !== user.password) return setPwMsg({ ok: false, text: 'Your current password is wrong.' })
    if (next.length < 6) return setPwMsg({ ok: false, text: 'Use at least 6 characters.' })
    if (next !== confirm) return setPwMsg({ ok: false, text: 'The new passwords do not match.' })
    actions.changePassword({ password: next })
    setCurrent('')
    setNext('')
    setConfirm('')
    setPwMsg({ ok: true, text: 'Password changed.' })
  }

  return (
    <>
      <PageHeader title="My profile" subtitle={`${ROLES[user.role]} · ${user.email}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Details">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              actions.updateProfile({ name, phone })
              setSaved(true)
            }}
            className="space-y-3"
          >
            <Field label="Name"><input value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} className={inputClass} /></Field>
            <Field label="Phone (for SMS alerts)"><input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false) }} className={inputClass} /></Field>
            <div className="flex items-center gap-3">
              <button className={buttonClass}>Save</button>
              {saved && <span className="text-sm font-semibold text-green-700">Saved</span>}
            </div>
          </form>
        </Card>
        <Card title="Change password">
          <form onSubmit={changePassword} className="space-y-3">
            <Field label="Current password"><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} /></Field>
            <Field label="New password"><input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} /></Field>
            <Field label="Confirm new password"><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} /></Field>
            {pwMsg && <p className={`text-sm font-semibold ${pwMsg.ok ? 'text-green-700' : 'text-red-600'}`}>{pwMsg.text}</p>}
            <button className={buttonClass}>Change password</button>
          </form>
        </Card>
      </div>
    </>
  )
}

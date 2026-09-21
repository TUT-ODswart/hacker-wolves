import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, CircleCheck, Phone } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'
import { AREAS } from '../../data/seed.js'
import { EMERGENCY_LINE, REPORT_TYPES } from '../../data/constants.js'
import { PhotoInput, inputClass, Badge } from '../../components/ui.jsx'
import { timeAgo } from '../../utils/format.js'

export default function Report() {
  const { state, now, actions } = useStore()
  const [params] = useSearchParams()
  const qrAsset = state.assets.find((a) => a.id === params.get('asset')) ?? null

  const [type, setType] = useState('')
  const [area, setArea] = useState(qrAsset?.area ?? '')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [photo, setPhoto] = useState(null)
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [attachTo, setAttachTo] = useState('')
  const [result, setResult] = useState(null)

  const wantsContact = !!(name.trim() || phone.trim())
  const nearby = state.incidents
    .filter((i) => i.status !== 'Resolved' && i.area === area)
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .slice(0, 5)
  const autoDuplicate = actions.findDuplicate({ lat: coords?.lat, lng: coords?.lng, assetId: qrAsset?.id, area })

  function getLocation() {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location.')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocationError('Could not get your location. Choose your area instead.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    const r = actions.submitReport({
      type,
      area,
      address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      assetId: qrAsset?.id ?? null,
      photo,
      description,
      name: consent ? name : '',
      phone: consent ? phone : '',
      consent,
      attachTo: attachTo || null,
    })
    setResult(r)
    window.scrollTo(0, 0)
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CircleCheck size={64} className="mx-auto text-green-600" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Report received</h1>
          {result.duplicate ? (
            <p className="mt-2 text-slate-600">
              This problem was already reported, so we added your report to it. <strong>{result.count} residents</strong> have now reported it, which moves it up the list.
            </p>
          ) : (
            <p className="mt-2 text-slate-600">Thank you. The City has been notified.</p>
          )}
          <p className="mt-6 text-sm text-slate-500">Your reference number</p>
          <p className="text-4xl font-extrabold tracking-wide text-brand">{result.reportId}</p>
          <p className="mt-2 text-sm text-slate-500">Save this number to check on your report.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/track?ref=${result.reportId}`} className="rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark">
              Track this report
            </Link>
            <Link to="/" className="rounded-xl border-2 border-brand px-6 py-3 font-bold text-brand hover:bg-brand-light">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Report a sewage leak</h1>
      <p className="mt-2 text-slate-600">No account needed. It takes about a minute.</p>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-900">
        <Phone size={18} className="mt-0.5 shrink-0" />
        <p>
          If sewage is entering homes or is a danger to people right now, call the City of Tshwane on <strong>{EMERGENCY_LINE}</strong> as well.
        </p>
      </div>

      {qrAsset && (
        <div className="mt-4 rounded-2xl bg-brand-light p-4 text-sm text-brand-dark">
          Reporting at <strong>{qrAsset.name}</strong>, {qrAsset.landmark}, {qrAsset.area}. (Scanned from the code on the manhole cover.)
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <fieldset>
          <legend className="font-bold text-slate-900">What do you see? *</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REPORT_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${type === t ? 'border-brand bg-brand-light text-brand-dark' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-bold text-slate-900">Where is it? *</legend>
          <select value={area} onChange={(e) => setArea(e.target.value)} required disabled={!!qrAsset} className={inputClass}>
            <option value="">Choose your area</option>
            {AREAS.map((a) => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, block or landmark (e.g. Block L, next to the tuck shop)" className={inputClass} />
          {!qrAsset && (
            <button type="button" onClick={getLocation} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <MapPin size={18} />
              {locating ? 'Finding your location…' : coords ? `Location added (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : 'Use my current location'}
            </button>
          )}
          {locationError && <p className="text-sm text-red-600">{locationError}</p>}
        </fieldset>

        {area && (nearby.length > 0 || autoDuplicate) && (
          <fieldset className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <legend className="px-1 font-bold text-amber-900">Already reported in {area}</legend>
            {autoDuplicate && !attachTo && (
              <p className="mb-3 text-sm text-amber-900">
                There is already an open problem right where you are: <strong>{autoDuplicate.title}</strong>. Your report will be added to it.
              </p>
            )}
            <p className="text-sm text-amber-900">Is your problem one of these? Adding to an existing report helps the City see how serious it is.</p>
            <div className="mt-3 space-y-2">
              {nearby.map((i) => (
                <label key={i.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-sm ${attachTo === i.id ? 'border-brand' : 'border-slate-200'}`}>
                  <input type="radio" name="attach" checked={attachTo === i.id} onChange={() => setAttachTo(i.id)} className="mt-1" />
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-900">{i.title}</span>
                    <span className="text-slate-500">
                      Reported {timeAgo(i.reportedAt, now)} · {i.reportIds.length || 'No'} resident report{i.reportIds.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <Badge>{i.status === 'Unattended' ? 'New' : 'Crew sent'}</Badge>
                </label>
              ))}
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 text-sm ${attachTo === '' ? 'border-brand' : 'border-slate-200'}`}>
                <input type="radio" name="attach" checked={attachTo === ''} onChange={() => setAttachTo('')} />
                <span className="font-semibold text-slate-900">No, this is a different problem</span>
              </label>
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="font-bold text-slate-900">Photo</legend>
          <div className="mt-3">
            <PhotoInput value={photo} onChange={setPhoto} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-bold text-slate-900">Anything else we should know?</legend>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="How long has it been like this? Is it getting worse?" className={`mt-3 ${inputClass}`} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-bold text-slate-900">Get updates by SMS (optional)</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" className={inputClass} />
          </div>
          {wantsContact && (
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>
                I agree that the City may use my name and phone number only to update me about this report. My details will not be shown publicly or shared. (POPIA)
              </span>
            </label>
          )}
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={!type || !area || (wantsContact && !consent)}
            className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send report
          </button>
          {wantsContact && !consent && <p className="mt-2 text-center text-sm text-slate-500">Tick the consent box, or clear your name and number to report anonymously.</p>}
          <p className="mt-3 text-center text-sm text-slate-500">Do not touch sewage. Keep children and pets away from the area.</p>
        </div>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, MapPin, CircleCheck } from 'lucide-react'
import { useData } from '../../data/DataContext.js'
import { AREAS, REPORT_TYPES } from '../../data/seed.js'
import { resizeImage } from '../../utils/format.js'

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

export default function Report() {
  const { addCitizenReport } = useData()
  const [type, setType] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(null)

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPhoto(await resizeImage(file))
    } catch {
      setPhoto(null)
    }
  }

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
    const report = addCitizenReport({ type, area, address, description, photo, lat: coords?.lat, lng: coords?.lng, name, phone })
    setSubmitted(report)
    window.scrollTo(0, 0)
  }

  function reset() {
    setType('')
    setArea('')
    setAddress('')
    setDescription('')
    setPhoto(null)
    setCoords(null)
    setName('')
    setPhone('')
    setSubmitted(null)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CircleCheck size={64} className="mx-auto text-green-600" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Report received</h1>
          <p className="mt-2 text-slate-600">Thank you. The City has been notified.</p>
          <p className="mt-6 text-sm text-slate-500">Your reference number</p>
          <p className="text-4xl font-extrabold tracking-wide text-brand">{submitted.id}</p>
          <p className="mt-2 text-sm text-slate-500">Save this number to check on your report.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/track?ref=${submitted.id}`} className="rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark">
              Track this report
            </Link>
            <button onClick={reset} className="rounded-xl border-2 border-brand px-6 py-3 font-bold text-brand hover:bg-brand-light">
              Report another problem
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Report a sewage leak</h1>
      <p className="mt-2 text-slate-600">No account needed. It takes about a minute.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <fieldset>
          <legend className="font-bold text-slate-900">What do you see? *</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REPORT_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                  type === t ? 'border-brand bg-brand-light text-brand-dark' : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-bold text-slate-900">Where is it? *</legend>
          <select value={area} onChange={(e) => setArea(e.target.value)} required className={inputClass}>
            <option value="">Choose your area</option>
            {AREAS.map((a) => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, block or landmark (e.g. Block L, next to the tuck shop)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={getLocation}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <MapPin size={18} />
            {locating ? 'Finding your location…' : coords ? `Location added (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : 'Use my current location'}
          </button>
          {locationError && <p className="text-sm text-red-600">{locationError}</p>}
        </fieldset>

        <fieldset>
          <legend className="font-bold text-slate-900">Photo</legend>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 p-6 text-slate-500 hover:border-slate-400">
            {photo ? (
              <img src={photo} alt="Your photo of the problem" className="max-h-72 w-full rounded-lg object-cover" />
            ) : (
              <>
                <Camera size={32} />
                <span className="text-sm font-semibold">Take or upload a photo</span>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
          {photo && (
            <button type="button" onClick={() => setPhoto(null)} className="mt-2 text-sm text-slate-500 underline">
              Remove photo
            </button>
          )}
        </fieldset>

        <fieldset>
          <legend className="font-bold text-slate-900">Anything else we should know?</legend>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="How long has it been like this? Is it getting worse?"
            className={`mt-3 ${inputClass}`}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-bold text-slate-900">Your details (optional)</legend>
          <p className="text-sm text-slate-500">Only if you'd like the City to contact you.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" className={inputClass} />
          </div>
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={!type || !area}
            className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send report
          </button>
          <p className="mt-3 text-center text-sm text-slate-500">
            Do not touch sewage. Keep children and pets away from the area.
          </p>
        </div>
      </form>
    </div>
  )
}

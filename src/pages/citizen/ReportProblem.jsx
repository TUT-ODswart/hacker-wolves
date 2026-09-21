import { useState } from 'react'
import { Camera, MapPin, CheckCircle2 } from 'lucide-react'

const categories = ['Road or pothole', 'Traffic light', 'Stormwater drain', 'Public building', 'Other']

export default function ReportProblem() {
  const [category, setCategory] = useState('')
  const [photo, setPhoto] = useState(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

  // Works on localhost and on Vercel (needs HTTPS). The phone will ask for permission.
  function getLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: save the report (for now, local state or mock data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-teal-600" size={48} />
        <h1 className="mt-3 text-xl font-bold text-slate-900">Report sent</h1>
        <p className="mt-1 text-sm text-slate-600">The City has received your report. You can follow its progress in My reports.</p>
        <button
          onClick={() => { setSubmitted(false); setPhoto(null); setCategory(''); setDescription(''); setLocation(null) }}
          className="mt-5 w-full rounded-xl bg-teal-700 py-3 font-semibold text-white"
        >
          Report another problem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">What's the problem?</h1>

      <div className="grid grid-cols-2 gap-2">
        {categories.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-xl border px-3 py-3 text-sm font-medium ${
              category === c ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* capture="environment" opens the back camera directly on phones */}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-slate-500">
        {photo ? (
          <img src={photo} alt="Your photo of the problem" className="max-h-64 w-full rounded-lg object-cover" />
        ) : (
          <>
            <Camera size={32} />
            <span className="text-sm font-medium">Take or upload a photo</span>
          </>
        )}
        <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
      </label>

      <button
        type="button"
        onClick={getLocation}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700"
      >
        <MapPin size={18} />
        {locating ? 'Finding your location…' : location ? `Location added (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Add my location'}
      </button>

      {/* text-base (16px) stops iPhones zooming in when you tap the field */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the problem (optional)"
        rows={3}
        className="w-full rounded-xl border border-slate-200 p-3 text-base"
      />

      <button
        type="submit"
        disabled={!category || !photo}
        className="w-full rounded-xl bg-teal-700 py-4 font-semibold text-white disabled:opacity-40"
      >
        Send report
      </button>
    </form>
  )
}

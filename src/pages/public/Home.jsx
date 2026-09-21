import { Link } from 'react-router-dom'
import { RadioTower, Smartphone, Wrench } from 'lucide-react'
import { useStore } from '../../data/StoreContext.js'

const steps = [
  { icon: RadioTower, title: 'Sensors watch the pipes', text: 'Sensors in manholes and pump stations spot rising sewage, leaks and pressure drops days before an overflow.' },
  { icon: Smartphone, title: 'Residents report what they see', text: 'Anyone can report a leak with a photo and location. No account needed.' },
  { icon: Wrench, title: 'Crews fix it early', text: 'The City sees every problem in one place, ranked by urgency, and sends a crew before sewage reaches the street.' },
]

export default function Home() {
  const { state } = useStore()
  const resolved = state.incidents.filter((i) => i.status === 'Resolved' && i.kind !== 'Sensor repair').length
  const proactive = state.incidents.filter((i) => i.status === 'Resolved' && i.kind === 'Proactive').length

  return (
    <>
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg'), linear-gradient(135deg, #11676a, #0b4f51)" }} />
        <div className="absolute inset-0 bg-white/55" />
        <div className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">Sewage Maintenance System</h1>
            <p className="mt-6 text-xl font-bold italic text-slate-900 sm:text-2xl">
              Detect Early. Predict Smarter.
              <br />
              Maintain Better.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/report" className="rounded-xl bg-brand px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-brand-dark">
                Report a sewage leak
              </Link>
              <Link to="/track" className="rounded-xl border-2 border-brand bg-white px-6 py-4 text-lg font-bold text-brand hover:bg-brand-light">
                Track a report
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-light">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-center sm:grid-cols-2">
          <div>
            <p className="text-4xl font-extrabold text-brand-dark">{resolved}</p>
            <p className="text-slate-700">problems fixed in the last 6 months</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-brand-dark">{proactive}</p>
            <p className="text-slate-700">fixed before sewage reached the street</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-extrabold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon size={26} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

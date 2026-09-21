import { Link } from 'react-router-dom'
import { RadioTower, Smartphone, Wrench } from 'lucide-react'

const steps = [
  { icon: RadioTower, title: 'Sensors watch the pipes', text: 'Sensors in manholes, pipes and pump stations spot rising water, leaks and struggling pumps early.' },
  { icon: Smartphone, title: 'Residents report leaks', text: 'Anyone can report a leak with a photo and location. No account needed.' },
  { icon: Wrench, title: 'Crews fix it early', text: 'The City sees every problem in one place and sends a crew before it becomes an overflow.' },
]

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        {/* Save the designer's photo as public/hero.jpg. Until then a teal gradient shows. */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.jpg'), linear-gradient(135deg, #11676a, #0b4f51)" }}
        />
        <div className="absolute inset-0 bg-white/55" />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Sewage Maintenance System
            </h1>
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

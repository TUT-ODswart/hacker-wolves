import { Link } from 'react-router-dom'

const sensors = [
  { name: 'Water level', where: 'Inside manholes', catches: 'Rising water means a blockage. Caught before it overflows.' },
  { name: 'Flow meters', where: 'Start and end of a pipe', catches: 'Less flow out than in means sewage is leaking from the pipe.' },
  { name: 'Pressure', where: 'Pumped pipes', catches: 'Pressure dropping means a leak or a burst.' },
  { name: 'Pump power', where: 'Pump stations', catches: 'A pump straining means a blockage or wear, before it fails.' },
]

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">About the system</h1>
      <p className="mt-4 text-lg text-slate-700">
        Today, most sewage problems are only found once sewage is already on the street. By then repairs cost more, services are
        disrupted and people are exposed to health risks.
      </p>
      <p className="mt-4 text-lg text-slate-700">
        This system helps the City find problems early. Sensors watch the most important parts of the sewer network, residents
        report what they see, and officials get one clear view of what needs fixing first.
      </p>

      <h2 className="mt-10 text-2xl font-extrabold text-slate-900">What the sensors measure</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {sensors.map((s) => (
          <div key={s.name} className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-brand">{s.name}</h3>
            <p className="text-sm text-slate-500">{s.where}</p>
            <p className="mt-2 text-slate-700">{s.catches}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl font-extrabold text-slate-900">Who built it</h2>
      <p className="mt-4 text-lg text-slate-700">
        Hacker Wolves, a student team, for the Tshwane hackathon.
      </p>

      <Link to="/report" className="mt-8 inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark">
        Report a sewage leak
      </Link>
    </div>
  )
}

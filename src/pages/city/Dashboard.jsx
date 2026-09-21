import PageHeader from '../../components/PageHeader.jsx'
import Placeholder from '../../components/Placeholder.jsx'

const stats = [
  { label: 'Assets monitored', value: '1,284' },
  { label: 'Critical', value: '12', tone: 'text-red-600' },
  { label: 'Open work orders', value: '37' },
  { label: 'Reports this week', value: '58' },
]

const alerts = [
  { id: 1, text: 'Drain SW-118 water rising faster than usual after rain', level: 'High' },
  { id: 2, text: 'Traffic light TL-0472 backup battery getting weak', level: 'Medium' },
  { id: 3, text: 'Road R-2291 getting rougher week on week', level: 'Medium' },
]

export default function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" description="Current condition of City infrastructure" />

      {/* 2 columns on phones, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 sm:text-sm">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold sm:text-3xl ${s.tone ?? 'text-slate-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Stacked on phones, map + alerts side by side on desktop */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="min-h-72 lg:col-span-2 lg:min-h-[28rem]">
          <Placeholder title="Asset map">
            Leaflet map with assets coloured by condition. Give the map a fixed height: h-72 on phones, lg:h-[28rem] on desktop.
          </Placeholder>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Latest alerts</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {alerts.map((a) => (
              <li key={a.id} className="py-3 text-sm text-slate-700">
                <span className={`mr-2 rounded px-2 py-0.5 text-xs font-medium ${
                  a.level === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {a.level}
                </span>
                {a.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

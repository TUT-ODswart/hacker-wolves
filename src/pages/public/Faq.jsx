const faqs = [
  {
    q: 'What should I do if I see a sewage leak?',
    a: 'Keep away from it, keep children and pets away, and report it on this site with a photo if you can. Do not try to open or clear a manhole yourself.',
  },
  {
    q: 'Do I need an account to report a leak?',
    a: 'No. Anyone can report. You can leave your name and phone number if you want the City to contact you, but it is optional.',
  },
  {
    q: 'How do I check on my report?',
    a: 'After you report, you get a reference number like INC-1016. Enter it on the Track a report page to see whether a crew has been assigned and when it was fixed.',
  },
  {
    q: 'How do the sensors find leaks?',
    a: 'Sensors in manholes measure how high the water is. Rising water means a blockage. Flow meters on pipes compare how much sewage goes in and comes out. If less comes out, the pipe is leaking. Pressure sensors on pumped pipes and power sensors on pumps catch bursts and failing pumps.',
  },
  {
    q: 'Why report if there are sensors?',
    a: 'Sensors are placed on the most important parts of the network. Residents see problems everywhere else. Reports and sensors together give the City the full picture.',
  },
  {
    q: 'What happens after I report?',
    a: 'Your report appears on the City dashboard straight away. An official checks it, assigns a crew, and marks it resolved once it has been fixed.',
  },
]

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
              {q}
              <span className="text-2xl text-brand transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-slate-600">{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

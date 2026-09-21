import { EMERGENCY_LINE } from '../../data/constants.js'

const faqs = [
  { q: 'What should I do if I see a sewage leak?', a: `Keep away from it, keep children and pets away, and report it here with a photo if you can. Never open or clear a manhole yourself. If sewage is entering homes, also call ${EMERGENCY_LINE}.` },
  { q: 'Do I need an account to report?', a: 'No. Anyone can report. Leave your name and number only if you want SMS updates.' },
  { q: 'What happens to my personal information?', a: 'Your name and phone number are optional. If you give them, they are only used to send you updates about your report, are not shown publicly and are not shared. This follows the Protection of Personal Information Act (POPIA).' },
  { q: 'Someone already reported it. Should I still report?', a: 'Yes. When you report, we show problems already reported nearby. Adding your report to an existing one tells the City more people are affected, which raises its priority.' },
  { q: 'How do I check on my report?', a: 'You get a reference number like RPT-2005. Enter it on the Track a report page to see whether a crew has been assigned and when it was fixed.' },
  { q: 'How do the sensors find problems?', a: 'Level sensors in manholes measure how full they are. Flow sensors measure how fast sewage moves. Pressure sensors watch the pumped pipes. When sewage backs up before a point and less comes out after it, there is a blockage. When less arrives than left, there is a leak.' },
  { q: 'Why report if there are sensors?', a: 'Sensors are only placed at the most important points, and sensors can fail. Residents see problems everywhere else and catch what a broken sensor misses.' },
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

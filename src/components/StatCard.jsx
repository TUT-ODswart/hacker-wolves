export default function StatCard({ label, value, sub, subTone = 'text-green-600' }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5">
      <p className="text-base text-slate-800 sm:text-lg">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">{value}</p>
      {sub && <p className={`mt-2 text-xl font-extrabold ${subTone}`}>{sub}</p>}
    </div>
  )
}

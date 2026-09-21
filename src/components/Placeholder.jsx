// Temporary box showing what still needs to be built. Delete when done.
export default function Placeholder({ title, children }) {
  return (
    <div className="h-full rounded-xl border-2 border-dashed border-slate-300 bg-white p-6">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{children}</p>
    </div>
  )
}

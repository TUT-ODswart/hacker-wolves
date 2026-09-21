import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

// Mock data for now. Move to src/data/ when the team agrees on the shape.
const assets = [
  { id: 'SW-118', type: 'Stormwater drain', location: 'Soshanguve Block L', condition: 'Critical', risk: 88 },
  { id: 'TL-0472', type: 'Traffic light', location: 'Lynnwood Rd, Hatfield', condition: 'Warning', risk: 64 },
  { id: 'R-2291', type: 'Road segment', location: 'Solomon Mahlangu Dr, Mamelodi', condition: 'Warning', risk: 57 },
  { id: 'BL-031', type: 'Public building', location: 'Community hall, Mabopane', condition: 'Good', risk: 18 },
]

export default function Assets() {
  return (
    <>
      <PageHeader title="Assets" description="Everything the City is monitoring" />

      {/* Phones: cards. Tables don't fit on small screens. */}
      <div className="space-y-3 md:hidden">
        {assets.map((a) => (
          <Link key={a.id} to={`/city/assets/${a.id}`} className="block rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{a.id}</span>
              <StatusBadge status={a.condition} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{a.type} · {a.location}</p>
            <p className="mt-1 text-sm text-slate-500">Risk score {a.risk}</p>
          </Link>
        ))}
      </div>

      {/* Tablet and up: table */}
      <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Condition</th>
              <th className="px-4 py-3 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/city/assets/${a.id}`} className="text-teal-700 hover:underline">{a.id}</Link>
                </td>
                <td className="px-4 py-3">{a.type}</td>
                <td className="px-4 py-3">{a.location}</td>
                <td className="px-4 py-3"><StatusBadge status={a.condition} /></td>
                <td className="px-4 py-3">{a.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

import Placeholder from '../../components/Placeholder.jsx'

export default function MyReports() {
  return (
    <>
      <h1 className="mb-4 text-xl font-bold text-slate-900">My reports</h1>
      <Placeholder title="Reports this resident sent">
        One card per report: photo thumbnail, category, date, and status (Received → Scheduled → Fixed). Stack cards vertically, full width.
      </Placeholder>
    </>
  )
}

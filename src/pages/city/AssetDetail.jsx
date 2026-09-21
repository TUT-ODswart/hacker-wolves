import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import Placeholder from '../../components/Placeholder.jsx'

export default function AssetDetail() {
  const { id } = useParams()

  return (
    <>
      <Link to="/city/assets" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to assets
      </Link>
      <PageHeader title={id} description="Condition history and failure prediction" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Placeholder title="Sensor readings over time">
            Recharts line chart. Wrap it in ResponsiveContainer so it shrinks to phone width.
          </Placeholder>
        </div>
        <Placeholder title="Risk and prediction">
          Risk score, predicted failure date, recommended action, and a Create work order button.
        </Placeholder>
        <div className="lg:col-span-3">
          <Placeholder title="Reports and repair history">
            Citizen reports linked to this asset, and past work orders.
          </Placeholder>
        </div>
      </div>
    </>
  )
}

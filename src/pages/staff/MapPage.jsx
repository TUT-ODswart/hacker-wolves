import NetworkMap from '../../components/NetworkMap.jsx'
import { PageHeader } from '../../components/ui.jsx'

export default function MapPage() {
  return (
    <>
      <PageHeader title="Network map" subtitle="Manholes, pump stations and pipes, coloured by condition. Tap a dot for details." />
      <div className="rounded-2xl border border-slate-300 bg-white p-4">
        <NetworkMap className="h-[60vh] min-h-[22rem]" />
      </div>
    </>
  )
}

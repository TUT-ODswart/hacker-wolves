import PageHeader from '../../components/PageHeader.jsx'
import Placeholder from '../../components/Placeholder.jsx'

export default function SensorHealth() {
  return (
    <>
      <PageHeader title="Sensor health" description="Is every sensor still reporting?" />
      <Placeholder title="To build">Each sensor: battery, last check-in, signal. Flag sensors that stopped reporting, froze, or send impossible readings.</Placeholder>
    </>
  )
}

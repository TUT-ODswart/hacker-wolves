import PageHeader from '../../components/PageHeader.jsx'
import Placeholder from '../../components/Placeholder.jsx'

export default function Maintenance() {
  return (
    <>
      <PageHeader title="Work orders" description="Scheduled and in-progress repairs" />
      <Placeholder title="To build">Jobs with asset, crew, date and status: Scheduled → In progress → Repaired. Filter tabs should scroll sideways on phones.</Placeholder>
    </>
  )
}

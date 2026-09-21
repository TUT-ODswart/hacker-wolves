import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import StaffLayout from './layouts/StaffLayout.jsx'
import RequireRole from './components/RequireRole.jsx'
import Home from './pages/public/Home.jsx'
import Report from './pages/public/Report.jsx'
import Track from './pages/public/Track.jsx'
import Faq from './pages/public/Faq.jsx'
import About from './pages/public/About.jsx'
import Dashboard from './pages/staff/Dashboard.jsx'
import MapPage from './pages/staff/MapPage.jsx'
import Incidents from './pages/staff/Incidents.jsx'
import IncidentDetail from './pages/staff/IncidentDetail.jsx'
import WorkOrders from './pages/staff/WorkOrders.jsx'
import WorkOrderDetail from './pages/staff/WorkOrderDetail.jsx'
import MyJobs from './pages/staff/MyJobs.jsx'
import Sensors from './pages/staff/Sensors.jsx'
import SensorDetail from './pages/staff/SensorDetail.jsx'
import Assets from './pages/staff/Assets.jsx'
import AssetDetail from './pages/staff/AssetDetail.jsx'
import Analytics from './pages/staff/Analytics.jsx'
import Simulation from './pages/staff/Simulation.jsx'
import Settings from './pages/staff/Settings.jsx'
import Profile from './pages/staff/Profile.jsx'

const OFFICE = ['admin', 'supervisor', 'manager']
const guard = (roles, el) => <RequireRole roles={roles}>{el}</RequireRole>

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="report" element={<Report />} />
        <Route path="track" element={<Track />} />
        <Route path="faq" element={<Faq />} />
        <Route path="about" element={<About />} />
      </Route>

      <Route path="admin" element={guard(null, <StaffLayout />)}>
        <Route index element={guard(OFFICE, <Dashboard />)} />
        <Route path="jobs" element={guard(['technician'], <MyJobs />)} />
        <Route path="map" element={<MapPage />} />
        <Route path="incidents" element={guard(OFFICE, <Incidents />)} />
        <Route path="incidents/:id" element={guard(OFFICE, <IncidentDetail />)} />
        <Route path="work-orders" element={guard(OFFICE, <WorkOrders />)} />
        <Route path="work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="sensors" element={guard(OFFICE, <Sensors />)} />
        <Route path="sensors/:id" element={guard(OFFICE, <SensorDetail />)} />
        <Route path="assets" element={guard(OFFICE, <Assets />)} />
        <Route path="assets/:id" element={guard(OFFICE, <AssetDetail />)} />
        <Route path="analytics" element={guard(OFFICE, <Analytics />)} />
        <Route path="simulation" element={guard(['admin', 'supervisor'], <Simulation />)} />
        <Route path="settings" element={guard(['admin'], <Settings />)} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

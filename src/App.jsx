import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import StaffLayout from './layouts/StaffLayout.jsx'
import RequireRole from './components/RequireRole.jsx'
import Home from './pages/public/Home.jsx'
import Report from './pages/public/Report.jsx'
import Track from './pages/public/Track.jsx'
import Faq from './pages/public/Faq.jsx'
import About from './pages/public/About.jsx'
import AdminHome from './pages/staff/AdminHome.jsx'
import Incidents from './pages/staff/Incidents.jsx'
import IncidentDetail from './pages/staff/IncidentDetail.jsx'
import MyJobs from './pages/staff/MyJobs.jsx'
import JobDetail from './pages/staff/JobDetail.jsx'
import Sensors from './pages/staff/Sensors.jsx'
import SensorDetail from './pages/staff/SensorDetail.jsx'
import Simulation from './pages/staff/Simulation.jsx'
import CrewsUsers from './pages/staff/CrewsUsers.jsx'
import Profile from './pages/staff/Profile.jsx'

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
        <Route index element={guard(['admin'], <AdminHome />)} />
        <Route path="jobs" element={guard(['technician'], <MyJobs />)} />
        <Route path="jobs/:id" element={guard(['technician', 'admin'], <JobDetail />)} />
        <Route path="incidents" element={guard(['admin'], <Incidents />)} />
        <Route path="incidents/:id" element={guard(['admin'], <IncidentDetail />)} />
        <Route path="sensors" element={guard(['admin'], <Sensors />)} />
        <Route path="sensors/:id" element={guard(['admin'], <SensorDetail />)} />
        <Route path="crews" element={guard(['admin'], <CrewsUsers />)} />
        <Route path="simulation" element={guard(['admin'], <Simulation />)} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import Home from './pages/public/Home.jsx'
import Report from './pages/public/Report.jsx'
import Track from './pages/public/Track.jsx'
import Faq from './pages/public/Faq.jsx'
import About from './pages/public/About.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Sensors from './pages/admin/Sensors.jsx'
import Incidents from './pages/admin/Incidents.jsx'
import IncidentDetail from './pages/admin/IncidentDetail.jsx'

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

      <Route
        path="admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sensors" element={<Sensors />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

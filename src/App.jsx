import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import CitizenLayout from './layouts/CitizenLayout.jsx'
import CityLayout from './layouts/CityLayout.jsx'
import ReportProblem from './pages/citizen/ReportProblem.jsx'
import MyReports from './pages/citizen/MyReports.jsx'
import Dashboard from './pages/city/Dashboard.jsx'
import Assets from './pages/city/Assets.jsx'
import AssetDetail from './pages/city/AssetDetail.jsx'
import Alerts from './pages/city/Alerts.jsx'
import Priorities from './pages/city/Priorities.jsx'
import Maintenance from './pages/city/Maintenance.jsx'
import CitizenReports from './pages/city/CitizenReports.jsx'
import SensorHealth from './pages/city/SensorHealth.jsx'
import Analytics from './pages/city/Analytics.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/citizen" element={<CitizenLayout />}>
        <Route index element={<Navigate to="report" replace />} />
        <Route path="report" element={<ReportProblem />} />
        <Route path="my-reports" element={<MyReports />} />
      </Route>

      <Route path="/city" element={<CityLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="priorities" element={<Priorities />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="reports" element={<CitizenReports />} />
        <Route path="sensors" element={<SensorHealth />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './app/Login.jsx'
import ChwApp from './features/chw/ChwApp.jsx'
import DoctorApp from './features/doctor/DoctorApp.jsx'
import PharmacyApp from './features/pharmacy/PharmacyApp.jsx'
import AdminApp from './features/admin/AdminApp.jsx'

// Phase 0 skeleton -- role-scoped route trees exist, but there's no
// auth guard wired up yet (that's Phase 1, next). Each role's routes
// are namespaced under their own path so the eventual guard can gate
// by prefix without restructuring this file.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chw/*" element={<ChwApp />} />
        <Route path="/doctor/*" element={<DoctorApp />} />
        <Route path="/pharmacy/*" element={<PharmacyApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

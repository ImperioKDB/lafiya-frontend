import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext.jsx'
import RequireRole from './app/RequireRole.jsx'
import Login from './app/Login.jsx'
import ChwApp from './features/chw/ChwApp.jsx'
import DoctorApp from './features/doctor/DoctorApp.jsx'
import PharmacyApp from './features/pharmacy/PharmacyApp.jsx'
import AdminApp from './features/admin/AdminApp.jsx'

// Phase 1 -- real auth now wraps the whole tree. Each role route is
// gated by RequireRole, which checks session + resolved role (via
// GET /api/me) before rendering anything underneath it.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/chw/*"
            element={
              <RequireRole role="chw">
                <ChwApp />
              </RequireRole>
            }
          />
          <Route
            path="/doctor/*"
            element={
              <RequireRole role="doctor">
                <DoctorApp />
              </RequireRole>
            }
          />
          <Route
            path="/pharmacy/*"
            element={
              <RequireRole role="pharmacy">
                <PharmacyApp />
              </RequireRole>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RequireRole role="admin">
                <AdminApp />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

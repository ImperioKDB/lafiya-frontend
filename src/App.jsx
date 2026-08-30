import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext.jsx'
import RequireRole from './app/RequireRole.jsx'
import LandingPage from './app/LandingPage.jsx'
import Login from './app/Login.jsx'
import ChwApp from './features/chw/ChwApp.jsx'
import DoctorApp from './features/doctor/DoctorApp.jsx'
import PharmacyApp from './features/pharmacy/PharmacyApp.jsx'
import AdminApp from './features/admin/AdminApp.jsx'

// "/" is the marketing front door now -- LandingPage explains the
// product and points to /login. There's no self-serve signup route:
// accounts are provisioned by an admin (see backend README), so this
// app never pretends otherwise with a fake Sign up path.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
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

import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'

// Gates a role-scoped route tree. Three distinct failure states get
// three distinct messages -- "not signed in," "signed in but no role,"
// and "signed in as the wrong role" are different problems with
// different fixes, and collapsing them into one generic redirect would
// hide which one actually happened.
export default function RequireRole({ role, children }) {
  const { session, profile, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="scaffold-screen">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (error || !profile) {
    return (
      <div className="scaffold-screen">
        <p className="eyebrow">Access</p>
        <h1>No role assigned</h1>
        <p className="muted">
          {error || 'This account has no chw/doctor/pharmacy/admin role yet. Ask an admin to set one up.'}
        </p>
      </div>
    )
  }

  if (profile.role !== role) {
    return <Navigate to={'/' + profile.role} replace />
  }

  return children
}

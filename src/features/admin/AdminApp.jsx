import SignOutButton from '../../components/SignOutButton.jsx'

export default function AdminApp() {
  return (
    <div className="scaffold-screen">
      <p className="eyebrow">Admin</p>
      <h1>Console</h1>
      <p className="muted">
        Tabbed pharmacy-verification / fraud-review console is designed
        in lafiya-mockup.html. Real wiring against
        GET/PATCH /api/admin/pharmacies and /api/admin/fraud-flags is
        next.
      </p>
      <span className="stamp pending">Phase 1: auth live</span>
      <SignOutButton />
    </div>
  )
}

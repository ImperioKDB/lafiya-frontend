import SignOutButton from '../../components/SignOutButton.jsx'

export default function DoctorApp() {
  return (
    <div className="scaffold-screen">
      <p className="eyebrow">Doctor</p>
      <h1>Consultation Queue</h1>
      <p className="muted">
        Split queue/detail desktop layout is designed in
        lafiya-mockup.html. Real data wiring against
        GET /api/consultations/queue is next.
      </p>
      <span className="stamp pending">Phase 1: auth live</span>
      <SignOutButton />
    </div>
  )
}

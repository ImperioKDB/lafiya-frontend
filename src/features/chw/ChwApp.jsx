import SignOutButton from '../../components/SignOutButton.jsx'

export default function ChwApp() {
  return (
    <div className="scaffold-screen">
      <p className="eyebrow">CHW</p>
      <h1>Dashboard</h1>
      <p className="muted">
        Mobile phone-frame shell, bottom nav, and all five screens
        (Dashboard, Register, Triage, Loans, Earnings) are designed and
        interactive in lafiya-mockup.html -- this route is the real
        deploy target they migrate into next, screen by screen.
      </p>
      <span className="stamp pending">Phase 1: auth live</span>
      <SignOutButton />
    </div>
  )
}

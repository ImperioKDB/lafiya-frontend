export default function PharmacyApp() {
  return (
    <div className="scaffold-screen">
      <p className="eyebrow">Pharmacy</p>
      <h1>Claim Submission</h1>
      <p className="muted">
        Real wiring against POST /api/claims (15% variance threshold,
        already live on the backend) is next.
      </p>
      <span className="stamp pending">Phase 0</span>
    </div>
  )
}

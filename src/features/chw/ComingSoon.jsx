export default function ComingSoon({ icon: Icon, title, description, endpoint }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <div style={{ height: 20 }} />
      <div className="state-block notice coming-soon">
        <Icon className="state-icon" />
        <p className="state-title">Not wired up yet</p>
        <p className="state-desc">{description}</p>
        {endpoint && (
          <p className="ledger-number" style={{ marginTop: 4 }}>
            Target: {endpoint}
          </p>
        )}
      </div>
    </div>
  )
}

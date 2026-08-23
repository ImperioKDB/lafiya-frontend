import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/AuthContext.jsx'
import { fetchEarnings } from './api.js'
import { formatNaira, formatDate } from '../../lib/format.js'
import { RegisterIcon, LoansIcon, AlertIcon, EarningsIcon } from '../../components/icons.jsx'

export default function EarningsScreen() {
  const { accessToken } = useAuth()
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [earnings, setEarnings] = useState([])
  const [backendGap, setBackendGap] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    let active = true
    setStatus('loading')
    fetchEarnings(accessToken)
      .then(({ earnings: e, notBuilt }) => {
        if (!active) return
        setEarnings(e)
        setBackendGap(notBuilt)
        setStatus('ready')
      })
      .catch((err) => {
        if (!active) return
        setErrorMessage(err.message || 'Could not load your earnings.')
        setStatus('error')
      })
    return () => { active = false }
  }, [accessToken])

  const accrued = sumBy(earnings, 'accrued')
  const pending = sumBy(earnings, 'pending')
  const sorted = [...earnings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div>
      <h1 className="page-title">Earnings</h1>
      <p className="page-subtitle">Registration fees and repayment commission.</p>
      <div style={{ height: 20 }} />

      {status === 'loading' && <EarningsSkeleton />}

      {status === 'error' && (
        <div className="state-block error" role="alert">
          <AlertIcon className="state-icon" />
          <p className="state-title">Couldn't load your earnings</p>
          <p className="state-desc">{errorMessage}</p>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {status === 'ready' && (
        <>
          {backendGap && (
            <div className="ledger-card" style={{ borderLeftColor: 'var(--brass)', marginBottom: 16 }}>
              <p className="muted" style={{ margin: 0 }}>
                The earnings endpoint isn't wired on the backend yet in
                this environment — figures below will populate once it's live.
              </p>
            </div>
          )}

          <div className="stat-grid stagger-in">
            <div className="stat-card teal">
              <div className="stat-icon"><EarningsIcon /></div>
              <div className="stat-value tabular">{formatNaira(accrued)}</div>
              <div className="stat-label">Accrued</div>
            </div>
            <div className="stat-card brass">
              <div className="stat-icon"><EarningsIcon /></div>
              <div className="stat-value tabular">{formatNaira(pending)}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div style={{ height: 28 }} />
          <p className="section-label">Ledger</p>

          {sorted.length === 0 ? (
            <div className="state-block">
              <EarningsIcon className="state-icon" />
              <p className="state-title">No earnings yet</p>
              <p className="state-desc">
                Registration fees and repayment commission will show up here as you work.
              </p>
            </div>
          ) : (
            sorted.map((entry, i) => (
              <div
                key={entry.id}
                className="ledger-card finance stagger-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="entry-row">
                  <div className="guarantor-phone-icon" style={{ background: 'var(--indigo-tint)', color: 'var(--indigo)' }}>
                    {entry.type === 'commission' ? <LoansIcon /> : <RegisterIcon />}
                  </div>
                  <div className="entry-body">
                    <div className="entry-name">
                      {entry.type === 'commission' ? 'Repayment commission' : 'Registration fee'}
                    </div>
                    <div className="entry-meta">{formatDate(entry.created_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="tabular" style={{ fontWeight: 700, fontSize: 14.5 }}>
                      {formatNaira(entry.amount)}
                    </div>
                    <span className={`stamp ${entry.status}`} style={{ marginTop: 4 }}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}

function EarningsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading earnings">
      <div className="loader-row" style={{ marginBottom: 18 }}>
        <span className="loader-stamp"><span /><span /><span /></span>
        Totting up the ledger…
      </div>
      <div className="stat-grid">
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
      </div>
      <div style={{ height: 28 }} />
      <div className="skeleton skeleton-line" style={{ width: '30%' }} />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  )
}

function sumBy(earnings, statusFilter) {
  return earnings
    .filter((e) => e.status === statusFilter)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
}

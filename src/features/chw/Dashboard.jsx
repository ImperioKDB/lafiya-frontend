import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { fetchChwDashboard } from './api.js'
import { formatEntryNumber, formatNaira } from '../../lib/format.js'
import { RegisterIcon, EarningsIcon, LedgerIcon, AlertIcon, PlusIcon } from '../../components/icons.jsx'

export default function Dashboard() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [patients, setPatients] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [backendGap, setBackendGap] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    let active = true
    setStatus('loading')

    fetchChwDashboard(accessToken)
      .then(({ patients: p, earnings: e }) => {
        if (!active) return
        setPatients(Array.isArray(p.data) ? p.data : [])
        setEarnings(e.data)
        setBackendGap(p.notBuilt || e.notBuilt)
        setStatus('ready')
      })
      .catch((err) => {
        if (!active) return
        setErrorMessage(err.message || 'Something went wrong loading your dashboard.')
        setStatus('error')
      })

    return () => { active = false }
  }, [accessToken])

  const pendingEarnings = sumEarnings(earnings, 'pending')
  const recent = [...patients]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((p, i) => ({ ...p, entryNumber: i + 1 }))
    .reverse()
    .slice(0, 5)

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Your patients, earnings, and recent activity.</p>

      <div style={{ height: 20 }} />

      {status === 'loading' && <DashboardSkeleton />}

      {status === 'error' && (
        <div className="state-block error" role="alert">
          <AlertIcon className="state-icon" />
          <p className="state-title">Couldn't load your dashboard</p>
          <p className="state-desc">{errorMessage}</p>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          {backendGap && (
            <div className="ledger-card" style={{ borderLeftColor: 'var(--brass)', marginBottom: 16 }}>
              <p className="muted" style={{ margin: 0 }}>
                Some figures below are placeholders — the earnings or
                patient-list endpoint isn't wired on the backend yet in
                this environment. Numbers will populate once it's live.
              </p>
            </div>
          )}

          <div className="stat-grid stagger-in">
            <div className="stat-card teal">
              <div className="stat-icon"><RegisterIcon /></div>
              <div className="stat-value tabular">{patients.length}</div>
              <div className="stat-label">Patients registered</div>
            </div>
            <div className="stat-card brass">
              <div className="stat-icon"><EarningsIcon /></div>
              <div className="stat-value tabular">{formatNaira(pendingEarnings)}</div>
              <div className="stat-label">Pending earnings</div>
              <span className="stat-tag">accrue on repay</span>
            </div>
          </div>

          <div style={{ height: 28 }} />

          <p className="section-label">Recent activity</p>

          {recent.length === 0 ? (
            <div className="state-block">
              <LedgerIcon className="state-icon" />
              <p className="state-title">No patients registered yet</p>
              <p className="state-desc">
                Register your first patient to start building your ledger.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/chw/register')}
              >
                <PlusIcon style={{ width: 16, height: 16 }} />
                Register patient
              </button>
            </div>
          ) : (
            <div>
              {recent.map((p, i) => (
                <div
                  key={p.id}
                  className="ledger-card stagger-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="entry-row">
                    <div className="entry-avatar">{initials(p.full_name)}</div>
                    <div className="entry-body">
                      <div className="entry-name">{p.full_name || 'Unnamed patient'}</div>
                      <div className="entry-meta">
                        <span className="ledger-number">{formatEntryNumber(p.entryNumber)}</span>
                        {' · '}{p.phone || 'no phone on file'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="loader-row" style={{ marginBottom: 18 }}>
        <span className="loader-stamp"><span /><span /><span /></span>
        Stamping in your ledger…
      </div>
      <div className="stat-grid">
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
      </div>
      <div style={{ height: 28 }} />
      <div className="skeleton skeleton-line" style={{ width: '40%' }} />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  )
}

function sumEarnings(earnings, statusFilter) {
  if (!Array.isArray(earnings)) return 0
  return earnings
    .filter((e) => e.status === statusFilter)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

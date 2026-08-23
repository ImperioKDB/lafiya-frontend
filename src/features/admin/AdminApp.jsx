import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/AuthContext.jsx'
import {
  fetchPendingPharmacies,
  updatePharmacyStatus,
  fetchOpenFraudFlags,
  updateFraudFlagStatus,
} from './api.js'
import { formatDate } from '../../lib/format.js'
import {
  StoreIcon,
  AlertIcon,
  CheckIcon,
  XIcon,
  LogoutIcon,
} from '../../components/icons.jsx'
import './admin.css'

export default function AdminApp() {
  const { profile, signOut, accessToken } = useAuth()
  const [tab, setTab] = useState('pharmacy') // pharmacy | fraud

  const [pharmacies, setPharmacies] = useState([])
  const [pharmaciesStatus, setPharmaciesStatus] = useState('loading')
  const [pharmaciesError, setPharmaciesError] = useState(null)

  const [flags, setFlags] = useState([])
  const [flagsStatus, setFlagsStatus] = useState('loading')
  const [flagsError, setFlagsError] = useState(null)

  const [busyIds, setBusyIds] = useState(new Set())

  useEffect(() => { loadPharmacies() }, [])
  useEffect(() => { loadFlags() }, [])

  function loadPharmacies() {
    setPharmaciesStatus('loading')
    fetchPendingPharmacies(accessToken)
      .then((data) => { setPharmacies(Array.isArray(data) ? data : []); setPharmaciesStatus('ready') })
      .catch((err) => { setPharmaciesError(err.message || 'Could not load pharmacies.'); setPharmaciesStatus('error') })
  }
  function loadFlags() {
    setFlagsStatus('loading')
    fetchOpenFraudFlags(accessToken)
      .then((data) => { setFlags(Array.isArray(data) ? data : []); setFlagsStatus('ready') })
      .catch((err) => { setFlagsError(err.message || 'Could not load fraud flags.'); setFlagsStatus('error') })
  }

  function withBusy(id, fn) {
    setBusyIds((s) => new Set(s).add(id))
    return fn().finally(() => setBusyIds((s) => { const n = new Set(s); n.delete(id); return n }))
  }

  async function handlePharmacyAction(id, status) {
    try {
      await withBusy(id, () => updatePharmacyStatus(id, status, accessToken))
      setPharmacies((list) => list.filter((p) => p.id !== id))
    } catch {
      // Row stays in the list with its action buttons re-enabled --
      // the person can just try again, no separate error banner needed
      // for a single-row action failure.
    }
  }

  async function handleFlagAction(id, status) {
    try {
      await withBusy(id, () => updateFraudFlagStatus(id, status, accessToken))
      setFlags((list) => list.filter((f) => f.id !== id))
    } catch {
      // Same as above -- row stays, buttons re-enable.
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>LAFIYA · Admin</p>
          <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 19 }}>
            {profile?.email ? profile.email.split('@')[0] : 'Admin'}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
          <LogoutIcon />
        </button>
      </header>

      <div className="admin-content">
        <nav className="admin-tabs">
          <button
            type="button"
            className={'admin-tab' + (tab === 'pharmacy' ? ' active' : '')}
            onClick={() => setTab('pharmacy')}
          >
            <StoreIcon />
            Pharmacy Verification
            <span className="admin-tab-count">{pharmacies.length}</span>
          </button>
          <button
            type="button"
            className={'admin-tab' + (tab === 'fraud' ? ' active' : '')}
            onClick={() => setTab('fraud')}
          >
            <AlertIcon />
            Fraud Review
            <span className="admin-tab-count">{flags.length}</span>
          </button>
        </nav>

        {tab === 'pharmacy' && (
          <PharmacyTab
            status={pharmaciesStatus}
            error={pharmaciesError}
            pharmacies={pharmacies}
            busyIds={busyIds}
            onApprove={(id) => handlePharmacyAction(id, 'verified')}
            onReject={(id) => handlePharmacyAction(id, 'rejected')}
            onRetry={loadPharmacies}
          />
        )}

        {tab === 'fraud' && (
          <FraudTab
            status={flagsStatus}
            error={flagsError}
            flags={flags}
            busyIds={busyIds}
            onClear={(id) => handleFlagAction(id, 'cleared')}
            onConfirm={(id) => handleFlagAction(id, 'confirmed_fraud')}
            onReview={(id) => handleFlagAction(id, 'reviewed')}
            onRetry={loadFlags}
          />
        )}
      </div>
    </div>
  )
}

function PharmacyTab({ status, error, pharmacies, busyIds, onApprove, onReject, onRetry }) {
  if (status === 'loading') return <ReviewSkeleton />
  if (status === 'error') return <ReviewError message={error} onRetry={onRetry} />
  if (pharmacies.length === 0) {
    return (
      <div className="state-block">
        <StoreIcon className="state-icon" />
        <p className="state-title">No pharmacies awaiting verification</p>
        <p className="state-desc">New license submissions will show up here.</p>
      </div>
    )
  }
  return (
    <div>
      {pharmacies.map((p, i) => (
        <div key={p.id} className="ledger-card stagger-in" style={{ animationDelay: `${i * 30}ms` }}>
          <div className="review-row">
            <div className="review-row-info">
              <div className="review-row-title">{p.name}</div>
              <div className="review-row-meta">
                License {p.license_number}
                {p.document_url && (
                  <> · <a href={p.document_url} target="_blank" rel="noreferrer" style={{ color: 'var(--indigo)' }}>view document</a></>
                )}
              </div>
              <div className="review-row-meta">Submitted {formatDate(p.created_at)}</div>
            </div>
            <div className="review-row-actions">
              <button className="btn btn-sm btn-outline" disabled={busyIds.has(p.id)} onClick={() => onReject(p.id)}>
                <XIcon style={{ width: 14, height: 14 }} />
                Reject
              </button>
              <button className="btn btn-sm btn-primary" disabled={busyIds.has(p.id)} onClick={() => onApprove(p.id)}>
                <CheckIcon style={{ width: 14, height: 14 }} />
                Verify
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FraudTab({ status, error, flags, busyIds, onClear, onConfirm, onReview, onRetry }) {
  if (status === 'loading') return <ReviewSkeleton />
  if (status === 'error') return <ReviewError message={error} onRetry={onRetry} />
  if (flags.length === 0) {
    return (
      <div className="state-block">
        <AlertIcon className="state-icon" />
        <p className="state-title">No open fraud flags</p>
        <p className="state-desc">The rule engine hasn't raised anything needing review.</p>
      </div>
    )
  }
  return (
    <div>
      {flags.map((f, i) => (
        <div key={f.id} className="ledger-card alert stagger-in" style={{ animationDelay: `${i * 30}ms` }}>
          <div className="review-row">
            <div className="review-row-info">
              <div className="review-row-title">
                {f.entity_type} · <span className="mono" style={{ fontSize: 12 }}>{String(f.entity_id).slice(0, 8)}…</span>
              </div>
              <div className="review-row-meta">Flagged {formatDate(f.created_at)}</div>
              <div className="review-row-reason">{f.reason}</div>
            </div>
            <div className="review-row-actions">
              <button className="btn btn-sm btn-outline" disabled={busyIds.has(f.id)} onClick={() => onReview(f.id)}>
                Reviewed
              </button>
              <button className="btn btn-sm btn-primary" disabled={busyIds.has(f.id)} onClick={() => onClear(f.id)}>
                Clear
              </button>
              <button className="btn btn-sm btn-danger" disabled={busyIds.has(f.id)} onClick={() => onConfirm(f.id)}>
                Confirm fraud
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="loader-row" style={{ marginBottom: 14 }}>
        <span className="loader-stamp"><span /><span /><span /></span>
        Loading…
      </div>
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  )
}

function ReviewError({ message, onRetry }) {
  return (
    <div className="state-block error" role="alert">
      <AlertIcon className="state-icon" />
      <p className="state-title">Couldn't load this list</p>
      <p className="state-desc">{message}</p>
      <button className="btn btn-outline" onClick={onRetry}>Retry</button>
    </div>
  )
}

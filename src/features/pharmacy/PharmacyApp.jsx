import { useState } from 'react'
import { useAuth } from '../../lib/AuthContext.jsx'
import { submitClaim } from './api.js'
import { formatNaira } from '../../lib/format.js'
import { PillIcon, AlertIcon, CheckIcon, LogoutIcon } from '../../components/icons.jsx'
import './pharmacy.css'

export default function PharmacyApp() {
  const { profile, signOut, accessToken } = useAuth()

  const [loanId, setLoanId] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | result | error
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const valid = loanId.trim().length > 0 && Number(claimAmount) > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const claim = await submitClaim(loanId.trim(), Number(claimAmount), accessToken)
      setResult(claim)
      setStatus('result')
    } catch (err) {
      setErrorMessage(err.message || 'Could not submit this claim.')
      setStatus('error')
    }
  }

  function reset() {
    setLoanId('')
    setClaimAmount('')
    setResult(null)
    setStatus('idle')
  }

  return (
    <div className="pharmacy-shell">
      <header className="pharmacy-header">
        <div className="pharmacy-header-inner">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>LAFIYA · Pharmacy</p>
            <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 19 }}>
              {profile?.email ? profile.email.split('@')[0] : 'Pharmacy'}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <div className="pharmacy-content">
        <h1 className="page-title">Submit Claim</h1>
        <p className="page-subtitle">Matched against the doctor's cost estimate automatically.</p>
        <div style={{ height: 20 }} />

        {status === 'result' && result ? (
          <ClaimResult result={result} onAnother={reset} />
        ) : (
          <form onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="ledger-card alert" role="alert" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <AlertIcon style={{ width: 18, height: 18, color: 'var(--stamp)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5 }}>Couldn't submit this claim</p>
                    <p className="muted" style={{ margin: '3px 0 0' }}>{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="field">
              <label>Loan reference</label>
              <input
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                placeholder="e.g. loan ID from the CHW or patient"
              />
              <p className="muted" style={{ marginTop: 5 }}>
                Ask the CHW or patient for this loan's reference.
              </p>
            </div>

            <div className="field">
              <label>Amount dispensed (₦)</label>
              <input
                type="number"
                min="0"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="e.g. 3500"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!valid || status === 'submitting'}>
              {status === 'submitting' ? (
                <>
                  <span className="loader-stamp" style={{ height: 12 }}>
                    <span style={{ background: '#fff' }} />
                    <span style={{ background: '#fff' }} />
                    <span style={{ background: '#fff' }} />
                  </span>
                  Submitting…
                </>
              ) : (
                <>
                  <PillIcon style={{ width: 16, height: 16 }} />
                  Submit claim
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ClaimResult({ result, onAnother }) {
  const matched = result.match_status === 'matched'
  const flagged = result.match_status === 'variance_flagged'

  return (
    <div className="stagger-in">
      <div
        className={'state-block' + (matched ? ' success' : flagged ? ' notice' : '')}
        style={
          matched
            ? { borderStyle: 'solid', borderColor: 'var(--teal-tint)', background: 'var(--teal-tint)' }
            : undefined
        }
      >
        {matched ? (
          <CheckIcon className="state-icon" style={{ color: 'var(--teal)' }} />
        ) : (
          <AlertIcon className="state-icon" />
        )}

        <span className={`stamp ${result.match_status}`} style={{ display: 'inline-flex', margin: '0 0 14px' }}>
          {result.match_status?.replace('_', ' ')}
        </span>

        <p className="state-title">
          {matched ? 'Claim matched' : flagged ? 'Variance exceeds threshold' : 'Claim submitted'}
        </p>
        <p className="state-desc">
          {matched
            ? "Payout to the pharmacy is simulated for now — real disbursement access is bank-side pending."
            : flagged
            ? "This claim's amount differs from the doctor's estimate by more than the 15% threshold. It's been routed to fraud review — not a dead end, just a hold for admin sign-off."
            : 'Awaiting the variance check.'}
        </p>

        <div className="fee-summary" style={{ textAlign: 'left', marginBottom: 18 }}>
          <div className="fee-row"><span>Amount dispensed</span><span className="amount">{formatNaira(result.claim_amount)}</span></div>
          <div className="fee-row"><span>Doctor's estimate</span><span className="amount">{formatNaira(result.estimate_amount)}</span></div>
          {result.variance != null && (
            <div className="fee-row total"><span>Variance</span><span className="amount">{formatVariance(result.variance)}</span></div>
          )}
        </div>

        <button className="btn btn-primary" onClick={onAnother}>Submit another claim</button>
      </div>
    </div>
  )
}

function formatVariance(variance) {
  const n = Number(variance)
  if (Number.isNaN(n)) return '—'
  // Server may return variance as a ratio (0.18) or a percentage (18) --
  // display defensively either way rather than guessing one shape.
  const pct = Math.abs(n) <= 1 ? n * 100 : n
  return `${pct.toFixed(1)}%`
}

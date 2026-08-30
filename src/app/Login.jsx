import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { PulseIcon } from '../components/icons.jsx'

export default function Login() {
  const { signIn, session, profile, loading, error, wakingUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // Already signed in and role resolved -- go straight to their app
  // rather than showing the form again.
  if (!loading && session && profile) {
    navigate('/' + profile.role, { replace: true })
  }

  // Signed in + not loading + no profile + a real error means the
  // profile fetch failed for a reason that ISN'T a cold start (already
  // retried and given up, or a real 403/role problem) -- see
  // AuthContext's loadProfile for the retry logic that runs before this.
  const showProfileError = !loading && session && !profile && error && !wakingUp

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await signIn(email, password)
      // AuthContext's onAuthStateChange picks up the new session and
      // resolves the role; this component re-renders and the redirect
      // above fires once that finishes -- no manual navigation here.
    } catch (err) {
      setFormError(err.message || 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="scaffold-screen">
      <p className="eyebrow">LAFIYA</p>
      <h1>Sign in</h1>

      {wakingUp && (
        <div className="ledger-card" style={{ textAlign: 'left', marginTop: 16, marginBottom: 16, borderLeftColor: 'var(--brass)' }}>
          <div className="action-loader" style={{ padding: '16px 4px' }} role="status" aria-live="polite">
            <div className="action-loader-mark" style={{ borderColor: 'var(--brass)', color: 'var(--brass)' }}>
              <PulseIcon />
            </div>
            <div>
              <p className="action-loader-label">Waking up the server…</p>
              <p className="action-loader-sub">First sign-in after idle can take up to a minute</p>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 4 }}>
            Free hosting sleeps after ~15 minutes idle -- no need to retry
            manually, this will pick up automatically once it's awake.
          </p>
        </div>
      )}

      {showProfileError && (
        <div
          className="ledger-card alert"
          style={{ textAlign: 'left', marginTop: 16, marginBottom: 16 }}
        >
          <strong style={{ fontSize: 13 }}>Signed in, but couldn't load your account</strong>
          <p className="muted" style={{ marginTop: 6 }}>{error}</p>
          <p className="muted" style={{ marginTop: 6 }}>
            This usually means the account has no linked role, or the
            backend rejected the request outright -- not a wrong password,
            and not just a cold start (that's already been retried).
          </p>
        </div>
      )}

      {session && loading && !profile && !wakingUp && (
        <div style={{ marginTop: 16 }} aria-busy="true" aria-label="Checking your account">
          <div className="loader-row" style={{ marginBottom: 10 }}>
            <span className="loader-stamp"><span /><span /><span /></span>
            Checking your account…
          </div>
          <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: 24 }}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {formError && (
          <p className="muted" style={{ color: 'var(--stamp)', marginBottom: 12 }}>
            {formError}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

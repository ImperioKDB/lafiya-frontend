import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'

export default function Login() {
  const { signIn, session, profile, loading, error } = useAuth()
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

  // FIX: previously this state was silent -- sign-in itself can
  // succeed while the follow-up GET /api/me call fails (backend not
  // deployed yet, CORS mismatch, account has no chw/doctor/pharmacy
  // row). That left the button doing nothing visible with no error
  // shown, which is worse than a clear failure. Signed in + not
  // loading + no profile + a real error means exactly that case.
  const showProfileError = !loading && session && !profile && error

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

      {showProfileError && (
        <div
          className="ledger-card alert"
          style={{ textAlign: 'left', marginTop: 16, marginBottom: 16 }}
        >
          <strong style={{ fontSize: 13 }}>Signed in, but couldn't load your account</strong>
          <p className="muted" style={{ marginTop: 6 }}>{error}</p>
          <p className="muted" style={{ marginTop: 6 }}>
            This usually means the backend's /api/me endpoint isn't reachable yet
            (not deployed, or a CORS mismatch) -- not a wrong password.
          </p>
        </div>
      )}

      {session && loading && !profile && (
        <p className="muted" style={{ marginTop: 16 }}>Checking your account…</p>
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

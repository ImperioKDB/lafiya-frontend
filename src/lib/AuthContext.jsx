import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { apiFetch } from './apiClient.js'

const AuthContext = createContext(null)

// Render's free tier sleeps after ~15 min idle; the first request after
// that can take 20-50s to get a response while the instance wakes up.
// A raw fetch() to a not-yet-listening server throws a generic
// "Failed to fetch" / "NetworkError" -- that specific failure mode gets
// retried with backoff. A real HTTP error (403 for no role row, etc.)
// comes back from apiFetch with a proper status-derived message and
// fails immediately instead -- retrying that would just hide a real
// problem behind 30+ seconds of spinning.
const MAX_COLD_START_RETRIES = 4
const RETRY_DELAYS_MS = [3000, 6000, 10000, 15000]

function looksLikeColdStart(message) {
  return /failed to fetch|networkerror|load failed/i.test(message || '')
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // { id, email, role, role_row_id }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wakingUp, setWakingUp] = useState(false)

  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true

    supabase.auth.getSession().then(({ data }) => {
      if (!activeRef.current) return
      setSession(data.session)
      if (data.session) {
        loadProfile(data.session.access_token)
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        loadProfile(newSession.access_token)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      activeRef.current = false
      listener.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(accessToken, attempt = 0) {
    if (attempt === 0) {
      setLoading(true)
      setError(null)
      setWakingUp(false)
    }
    try {
      const me = await apiFetch('/api/me', { accessToken })
      if (!activeRef.current) return
      setProfile(me)
      setWakingUp(false)
      setLoading(false)
    } catch (e) {
      if (!activeRef.current) return

      if (looksLikeColdStart(e.message) && attempt < MAX_COLD_START_RETRIES) {
        setWakingUp(true)
        const delay = RETRY_DELAYS_MS[attempt]
        setTimeout(() => {
          if (activeRef.current) loadProfile(accessToken, attempt + 1)
        }, delay)
        return // stay in loading state -- not a final failure yet
      }

      // A signed-in Supabase user with no chws/doctors/pharmacies row
      // and no ADMIN_EMAILS match gets a 403 here -- matches
      // app/core/auth.py's get_current_user exactly. Surfacing that
      // message rather than a generic "something went wrong."
      setError(e.message)
      setProfile(null)
      setWakingUp(false)
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = {
    session,
    profile,
    loading,
    error,
    wakingUp,
    accessToken: session?.access_token || null,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

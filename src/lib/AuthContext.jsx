import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { apiFetch } from './apiClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // { id, email, role, role_row_id }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
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
      active = false
      listener.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(accessToken) {
    setLoading(true)
    setError(null)
    try {
      const me = await apiFetch('/api/me', { accessToken })
      setProfile(me)
    } catch (e) {
      // A signed-in Supabase user with no chws/doctors/pharmacies row
      // and no ADMIN_EMAILS match gets a 403 here -- matches
      // app/core/auth.py's get_current_user exactly. Surfacing that
      // message rather than a generic "something went wrong."
      setError(e.message)
      setProfile(null)
    } finally {
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
    signIn,
    signOut,
    accessToken: session ? session.access_token : null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Every authenticated backend endpoint expects a Supabase JWT as a
// Bearer token (app/core/auth.py's get_current_user) -- this wrapper is
// the one place that contract lives on the frontend, so it can't drift
// per-call the way it would if every component built its own fetch.
export async function apiFetch(path, { method = 'GET', body, accessToken } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Request failed: ${response.status}`)
  }

  // USSD-style plain-text responses don't apply here -- every real
  // endpoint on this backend returns JSON.
  return response.json()
}

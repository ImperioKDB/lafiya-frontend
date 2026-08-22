import { apiFetch } from '../../lib/apiClient.js'

// ASSUMPTION -- confirm before demo day. Backend source wasn't available
// in this session, so these paths are inferred from the blueprint's API
// design (SS12) and 00_START_HERE.md, not read off the live FastAPI
// router. Two things specifically need confirming against
// lafiya-backend:
//   1. Does GET /api/patients (no id) exist, and does it return a list
//      scoped to the calling CHW via RLS, or does it need a query param?
//   2. What's the real path for the CHW earnings ledger -- README.md
//      references it as "GET .../earnings" without spelling out the
//      prefix.
// Both are isolated to this one file so a path fix is a one-line change,
// not a hunt through components.
const ENDPOINTS = {
  patients: '/api/patients',
  earnings: '/api/chw/earnings',
}

// A 404 here means "this endpoint doesn't exist yet on the backend,"
// which is a different UI state from "it exists and returned zero
// rows" -- collapsing them would misreport a real empty state as a
// wiring gap, or vice versa.
async function safeFetch(path, accessToken) {
  try {
    const data = await apiFetch(path, { accessToken })
    return { data, notBuilt: false }
  } catch (err) {
    if (String(err.message).includes('404')) {
      return { data: null, notBuilt: true }
    }
    throw err
  }
}

export async function fetchChwDashboard(accessToken) {
  const [patients, earnings] = await Promise.all([
    safeFetch(ENDPOINTS.patients, accessToken),
    safeFetch(ENDPOINTS.earnings, accessToken),
  ])
  return { patients, earnings }
}

// ASSUMPTION -- confirm against the live router. Body shape assumed
// from patients' columns (blueprint SS11) minus server-set fields
// (id, registered_by_chw_id, created_at). `nin` stays optional --
// simulated per the locked decision in 00_START_HERE.md, never
// blocking submission.
export async function registerPatient(payload, accessToken) {
  return apiFetch(ENDPOINTS.patients, {
    method: 'POST',
    accessToken,
    body: {
      full_name: payload.fullName,
      phone: payload.phone,
      age: payload.age ? Number(payload.age) : null,
      nin: payload.nin || null,
    },
  })
}

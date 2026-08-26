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
  consultations: '/api/consultations',
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

export async function fetchEarnings(accessToken) {
  const { data, notBuilt } = await safeFetch(ENDPOINTS.earnings, accessToken)
  return { earnings: Array.isArray(data) ? data : [], notBuilt }
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

// ---------------------------------------------------------------------
// Triage
// ---------------------------------------------------------------------
// ASSUMPTION -- the biggest unconfirmed guess in this codebase so far.
// The blueprint's API design (SS12) documents POST /api/consultations
// but never specifies an audio-upload contract -- no separate
// transcribe endpoint, no documented multipart shape. Two real
// possibilities exist server-side and I can't tell which from the docs
// alone: (a) this one endpoint accepts an audio file, runs Whisper +
// the rule-based scorer, and returns the transcript/urgency_score, or
// (b) transcription happens elsewhere and this endpoint only wants
// pre-scored text. Both submission paths below hit the SAME endpoint
// with different content types so whichever shape is right, only one
// function needs editing once you've checked the live router --
// nothing in the component needs to change.
//
// CONFIRMED this pass: it's (b). The live backend only ever accepts a
// JSON body (see app/models/consultation.py / app/api/consultations.py)
// -- there is no audio/Whisper handling wired up yet. Posting the
// multipart audio blob to this endpoint 500'd the backend outright (a
// real crash, now fixed server-side) and now returns a clean 415
// explaining voice isn't live yet. submitVoiceTriage is left in place
// since the recording UI still works and the backend now fails it
// honestly, but there is no working voice path end-to-end yet -- only
// submitTextTriage actually succeeds.

export async function fetchPatients(accessToken) {
  const { data, notBuilt } = await safeFetch(ENDPOINTS.patients, accessToken)
  return { patients: Array.isArray(data) ? data : [], notBuilt }
}

// Voice path: raw fetch, not apiFetch, since apiFetch always
// JSON.stringifies the body -- multipart/form-data needs the browser to
// set its own boundary'd Content-Type, which only happens if we don't
// set one manually.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function submitVoiceTriage(patientId, audioBlob, accessToken) {
  const form = new FormData()
  form.append('patient_id', patientId)
  form.append('audio', audioBlob, 'triage-audio.webm')

  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.consultations}`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
  })
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Request failed: ${response.status}`)
  }
  return response.json()
}

// Text fallback path: plain JSON, used when mic access is unavailable
// or denied, or the CHW simply prefers typing. Keeps the same urgency
// scorer in play per the blueprint's "single source of truth" note --
// the scorer just runs against typed text instead of a transcript.
// symptom_category is intentionally omitted -- the backend now defaults
// it to "other" when absent (see app/models/consultation.py), since
// this screen has no category-picker UI. Flagged there as a decision,
// not silently assumed; revisit if a real picker gets added here.
export async function submitTextTriage(patientId, transcript, accessToken) {
  return apiFetch(ENDPOINTS.consultations, {
    method: 'POST',
    accessToken,
    body: { patient_id: patientId, transcript },
  })
}

// ---------------------------------------------------------------------
// Loans & Guarantors
// ---------------------------------------------------------------------
// ASSUMPTION -- same caveat as Triage's audio contract, and this one's
// the bigger guess of the two. SS12 documents POST /api/loans, GET
// /api/loans/:id/status, and POST /api/loans/:id/guarantors -- but
// there's no documented endpoint anywhere in the blueprint for
// TRIGGERING the Wema/ALAT lookup or the simulated disbursement. It's
// possible the backend does this automatically once both guarantors
// confirm (a DB trigger or a background job), in which case
// disburseLoan() below is simply unnecessary and this screen should
// just keep polling loan status instead of calling it. Confirm which
// model the backend actually uses before relying on the disburse
// button in a demo -- worth checking loans.status transitions in
// Supabase directly if unsure.

const LOAN_ENDPOINTS = {
  loans: '/api/loans',
}

export async function createLoan(patientId, tierAmount, accessToken) {
  return apiFetch(LOAN_ENDPOINTS.loans, {
    method: 'POST',
    accessToken,
    body: { patient_id: patientId, tier: tierAmount, amount: tierAmount },
  })
}

// CONFIRMED against the live backend (app/models/loan.py
// GuarantorAttach) -- the real request body is a flat array under
// guarantor_phones, e.g. { guarantor_phones: ["...", "..."] }. This
// previously sent a nested { guarantors: [{ guarantor_phone }] } shape
// that was never right, which is exactly why every attempt to attach
// guarantors 422'd.
export async function attachGuarantors(loanId, phones, accessToken) {
  return apiFetch(`${LOAN_ENDPOINTS.loans}/${loanId}/guarantors`, {
    method: 'POST',
    accessToken,
    body: { guarantor_phones: phones },
  })
}

export async function fetchLoanStatus(loanId, accessToken) {
  return apiFetch(`${LOAN_ENDPOINTS.loans}/${loanId}/status`, { accessToken })
}

// ASSUMPTION -- no documented endpoint for this trigger anywhere in the
// blueprint. This is a guess at the path; see the note above this
// section before wiring a demo around it.
export async function disburseLoan(loanId, accessToken) {
  return apiFetch(`${LOAN_ENDPOINTS.loans}/${loanId}/disburse`, {
    method: 'POST',
    accessToken,
  })
}

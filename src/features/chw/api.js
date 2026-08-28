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

export async function fetchPatients(accessToken) {
  const { data, notBuilt } = await safeFetch(ENDPOINTS.patients, accessToken)
  return { patients: Array.isArray(data) ? data : [], notBuilt }
}

// ---------------------------------------------------------------------
// Triage
// ---------------------------------------------------------------------
// POST /api/consultations now takes multipart/form-data always (backend
// switched off a JSON body -- FastAPI can't mix a JSON body with an
// UploadFile on the same route). `symptom_category` is required on
// BOTH paths below -- it's validated server-side against the exact same
// five categories the USSD numeric menu uses (Master Build Spec SS9),
// never left to fall through to a bare "other" default. This was
// previously missing entirely from the text-triage call, which meant
// that path would have 422'd against the live backend's required field
// the first time it was actually exercised.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function postConsultationForm(form, accessToken) {
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

// Voice path -- audio blob goes to the backend, which runs it through
// Whisper server-side (app/services/whisper_client.py) and scores the
// resulting transcript. No transcript is ever sent from the client on
// this path -- the server-side transcript is the only one that's ever
// trusted, same "never trust the client for anything that matters"
// pattern as fee math elsewhere in this build.
export async function submitVoiceTriage(patientId, symptomCategory, audioBlob, accessToken) {
  const form = new FormData()
  form.append('patient_id', patientId)
  form.append('symptom_category', symptomCategory)
  form.append('audio', audioBlob, 'triage-audio.webm')
  return postConsultationForm(form, accessToken)
}

// Text fallback path -- used when mic access is unavailable or denied,
// or the CHW simply prefers typing. Keeps the same urgency scorer in
// play per the blueprint's "single source of truth" note -- the scorer
// just runs against typed text instead of a transcript. No `audio`
// field is appended, so the backend skips the Whisper call entirely.
export async function submitTextTriage(patientId, symptomCategory, transcript, accessToken) {
  const form = new FormData()
  form.append('patient_id', patientId)
  form.append('symptom_category', symptomCategory)
  form.append('transcript', transcript)
  return postConsultationForm(form, accessToken)
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

export async function attachGuarantors(loanId, phones, accessToken) {
  return apiFetch(`${LOAN_ENDPOINTS.loans}/${loanId}/guarantors`, {
    method: 'POST',
    accessToken,
    body: { guarantors: phones.map((phone) => ({ guarantor_phone: phone })) },
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

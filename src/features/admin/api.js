import { apiFetch } from '../../lib/apiClient.js'

const ENDPOINTS = {
  fraudFlags: '/api/fraud-flags',
  pharmacies: '/api/pharmacies',
}

// Fraud flags: directly documented in the blueprint's API design (SS12)
// -- GET /api/fraud-flags?status=open, PATCH /api/fraud-flags/:id.
// Also checked live: fraud_flags' status CHECK constraint matches the
// blueprint exactly this time (open/reviewed/cleared/confirmed_fraud,
// no drift like disbursement_claims had). High confidence.
export async function fetchOpenFraudFlags(accessToken) {
  return apiFetch(`${ENDPOINTS.fraudFlags}?status=open`, { accessToken })
}
export async function updateFraudFlagStatus(id, status, accessToken) {
  return apiFetch(`${ENDPOINTS.fraudFlags}/${id}`, { method: 'PATCH', accessToken, body: { status } })
}

// Pharmacy verification: ASSUMPTION -- SS12 documents no endpoint for
// this at all, unlike fraud flags. GET .../pharmacies?status=pending
// and PATCH .../pharmacies/:id are guesses mirroring the fraud-flags
// shape, not confirmed. Also checked live: the `pharmacies` table does
// NOT have the verified_by/rejection_reason columns Master Build Spec
// SS7 planned to add -- only id/auth_user_id/name/license_number/
// document_url/status/created_at exist today. So this UI deliberately
// has no rejection-reason field; adding one now would target a column
// that doesn't exist.
export async function fetchPendingPharmacies(accessToken) {
  return apiFetch(`${ENDPOINTS.pharmacies}?status=pending`, { accessToken })
}
export async function updatePharmacyStatus(id, status, accessToken) {
  return apiFetch(`${ENDPOINTS.pharmacies}/${id}`, { method: 'PATCH', accessToken, body: { status } })
}

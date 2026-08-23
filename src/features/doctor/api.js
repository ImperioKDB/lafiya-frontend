import { apiFetch } from '../../lib/apiClient.js'

const ENDPOINTS = {
  queue: '/api/consultations/queue',
  consultation: (id) => `/api/consultations/${id}`,
}

// These two are directly documented in the blueprint's API design (SS12)
// -- meaningfully more confident than Triage's audio contract or Loans'
// disbursement trigger, which had no documentation to go on at all.
//
// One real assumption remains: whether queue items come back with
// patient info joined in (patient_name/patient_phone) or just a bare
// patient_id. The component below falls back gracefully either way,
// but confirm the actual shape against the live response before a demo
// -- a doctor needs to know who they're treating, so this matters.

export async function fetchQueue(accessToken) {
  const data = await apiFetch(ENDPOINTS.queue, { accessToken })
  const list = Array.isArray(data) ? data : []
  // Belt-and-suspenders client-side sort even though the endpoint's
  // name implies it's already urgency-sorted server-side.
  return [...list].sort((a, b) => (b.urgency_score ?? 0) - (a.urgency_score ?? 0))
}

export async function completeConsultation(id, { prescription, costEstimate }, accessToken) {
  return apiFetch(ENDPOINTS.consultation(id), {
    method: 'PATCH',
    accessToken,
    body: {
      prescription,
      cost_estimate: costEstimate,
      status: 'completed',
    },
  })
}

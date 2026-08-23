import { apiFetch } from '../../lib/apiClient.js'

const ENDPOINTS = {
  claims: '/api/claims',
}

// Unlike Triage/Loans, this one got de-risked by actually checking the
// live database instead of guessing from the blueprint alone. A direct
// query against pg_policies showed no RLS policy lets the pharmacy role
// SELECT from `loans` -- only the registering CHW can. So this
// deliberately skips a "look up the loan first" step (which SS12 never
// documented an endpoint for anyway) and submits directly: the pharmacy
// enters the loan reference + amount dispensed, and the server -- which
// already knows the doctor's cost estimate for that loan -- computes
// variance and returns the match result in one round trip.
//
// pharmacy_id is deliberately NOT sent from the client -- same pattern
// as CHW registration not sending registered_by_chw_id. The server
// resolves it from the authenticated pharmacy's own row, consistent
// with the blueprint's "never trust client-computed fee/liability math"
// rule (Security SS14) extended to identity fields too.
//
// match_status values ARE confirmed live (checked the actual CHECK
// constraint on disbursement_claims, not the blueprint's prose, since
// 00_START_HERE.md already flagged this table as one where the blueprint
// had drifted from what's really in the DB): 'pending' | 'matched' |
// 'variance_flagged' -- note it's variance_flagged, not just "flagged".

export async function submitClaim(loanId, claimAmount, accessToken) {
  return apiFetch(ENDPOINTS.claims, {
    method: 'POST',
    accessToken,
    body: { loan_id: loanId, claim_amount: claimAmount },
  })
}

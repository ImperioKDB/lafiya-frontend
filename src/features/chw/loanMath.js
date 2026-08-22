export const LOAN_TIERS = [2500, 5000, 10000, 20000, 40000]

// Preview only, for the tier-selection UI. The server computes and owns
// the authoritative fee/repayable amounts (blueprint Security SS14:
// "All fee/liability math computed server-side, never trusted from
// client payload"). This mirrors the locked 5% flat-fee decision so the
// preview matches what the server should return, but the loan object
// from POST /api/loans -- not this function -- is what actually gets
// displayed and stored once a loan exists.
export function estimateFee(amount) {
  return Math.round(amount * 0.05)
}
export function estimateTotal(amount) {
  return amount + estimateFee(amount)
}

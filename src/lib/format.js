export function formatNaira(amount) {
  const n = Number(amount)
  if (Number.isNaN(n)) return '\u20a60'
  return '\u20a6' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

// Blueprint SS8's "sequential ledger entry numbers" signature element --
// legitimate here because registration order is real data, not
// decoration. Pads to 4 digits, matching the mockup's "No. 0038" style.
export function formatEntryNumber(n) {
  return 'No. ' + String(n).padStart(4, '0')
}

export function greetingWord(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Falls back to the local-part of an email when a display name isn't
// available (profile from GET /api/me only carries id/email/role/role_row_id
// today -- no full_name yet).
export function displayNameFromEmail(email) {
  if (!email) return 'there'
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { fetchPatients, createLoan, attachGuarantors, fetchLoanStatus, disburseLoan } from './api.js'
import { LOAN_TIERS, estimateFee, estimateTotal } from './loanMath.js'
import { formatNaira } from '../../lib/format.js'
import {
  AlertIcon,
  ChevronRightIcon,
  SearchIcon,
  PhoneIcon,
  BankIcon,
  CheckIcon,
} from '../../components/icons.jsx'

const STEP = {
  PICK: 'pick',
  TIER: 'tier',
  CREATING: 'creating',
  GUARANTORS: 'guarantors',
  AWAITING: 'awaiting',
  DISBURSING: 'disbursing',
  DONE: 'done',
  ERROR: 'error',
}

export default function LoansScreen() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(STEP.PICK)
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientsGap, setPatientsGap] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const [selectedTier, setSelectedTier] = useState(null)
  const [loan, setLoan] = useState(null)
  const [guarantors, setGuarantors] = useState([])
  const [phone1, setPhone1] = useState('')
  const [phone2, setPhone2] = useState('')
  const [disbursement, setDisbursement] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [errorStep, setErrorStep] = useState(null)

  const pollRef = useRef(null)

  useEffect(() => {
    let active = true
    fetchPatients(accessToken).then(({ patients: p, notBuilt }) => {
      if (!active) return
      setPatients(p)
      setPatientsGap(notBuilt)
      setPatientsLoading(false)
    })
    return () => { active = false }
  }, [accessToken])

  // Poll loan status every 8s while awaiting guarantor confirmation --
  // matches the blueprint's "SMS sent, awaiting reply" loading state
  // (SS17), since confirmation itself happens outside this app, via the
  // guarantor's SMS link or USSD.
  useEffect(() => {
    if (step !== STEP.AWAITING || !loan) return
    async function poll() {
      try {
        const status = await fetchLoanStatus(loan.id, accessToken)
        setGuarantors(Array.isArray(status.guarantors) ? status.guarantors : guarantors)
      } catch {
        // Silent on poll failure -- the manual refresh button surfaces
        // a real error if the person actually asks for a refresh.
      }
    }
    poll()
    pollRef.current = setInterval(poll, 8000)
    return () => clearInterval(pollRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, loan])

  function goToError(message, fromStep) {
    setErrorMessage(message)
    setErrorStep(fromStep)
    setStep(STEP.ERROR)
  }

  async function handleCreateLoan() {
    setStep(STEP.CREATING)
    try {
      const created = await createLoan(selectedPatient.id, selectedTier, accessToken)
      setLoan(created)
      setStep(STEP.GUARANTORS)
    } catch (err) {
      goToError(err.message || 'Could not create the loan.', STEP.TIER)
    }
  }

  async function handleAttachGuarantors(e) {
    e.preventDefault()
    try {
      const attached = await attachGuarantors(loan.id, [phone1, phone2], accessToken)
      setGuarantors(Array.isArray(attached) ? attached : [
        { guarantor_phone: phone1, status: 'pending' },
        { guarantor_phone: phone2, status: 'pending' },
      ])
      setStep(STEP.AWAITING)
    } catch (err) {
      goToError(err.message || 'Could not send guarantor confirmations.', STEP.GUARANTORS)
    }
  }

  async function handleDisburse() {
    setStep(STEP.DISBURSING)
    try {
      const result = await disburseLoan(loan.id, accessToken)
      setDisbursement(result)
      setStep(STEP.DONE)
    } catch (err) {
      goToError(err.message || 'Could not complete the Wema lookup and disbursement.', STEP.AWAITING)
    }
  }

  function resetAll() {
    setStep(STEP.PICK)
    setSelectedPatient(null)
    setSelectedTier(null)
    setLoan(null)
    setGuarantors([])
    setPhone1('')
    setPhone2('')
    setDisbursement(null)
  }

  const filteredPatients = patients.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (p.full_name || '').toLowerCase().includes(q) || (p.phone || '').includes(q)
  })

  const bothConfirmed = guarantors.length === 2 && guarantors.every((g) => g.status === 'confirmed')
  const anyDeclined = guarantors.some((g) => g.status === 'declined')

  return (
    <div>
      <h1 className="page-title">Loan &amp; Guarantors</h1>
      <p className="page-subtitle">Tiered loan, two-guarantor confirmation, Wema lookup.</p>
      <div style={{ height: 20 }} />

      {step === STEP.PICK && (
        <PickPatientStep
          loading={patientsLoading}
          patients={filteredPatients}
          gap={patientsGap}
          search={search}
          onSearch={setSearch}
          onPick={(p) => { setSelectedPatient(p); setStep(STEP.TIER) }}
        />
      )}

      {step === STEP.TIER && (
        <TierStep
          patient={selectedPatient}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          onContinue={handleCreateLoan}
        />
      )}

      {step === STEP.CREATING && <InlineLoader label="Creating loan…" />}

      {step === STEP.GUARANTORS && (
        <GuarantorsStep
          loan={loan}
          phone1={phone1}
          phone2={phone2}
          onPhone1={setPhone1}
          onPhone2={setPhone2}
          onSubmit={handleAttachGuarantors}
        />
      )}

      {step === STEP.AWAITING && (
        <AwaitingStep
          guarantors={guarantors}
          bothConfirmed={bothConfirmed}
          anyDeclined={anyDeclined}
          onRefresh={async () => {
            try {
              const status = await fetchLoanStatus(loan.id, accessToken)
              setGuarantors(Array.isArray(status.guarantors) ? status.guarantors : guarantors)
            } catch (err) {
              goToError(err.message || 'Could not refresh guarantor status.', STEP.AWAITING)
            }
          }}
          onRetryGuarantors={() => { setPhone1(''); setPhone2(''); setStep(STEP.GUARANTORS) }}
          onDisburse={handleDisburse}
        />
      )}

      {step === STEP.DISBURSING && <InlineLoader label="Checking Wema/ALAT and disbursing…" />}

      {step === STEP.DONE && disbursement && (
        <DisburseResult disbursement={disbursement} loan={loan} onDone={() => navigate('/chw')} onAnother={resetAll} />
      )}

      {step === STEP.ERROR && (
        <div className="state-block error" role="alert">
          <AlertIcon className="state-icon" />
          <p className="state-title">Something went wrong</p>
          <p className="state-desc">{errorMessage}</p>
          <button className="btn btn-primary" onClick={() => setStep(errorStep || STEP.PICK)}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

function InlineLoader({ label }) {
  return (
    <div className="loader-row" style={{ justifyContent: 'center', padding: '40px 0' }}>
      <span className="loader-stamp"><span /><span /><span /></span>
      {label}
    </div>
  )
}

function PickPatientStep({ loading, patients, gap, search, onSearch, onPick }) {
  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    )
  }
  return (
    <div>
      <p className="section-label">Select patient</p>
      {gap ? (
        <div className="state-block notice">
          <AlertIcon className="state-icon" />
          <p className="state-title">Patient list isn't wired up yet</p>
          <p className="state-desc">Confirm GET /api/patients against the live backend to use this screen.</p>
        </div>
      ) : (
        <>
          <div className="field" style={{ position: 'relative' }}>
            <SearchIcon style={{ position: 'absolute', left: 12, top: 12, width: 18, height: 18, color: 'var(--ink-soft)' }} />
            <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or phone" style={{ paddingLeft: 38 }} />
          </div>
          {patients.length === 0 ? (
            <div className="state-block">
              <p className="state-title">No patients found</p>
              <p className="state-desc">Register a patient before starting a loan.</p>
            </div>
          ) : (
            patients.map((p, i) => (
              <div
                key={p.id}
                className="ledger-card patient-pick stagger-in"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => onPick(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(p)}
              >
                <div className="entry-row">
                  <div className="entry-avatar">{initials(p.full_name)}</div>
                  <div className="entry-body">
                    <div className="entry-name">{p.full_name || 'Unnamed patient'}</div>
                    <div className="entry-meta">{p.phone || 'no phone on file'}</div>
                  </div>
                  <ChevronRightIcon style={{ width: 18, height: 18, color: 'var(--ink-soft)', flexShrink: 0 }} />
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}

function TierStep({ patient, selectedTier, onSelectTier, onContinue }) {
  return (
    <div>
      {patient && (
        <div className="ledger-card" style={{ marginBottom: 18 }}>
          <p className="ledger-number" style={{ margin: 0 }}>LOAN FOR</p>
          <p style={{ margin: '3px 0 0', fontWeight: 600 }}>{patient.full_name}</p>
        </div>
      )}
      <p className="section-label">Select tier</p>
      {LOAN_TIERS.map((amount) => (
        <div
          key={amount}
          className={'ledger-card finance tier-card' + (selectedTier === amount ? ' selected' : '')}
          onClick={() => onSelectTier(amount)}
          role="radio"
          aria-checked={selectedTier === amount}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectTier(amount)}
        >
          <div>
            <div className="tier-amount tabular">{formatNaira(amount)}</div>
            <div className="tier-meta">+{formatNaira(estimateFee(amount))} fee (5%)</div>
          </div>
          <div className="tier-radio" />
        </div>
      ))}

      {selectedTier && (
        <div className="fee-summary stagger-in" style={{ marginTop: 16 }}>
          <div className="fee-row"><span>Loan amount</span><span className="amount">{formatNaira(selectedTier)}</span></div>
          <div className="fee-row"><span>Flat fee (5%)</span><span className="amount">{formatNaira(estimateFee(selectedTier))}</span></div>
          <div className="fee-row total"><span>Total repayable</span><span className="amount">{formatNaira(estimateTotal(selectedTier))}</span></div>
        </div>
      )}
      <p className="muted" style={{ marginTop: 8 }}>
        Estimate shown for reference -- the server computes the final figures.
      </p>

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={!selectedTier} onClick={onContinue}>
        Continue to guarantors
      </button>
    </div>
  )
}

function GuarantorsStep({ loan, phone1, phone2, onPhone1, onPhone2, onSubmit }) {
  const valid = isValidPhone(phone1) && isValidPhone(phone2) && phone1 !== phone2
  return (
    <div>
      {loan && (
        <div className="fee-summary" style={{ marginBottom: 20 }}>
          <div className="fee-row"><span>Loan amount</span><span className="amount">{formatNaira(loan.amount ?? loan.tier)}</span></div>
          <div className="fee-row total"><span>Total repayable</span><span className="amount">{formatNaira(loan.total_repayable ?? '')}</span></div>
        </div>
      )}
      <p className="section-label">Two guarantors</p>
      <p className="muted" style={{ marginBottom: 14 }}>
        Each carries 50% liability. They'll get an SMS to confirm or decline --
        a decline is never shared with the borrower.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Guarantor 1 phone</label>
          <input value={phone1} onChange={(e) => onPhone1(e.target.value)} placeholder="080XXXXXXXX" type="tel" />
        </div>
        <div className="field">
          <label>Guarantor 2 phone</label>
          <input value={phone2} onChange={(e) => onPhone2(e.target.value)} placeholder="080XXXXXXXX" type="tel" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!valid}>
          Send confirmations
        </button>
      </form>
    </div>
  )
}

function AwaitingStep({ guarantors, bothConfirmed, anyDeclined, onRefresh, onRetryGuarantors, onDisburse }) {
  return (
    <div>
      <p className="section-label">Guarantor confirmation</p>
      <div className="loader-row" style={{ marginBottom: 14 }}>
        <span className="loader-stamp"><span /><span /><span /></span>
        SMS sent, awaiting reply
      </div>

      {guarantors.map((g, i) => (
        <div key={i} className="ledger-card guarantor-card" style={{ marginBottom: 10 }}>
          <div className="guarantor-phone-icon"><PhoneIcon /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{g.guarantor_phone}</div>
            <div className="entry-meta">50% liability</div>
          </div>
          <span className={`stamp ${g.status}`}>
            {g.status === 'confirmed' && <CheckIcon style={{ width: 12, height: 12 }} />}
            {g.status}
          </span>
        </div>
      ))}

      {anyDeclined && (
        <div className="state-block error" style={{ marginTop: 14 }}>
          <AlertIcon className="state-icon" />
          <p className="state-title">A guarantor declined</p>
          <p className="state-desc">Ask the CHW to select a different guarantor and resend.</p>
          <button className="btn btn-primary" onClick={onRetryGuarantors}>Choose new guarantor</button>
        </div>
      )}

      {!anyDeclined && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onRefresh}>Refresh status</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!bothConfirmed} onClick={onDisburse}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

function DisburseResult({ disbursement, onDone, onAnother }) {
  return (
    <div className="stagger-in">
      <div className="state-block success" style={{ borderStyle: 'solid', borderColor: 'var(--teal-tint)', background: 'var(--teal-tint)' }}>
        <BankIcon className="state-icon" style={{ color: 'var(--teal)' }} />
        <div className="stamp disbursed" style={{ display: 'inline-flex', margin: '0 0 14px' }}>Disbursed</div>
        <p className="state-title">Loan disbursed (simulated)</p>
        <p className="state-desc">
          Wema/ALAT account verified{disbursement.account_name ? ` for ${disbursement.account_name}` : ''}.
          Real payout access is bank-side pending -- this uses the real
          payload shape, per the blueprint's access-constrained note.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onAnother}>Start another loan</button>
          <button className="btn btn-outline" onClick={onDone}>
            Dashboard
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

function isValidPhone(p) {
  return /^[0-9+\s-]{7,15}$/.test((p || '').trim())
}
function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

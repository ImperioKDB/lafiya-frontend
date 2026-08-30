import { Link } from 'react-router-dom'
import {
  RegisterIcon,
  TriageIcon,
  ClipboardIcon,
  LoansIcon,
  EarningsIcon,
  StoreIcon,
  LedgerIcon,
  UserIcon,
  ChevronRightIcon,
} from '../components/icons.jsx'
import '../styles/landing.css'

// The hero visual is a literal ledger spread, not a stock photo or a
// generic chart -- this product's whole identity is a CHW paper
// register meeting a bank passbook (blueprint SS8), so the one place
// this page spends its motion budget is a single orchestrated
// sequence of that ledger stamping through, not scattered fade-ins on
// every section.
const HERO_ENTRIES = [
  { label: 'Hauwa Abdullahi', number: 'No. 0038', status: 'Registered', stamp: 'verified' },
  { label: 'Triage scored', number: 'No. 0038', status: 'Elevated', stamp: 'confirmed' },
  { label: 'Loan approved · ₦20,000', number: 'No. 0038', status: 'Disbursed', stamp: 'disbursed' },
  { label: 'Repaid in full', number: 'No. 0038', status: 'Repaid', stamp: 'repaid' },
]

const LOOP_STEPS = [
  {
    n: '01',
    title: 'Register',
    icon: RegisterIcon,
    body: 'A CHW registers a patient in the field, offline-capable, no smartphone literacy assumed.',
  },
  {
    n: '02',
    title: 'Triage',
    icon: TriageIcon,
    body: 'Voice or USSD symptom capture feeds one rule-based urgency scorer. It sorts the queue. It never diagnoses.',
  },
  {
    n: '03',
    title: 'Consult',
    icon: ClipboardIcon,
    body: 'A remote doctor reviews the case, prescribes, and sets a cost estimate.',
  },
  {
    n: '04',
    title: 'Loan',
    icon: LoansIcon,
    body: 'Two guarantors confirm by SMS. A live Wema/ALAT sandbox call verifies the account.',
  },
  {
    n: '05',
    title: 'Repay',
    icon: EarningsIcon,
    body: 'The CHW earns commission on repayment. The doctor earns a stipend on completion.',
  },
]

const ROLES = [
  {
    icon: RegisterIcon,
    color: 'teal',
    title: 'Community health worker',
    body: 'Registers patients, captures symptoms, requests loans, and tracks a real earnings ledger.',
  },
  {
    icon: ClipboardIcon,
    color: 'indigo',
    title: 'Doctor',
    body: 'Works an urgency-sorted queue and prescribes against structured case data, not raw audio.',
  },
  {
    icon: StoreIcon,
    color: 'brass',
    title: 'Pharmacy',
    body: 'Submits claims that are matched against the doctor\'s estimate automatically.',
  },
  {
    icon: LedgerIcon,
    color: 'neutral',
    title: 'Admin',
    body: 'Verifies pharmacies and reviews fraud flags in one console, with every action logged.',
  },
]

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-wordmark">LAFIYA</span>
        <Link to="/login" className="btn btn-outline">Log in</Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-text">
          <h1>A CHW visit becomes a bank record.</h1>
          <p className="landing-hero-sub">
            LAFIYA turns a community health worker's visit into
            doctor-verified care and a guarantor-backed micro-loan, on
            Wema Bank's rails.
          </p>
          <div className="landing-hero-cta">
            <Link to="/login" className="btn btn-primary">Log in</Link>
            <a href="#loop" className="btn btn-outline">See how it works</a>
          </div>
        </div>

        <div className="landing-ledger" aria-hidden="true">
          <p className="eyebrow" style={{ margin: '0 0 12px' }}>Patient ledger</p>
          {HERO_ENTRIES.map((entry, i) => (
            <div
              key={entry.status}
              className="landing-ledger-row stagger-in"
              style={{ animationDelay: `${i * 140}ms` }}
            >
              <div>
                <p className="landing-ledger-label">{entry.label}</p>
                <p className="ledger-number" style={{ margin: '2px 0 0' }}>{entry.number}</p>
              </div>
              <span className={`stamp ${entry.stamp}`}>{entry.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="loop">
        <h2>The core loop</h2>
        <p className="landing-section-sub">
          Five steps, one ledger. USSD and the smartphone app write to
          the same tables, so a feature phone gets the same loop.
        </p>

        <div className="landing-loop">
          {LOOP_STEPS.map((step) => (
            <div key={step.n} className="ledger-card landing-loop-row">
              <span className="ledger-number landing-loop-n">No. {step.n}</span>
              <div className="landing-loop-icon"><step.icon /></div>
              <div className="landing-loop-body">
                <p className="landing-loop-title">{step.title}</p>
                <p className="muted" style={{ margin: '3px 0 0' }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>Built for four roles, one ledger.</h2>
        <p className="landing-section-sub">
          Every role writes into the same Postgres tables, scoped by
          row-level security -- not four separate apps stitched together.
        </p>

        <div className="landing-roles">
          {ROLES.map((role) => (
            <div key={role.title} className={`ledger-card landing-role-card landing-role-${role.color}`}>
              <div className={`landing-role-icon landing-role-icon-${role.color}`}>
                <role.icon />
              </div>
              <p className="landing-loop-title">{role.title}</p>
              <p className="muted" style={{ margin: '4px 0 0' }}>{role.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>What's live, and what's simulated.</h2>
        <div className="ledger-card" style={{ borderLeftColor: 'var(--brass)' }}>
          <p className="muted" style={{ margin: 0 }}>
            Voice triage, the doctor queue, guarantor SMS, and the Wema/ALAT
            account lookup are live. Loan disbursement and pharmacy payout
            use the real payload shape but move no real money, since that
            needs coordination beyond the sandbox with Wema's banking side.
            NIN verification is simulated for the same reason: it needs a
            formal NIMC agreement this build doesn't have yet.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-wordmark">LAFIYA</span>
        <Link to="/login" className="mode-toggle">
          Log in
          <ChevronRightIcon style={{ width: 15, height: 15 }} />
        </Link>
      </footer>
    </div>
  )
}

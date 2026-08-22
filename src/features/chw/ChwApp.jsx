import { Routes, Route } from 'react-router-dom'
import ChwShell from './ChwShell.jsx'
import Dashboard from './Dashboard.jsx'
import RegisterPatientScreen from './RegisterPatientScreen.jsx'
import ComingSoon from './ComingSoon.jsx'
import { TriageIcon, LoansIcon, EarningsIcon } from '../../components/icons.jsx'

// Phase 1 -> Phase 2 migration, screen by screen, per README.md's build
// order. Dashboard is real; the rest keep the same visual system
// (ledger card, stamp, section-label) so nothing feels like a dead end
// while it's being wired.
export default function ChwApp() {
  return (
    <Routes>
      <Route element={<ChwShell />}>
        <Route index element={<Dashboard />} />
        <Route path="register" element={<RegisterPatientScreen />} />
        <Route
          path="triage"
          element={
            <ComingSoon
              icon={TriageIcon}
              title="Symptom Triage"
              description="Voice capture via Whisper, feeding the same rule-based urgency scorer as the USSD path."
              endpoint="POST /api/consultations"
            />
          }
        />
        <Route
          path="loans"
          element={
            <ComingSoon
              icon={LoansIcon}
              title="Loan & Guarantors"
              description="Tier selection, live fee math, two-guarantor SMS confirmation, and the live Wema/ALAT lookup."
              endpoint="POST /api/loans"
            />
          }
        />
        <Route
          path="earnings"
          element={
            <ComingSoon
              icon={EarningsIcon}
              title="Earnings Ledger"
              description="Registration fees and repayment commission, itemized by status."
              endpoint="GET /api/chw/earnings"
            />
          }
        />
      </Route>
    </Routes>
  )
}

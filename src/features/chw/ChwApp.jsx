import { Routes, Route } from 'react-router-dom'
import ChwShell from './ChwShell.jsx'
import Dashboard from './Dashboard.jsx'
import RegisterPatientScreen from './RegisterPatientScreen.jsx'
import TriageScreen from './TriageScreen.jsx'
import LoansScreen from './LoansScreen.jsx'
import ComingSoon from './ComingSoon.jsx'
import { EarningsIcon } from '../../components/icons.jsx'

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
        <Route path="triage" element={<TriageScreen />} />
        <Route path="loans" element={<LoansScreen />} />
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

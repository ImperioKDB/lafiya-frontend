import { Routes, Route } from 'react-router-dom'
import ChwShell from './ChwShell.jsx'
import Dashboard from './Dashboard.jsx'
import RegisterPatientScreen from './RegisterPatientScreen.jsx'
import TriageScreen from './TriageScreen.jsx'
import LoansScreen from './LoansScreen.jsx'
import EarningsScreen from './EarningsScreen.jsx'

// Phase 1 -> Phase 2 migration, screen by screen, per README.md's build
// order. All 5 CHW screens are now real components -- ComingSoon.jsx
// stays in the repo (unused for now) since the same pattern applies
// to Doctor/Pharmacy/Admin screens next.
export default function ChwApp() {
  return (
    <Routes>
      <Route element={<ChwShell />}>
        <Route index element={<Dashboard />} />
        <Route path="register" element={<RegisterPatientScreen />} />
        <Route path="triage" element={<TriageScreen />} />
        <Route path="loans" element={<LoansScreen />} />
        <Route path="earnings" element={<EarningsScreen />} />
      </Route>
    </Routes>
  )
}

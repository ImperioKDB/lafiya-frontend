import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { displayNameFromEmail, greetingWord } from '../../lib/format.js'
import {
  DashboardIcon,
  RegisterIcon,
  TriageIcon,
  LoansIcon,
  EarningsIcon,
  PlusIcon,
  LogoutIcon,
} from '../../components/icons.jsx'
import './chw.css'

const NAV_ITEMS = [
  { to: '/chw', label: 'Home', icon: DashboardIcon, end: true },
  { to: '/chw/register', label: 'Register', icon: RegisterIcon },
  { to: '/chw/triage', label: 'Triage', icon: TriageIcon },
  { to: '/chw/loans', label: 'Loans', icon: LoansIcon },
  { to: '/chw/earnings', label: 'Earnings', icon: EarningsIcon },
]

export default function ChwShell() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="chw-shell">
      <header className="chw-header">
        <div className="chw-header-inner">
          <div>
            <p className="eyebrow chw-greeting-eyebrow">{greetingWord()}</p>
            <p className="chw-greeting-name">
              {displayNameFromEmail(profile?.email)}
            </p>
          </div>
          <button
            type="button"
            className="chw-header-action"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>

      <div className="chw-content">
        <Outlet />
      </div>

      <button
        type="button"
        className="chw-fab"
        onClick={() => navigate('/chw/register')}
        aria-label="Register a new patient"
        title="Register patient"
      >
        <PlusIcon />
      </button>

      <nav className="chw-bottom-nav" aria-label="CHW navigation">
        <ul className="chw-nav-list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', width: '100%' }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} style={{ flex: 1 }}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => 'chw-nav-item' + (isActive ? ' active' : '')}
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

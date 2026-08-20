import { useAuth } from '../lib/AuthContext.jsx'

export default function SignOutButton() {
  const { signOut } = useAuth()
  return (
    <button className="btn btn-outline" onClick={signOut} style={{ marginTop: 16 }}>
      Sign out
    </button>
  )
}

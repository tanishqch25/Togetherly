import { ChevronDown, HeartHandshake, LogOut, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useData } from '../../context/useData'
import Avatar from '../ui/Avatar'
import Menu from '../ui/Menu'

function Row({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-3xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive ? 'bg-rose-100 text-rose-800' : 'text-ink-900 hover:bg-cream-200'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0 text-rose-700" aria-hidden />
      {children}
    </NavLink>
  )
}

/** The two avatars in the header. They are the account entry point, not decoration. */
export default function AccountMenu() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { currentUser, partner } = useData()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <Menu
      rootClassName="static"
      label="Your account"
      className="flex items-center gap-1 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-cream-200"
      trigger={
        <>
          <span className="flex items-center -space-x-2.5">
            <Avatar
              src={currentUser.avatarUrl}
              initials={currentUser.initials}
              name={currentUser.name}
              size="sm"
              ring
            />
            <Avatar src={partner.avatarUrl} initials={partner.initials} name={partner.name} size="sm" ring />
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-500" aria-hidden />
        </>
      }
    >
      <div className="border-b border-cream-200 px-4 py-3">
        <p className="truncate text-sm font-semibold text-ink-900">{currentUser.name}</p>
        <p className="truncate text-xs text-ink-500">
          {currentUser.city} · with {partner.name}
        </p>
      </div>

      <div className="space-y-0.5 p-1.5">
        <Row to="/app/profile" icon={HeartHandshake}>
          Your profile
        </Row>
        <Row to="/app/settings" icon={Settings}>
          Settings &amp; Privacy
        </Row>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-3xl px-3 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-cream-200"
        >
          <LogOut className="h-4 w-4 shrink-0 text-rose-700" aria-hidden />
          Log out
        </button>
      </div>
    </Menu>
  )
}

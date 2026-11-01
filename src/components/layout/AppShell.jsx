import { BookOpen, Heart, Home, Link2 } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import AccountMenu from './AccountMenu'
import NotificationsMenu from './NotificationsMenu'
import Logo from './Logo'

const APP_NAV = [
  { to: '/app', label: 'Home', short: 'Home', icon: Home, end: true },
  { to: '/app/memories', label: 'Memories', short: 'Saved', icon: BookOpen },
  { to: '/app/connect', label: 'Connect', short: 'Connect', icon: Link2 },
  { to: '/app/profile', label: 'Profile', short: 'You two', icon: Heart },
]

const tabClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
    isActive ? 'bg-rose-100 text-rose-800' : 'text-ink-500 hover:bg-cream-200 hover:text-ink-900'
  }`

const mobileTabClass = ({ isActive }) =>
  `flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition-colors duration-200 ${
    isActive ? 'text-rose-800' : 'text-ink-500 hover:text-ink-700'
  }`

export default function AppShell() {
  return (
    <div className="min-h-dvh bg-cream-100">
      <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-cream-100/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Logo size="sm" href="/app" />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {APP_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={tabClass}>
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Secondary navigation lives here on both surfaces, so the mobile
              bottom bar never grows past its four primary tabs. The cluster is
              the panels' positioning context — anchoring to a trigger alone
              pushes the wide notification list off-screen at 390px. */}
          <div className="relative flex items-center gap-1.5 sm:gap-3">
            <NotificationsMenu />
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-7 sm:px-8 sm:pt-9 lg:pb-16">
        <Outlet />
      </main>

      {/* The top bar only fits logo + four tabs + the account cluster from lg
          up, so tablets keep the bottom bar one breakpoint longer. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-cream-50/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch py-1.5">
          {APP_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={mobileTabClass}>
              <item.icon className="h-5 w-5" aria-hidden />
              {item.short}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

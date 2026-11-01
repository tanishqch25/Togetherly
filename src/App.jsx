import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { AuthProvider } from './context/AuthProvider'
import { DataProvider } from './context/DataProvider'
import { useAuth } from './context/useAuth'
import Connect from './pages/Connect'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Legal from './pages/Legal'
import Memories from './pages/Memories'
import NewUpdate from './pages/NewUpdate'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import { PRIVACY, TERMS } from './lib/legal'
import { redirectTarget } from './lib/redirect'

/** Unauthenticated visitors keep the address they asked for, so login can return them to it. */
function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (isAuthenticated) return <Outlet />
  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  )
}

/**
 * Login and signup are not destinations once you are in. The guard has to aim at the same place the
 * page itself aims at, because the session flips to authenticated while the form's own navigation
 * is still in flight — whichever of the two wins, the destination must be identical.
 */
function RequireGuest({ fallback = '/app' }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Outlet />
  return <Navigate to={redirectTarget(location.state?.from, fallback)} replace />
}

/**
 * The mock space lives in DataProvider, which sits above the route guard so it cannot unmount with
 * the protected tree. Re-keying it on the user is what stops one session's updates, reactions and
 * notifications being handed to the next person who signs in.
 */
function SessionScope({ children }) {
  const { user } = useAuth()
  return <DataProvider key={user?.id ?? 'anonymous'}>{children}</DataProvider>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionScope>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Legal doc={PRIVACY} other={TERMS} />} />
            <Route path="/terms" element={<Legal doc={TERMS} other={PRIVACY} />} />
            <Route element={<RequireGuest fallback="/app" />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<RequireGuest fallback="/app/connect" />}>
              <Route path="/signup" element={<SignUp />} />
            </Route>
            {/* Deliberately unguarded: it is the way back into the space for someone who is
                signed out and has forgotten the password. */}
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<RequireAuth />}>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="new" element={<NewUpdate />} />
                <Route path="memories" element={<Memories />} />
                <Route path="connect" element={<Connect />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionScope>
      </AuthProvider>
    </BrowserRouter>
  )
}

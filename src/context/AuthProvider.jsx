import { useCallback, useEffect, useMemo, useState } from 'react'
import { ME, PARTNER } from '../lib/mockData'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AuthContext } from './useAuth'

const STORAGE_KEY = 'togetherly.session'

/**
 * Stage 1: sessions are faked in localStorage so every screen is reachable and the
 * auth pages have meaningful behaviour. Stage 2 replaces the bodies of these three
 * functions with Supabase calls — the shape (`{ user }`) is already the same, so no
 * component changes.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY))
    } catch {
      return null
    }
  })
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const persist = useCallback((next) => {
    setSession(next)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const signIn = useCallback(
    async ({ email }) => {
      setPending(true)
      await new Promise((resolve) => setTimeout(resolve, 700))
      const next = { user: { id: ME, email, partnerId: PARTNER } }
      persist(next)
      setPending(false)
      return next
    },
    [persist],
  )

  const signUp = useCallback(
    async ({ email }) => {
      setPending(true)
      await new Promise((resolve) => setTimeout(resolve, 700))
      const next = { user: { id: ME, email, partnerId: null } }
      persist(next)
      setPending(false)
      return next
    },
    [persist],
  )

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    persist(null)
  }, [persist])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      pending,
      signIn,
      signUp,
      signOut,
    }),
    [session, pending, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

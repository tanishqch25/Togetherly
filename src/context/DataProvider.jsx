import { useCallback, useMemo, useState } from 'react'
import {
  ME,
  couple as seedCouple,
  invitation,
  partnerOf,
  seedNotifications,
  seedUpdates,
} from '../lib/mockData'
import { DataContext } from './useData'

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Readable in a video call: no I/O/0/1 ambiguity, grouped as TLSH-4827. */
function buildCode() {
  const pick = (n) =>
    Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
  return `${pick(4)}-${pick(4)}`
}

export function DataProvider({ children }) {
  const [couple, setCouple] = useState(seedCouple)
  const [updates, setUpdates] = useState(() => [...seedUpdates].sort(byNewest))
  const [connection, setConnection] = useState({
    status: 'connected',
    invite: invitation,
  })
  const [notifications, setNotifications] = useState(seedNotifications)

  // Stage 3 flips this while it fetches. The mock space is already in memory on the first render,
  // so gating on it only made the screens slower; `Memories` keeps the branch the real fetch needs.
  const loading = false

  const currentUser = couple.partners.find((p) => p.id === ME) ?? couple.partners[0]
  const partner = partnerOf(ME)

  // Live lookup: a name edited in Profile must resolve correctly here, not from the seed object.
  const personById = useCallback(
    (personId) => couple.partners.find((person) => person.id === personId) ?? null,
    [couple.partners],
  )

  const publishUpdate = useCallback(async ({ photo, moodId, message }) => {
    // Stands in for the Stage 3 Storage upload + insert, so the button's pending state is real
    // and every caller gets the same round-trip without re-implementing it.
    await new Promise((resolve) => setTimeout(resolve, 900))
    // Stage 3: upload `photo` to Supabase Storage and use the returned public URL.
    const photoUrl = photo ? URL.createObjectURL(photo) : null
    const update = {
      id: `upd-${Date.now()}`,
      authorId: ME,
      moodId,
      message,
      photo: photoUrl,
      createdAt: new Date().toISOString(),
      reactions: {},
    }
    setUpdates((current) => [update, ...current])
    return update
  }, [])

  const toggleReaction = useCallback((updateId, reactionId) => {
    setUpdates((current) =>
      current.map((update) => {
        if (update.id !== updateId) return update
        const holders = update.reactions?.[reactionId] ?? []
        const nextHolders = holders.includes(ME)
          ? holders.filter((id) => id !== ME)
          : [...holders, ME]
        return { ...update, reactions: { ...update.reactions, [reactionId]: nextHolders } }
      }),
    )
  }, [])

  const editPartner = useCallback((personId, patch) => {
    setCouple((current) => ({
      ...current,
      partners: current.partners.map((person) => (person.id === personId ? { ...person, ...patch } : person)),
    }))
  }, [])

  const editCouple = useCallback((patch) => {
    setCouple((current) => ({ ...current, ...patch }))
  }, [])

  const regenerateInvite = useCallback(() => {
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    setConnection((current) => ({
      ...current,
      invite: { ...current.invite, code: buildCode(), expiresAt: expires.toISOString() },
    }))
  }, [])

  const joinWithCode = useCallback((code) => {
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    setConnection({ status: 'connected', invite: { ...invitation, code, expiresAt: expires.toISOString() } })
    return true
  }, [])

  const unlinkPartner = useCallback(() => {
    setConnection((current) => ({ ...current, status: 'pending' }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
  }, [])

  const markNotificationRead = useCallback((notificationId) => {
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    )
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )

  const value = useMemo(
    () => ({
      couple,
      currentUser,
      partner,
      personById,
      updates,
      connection,
      notifications,
      unreadCount,
      loading,
      publishUpdate,
      toggleReaction,
      editPartner,
      editCouple,
      regenerateInvite,
      joinWithCode,
      unlinkPartner,
      markAllNotificationsRead,
      markNotificationRead,
    }),
    [
      couple,
      currentUser,
      partner,
      personById,
      updates,
      connection,
      notifications,
      unreadCount,
      loading,
      publishUpdate,
      toggleReaction,
      editPartner,
      editCouple,
      regenerateInvite,
      joinWithCode,
      unlinkPartner,
      markAllNotificationsRead,
      markNotificationRead,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

/** Date helpers for the counters, timestamps and month grouping the app shows. */

const MS_PER_DAY = 86_400_000

/**
 * Null for anything unparseable. A native date input can be cleared back to an empty
 * string by the user, and `toISOString()` throws on that — without this the stray click
 * unmounts the whole tree instead of just blanking a counter.
 */
function timeValue(value) {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

/** Date-only value at local midnight, so "days apart" ignores clock time. */
function dayStart(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function daysBetween(from, to = Date.now()) {
  const start = timeValue(from)
  const end = timeValue(to)
  if (start === null || end === null) return 0
  return Math.max(0, Math.round((dayStart(end) - dayStart(start)) / MS_PER_DAY))
}

export function isToday(value) {
  return dayStart(value).getTime() === dayStart(Date.now()).getTime()
}

/** Anniversary day itself counts as day 1. */
export function daysTogether(anniversary) {
  if (!anniversary) return 0
  return daysBetween(anniversary) + 1
}

export function countdownTo(target) {
  const targetTime = timeValue(target)
  if (targetTime === null) return { isSet: false, isArrived: false, days: 0, hours: 0, minutes: 0, seconds: 0 }
  const remaining = Math.max(0, targetTime - Date.now())
  return {
    isSet: true,
    isArrived: remaining === 0,
    days: Math.floor(remaining / MS_PER_DAY),
    hours: Math.floor((remaining % MS_PER_DAY) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1000),
  }
}

export function relativeTime(value) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`

  const days = daysBetween(value)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}

export function formatTimestamp(value) {
  const date = new Date(value)
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const days = daysBetween(date)
  if (days === 0) return `Today, ${time}`
  if (days === 1) return `Yesterday, ${time}`
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`
}

export function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const time = timeValue(value)
  return time === null ? '' : new Date(time).toLocaleDateString(undefined, options)
}

/** '2026-10' — stable key for grouping the memories gallery. */
export function monthKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

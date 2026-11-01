/**
 * Where to send someone once they are signed in. A preserved deep link always wins; otherwise the
 * route they came from decides — the dashboard after a login, the connect page after a signup.
 *
 * The path has to start with a single slash: a stored `from` must never become a way off the site.
 */
export function redirectTarget(from, fallback = '/app') {
  if (typeof from !== 'string') return fallback
  if (!from.startsWith('/') || from.startsWith('//')) return fallback
  return from
}

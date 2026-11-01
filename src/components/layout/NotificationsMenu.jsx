import { CalendarHeart, Camera, Check, Bell, Heart, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useData } from '../../context/useData'
import { formatTimestamp } from '../../lib/date'
import { getReaction } from '../../lib/reaction'
import Menu from '../ui/Menu'

const KINDS = {
  reaction: { icon: Heart, label: 'Reaction' },
  checkin: { icon: Camera, label: 'Check-in' },
  milestone: { icon: CalendarHeart, label: 'Milestone' },
  connection: { icon: Link2, label: 'Connection' },
}

function snippet(text) {
  if (!text) return null
  return text.length > 96 ? `${text.slice(0, 96).trimEnd()}…` : text
}

function describe(item, { partner, update }) {
  if (item.kind === 'reaction') {
    const reaction = getReaction(item.reactionId)
    return {
      title: `${partner.name} reacted with ${reaction?.label ?? 'love'}`,
      body: snippet(update?.message),
    }
  }
  if (item.kind === 'checkin') {
    return { title: `${partner.name} checked in`, body: snippet(update?.message) }
  }
  return { title: item.title, body: snippet(item.body) }
}

/** The header bell: unread count plus the six most recent things worth opening. */
export default function NotificationsMenu() {
  const { notifications, unreadCount, partner, updates, markAllNotificationsRead, markNotificationRead } =
    useData()

  const items = notifications.slice(0, 6)

  return (
    <Menu
      rootClassName="static"
      label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className="relative rounded-full p-2 text-ink-500 transition-colors hover:bg-cream-200 hover:text-ink-900"
      trigger={
        <span className="relative flex">
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-800 px-1 text-xs font-bold leading-none text-cream-50">
              {unreadCount}
            </span>
          )}
        </span>
      }
    >
      <div className="flex items-center justify-between gap-3 border-b border-cream-200 px-4 py-3">
        <p className="font-display text-title-card text-ink-900">Notifications</p>
        <button
          type="button"
          onClick={markAllNotificationsRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 transition-colors hover:text-rose-900 disabled:text-ink-300 disabled:hover:text-ink-300"
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          Mark all read
        </button>
      </div>

      <ul className="max-h-[22rem] space-y-0.5 overflow-y-auto p-1.5">
        {items.map((item) => {
          const update = item.updateId ? updates.find((u) => u.id === item.updateId) : null
          const { title, body } = describe(item, { partner, update })
          const Icon = KINDS[item.kind]?.icon ?? Heart

          return (
            <li key={item.id}>
              <Link
                to={update ? `/app/memories?open=${update.id}` : '/app'}
                onClick={() => markNotificationRead(item.id)}
                className={`flex gap-3 rounded-3xl px-2.5 py-3 transition-colors hover:bg-cream-200 ${
                  item.read ? '' : 'bg-rose-50/70'
                }`}
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-rose-700">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 flex-1 text-sm font-semibold text-ink-900">{title}</span>
                    {!item.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />
                    )}
                  </span>
                  {body && <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{body}</span>}
                  <span className="mt-1 block text-xs text-ink-500">{formatTimestamp(item.createdAt)}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Menu>
  )
}

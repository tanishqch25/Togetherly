import Avatar from '../ui/Avatar'
import MoodBadge from './MoodBadge'
import { formatTimestamp } from '../../lib/date'

/**
 * The shared presentation of one update: photo, author, mood, message and time.
 * Used by the dashboard (partner's latest) and by the memories gallery.
 */
export default function PhotoCard({ update, author, footer, className = '' }) {
  return (
    <article className={`surface overflow-hidden ${className}`}>
      {update.photo && (
        <img
          src={update.photo}
          alt={`Photo from ${author?.name ?? 'your partner'}`}
          loading="lazy"
          className="h-60 w-full object-cover sm:h-72"
        />
      )}

      <div className="space-y-3.5 p-5 sm:p-6">
        {author && (
          <div className="flex items-center gap-3">
            <Avatar src={author.avatarUrl} initials={author.initials} name={author.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{author.name}</p>
              <p className="truncate text-xs text-ink-500">{author.city}</p>
            </div>
            <span className="ml-auto shrink-0 text-xs font-medium text-ink-500">
              {formatTimestamp(update.createdAt)}
            </span>
          </div>
        )}

        <MoodBadge moodId={update.moodId} size="sm" />

        <p className="text-sm leading-relaxed text-ink-700">{update.message}</p>

        {footer && <div className="pt-1">{footer}</div>}
      </div>
    </article>
  )
}

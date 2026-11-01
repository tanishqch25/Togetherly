import { formatDate } from '../../lib/date'
import MoodBadge from '../updates/MoodBadge'

/**
 * A single gallery tile in Memories. Photo tiles get a caption overlay; text-only
 * updates render as a letter-style card so the grid stays visually even.
 */
export default function MemoryCard({ update, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(update)}
      className="group surface relative block w-full overflow-hidden text-left transition-shadow duration-200 hover:shadow-lift focus-visible:overflow-visible"
    >
      {update.photo ? (
        <>
          <img
            src={update.photo}
            alt={`Memory from ${formatDate(update.createdAt)}`}
            loading="lazy"
            className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:h-60"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 via-ink-900/25 to-transparent px-4 pb-4 pt-10">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-cream-50">{update.message}</p>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-cream-200/80">
              {formatDate(update.createdAt, { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-52 flex-col justify-end bg-cream-50 px-5 pb-5 pt-16 sm:h-60">
          <p className="line-clamp-4 font-display text-sm leading-relaxed text-ink-700">
            {update.message}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-eyebrow text-ink-500">
            {formatDate(update.createdAt, { day: 'numeric', month: 'short' })}
          </p>
        </div>
      )}

      <span className="absolute left-4 top-4">
        <MoodBadge moodId={update.moodId} size="sm" className="shadow-soft" />
      </span>
    </button>
  )
}

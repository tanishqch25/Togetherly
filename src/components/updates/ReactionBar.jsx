import { REACTIONS } from '../../lib/reaction'
import ReactionButton from './ReactionButton'

export default function ReactionBar({ update, currentUserId, onToggle }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTIONS.map((reaction) => (
        <ReactionButton
          key={reaction.id}
          reaction={reaction}
          count={update.reactions?.[reaction.id]?.length ?? 0}
          active={Boolean(update.reactions?.[reaction.id]?.includes(currentUserId))}
          onClick={() => onToggle(update.id, reaction.id)}
        />
      ))}
    </div>
  )
}

/**
 * Which reaction surface an update gets is a property of the update, not of the page showing it:
 * yours is read-only, theirs is interactive. Every caller asks this one component instead of
 * re-deciding, so a new surface cannot get the rule backwards.
 */
export function UpdateReactions({ update, currentUserId, onToggle }) {
  return update.authorId === currentUserId ? (
    <ReactionSummary update={update} />
  ) : (
    <ReactionBar update={update} currentUserId={currentUserId} onToggle={onToggle} />
  )
}

/**
 * Read-only variant for your own updates: you are not meant to react to yourself,
 * what you want to see is how they responded.
 */
export function ReactionSummary({ update }) {
  const received = REACTIONS.map((reaction) => ({
    reaction,
    count: update.reactions?.[reaction.id]?.length ?? 0,
  })).filter((entry) => entry.count > 0)

  if (received.length === 0) {
    return <p className="text-xs text-ink-500">No reactions yet.</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {received.map(({ reaction, count }) => {
        const Icon = reaction.icon
        return (
          <span key={reaction.id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <Icon className="h-3.5 w-3.5 fill-rose-300 text-rose-600" aria-hidden />
            {reaction.label}
            <span className="tabular-nums text-ink-500">{count}</span>
          </span>
        )
      })}
    </div>
  )
}

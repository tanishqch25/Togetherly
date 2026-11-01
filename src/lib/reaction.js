import { Flower2, Heart, Smile, Sparkles, ThumbsUp } from 'lucide-react'

export const REACTIONS = [
  { id: 'heart', label: 'Love', icon: Heart },
  { id: 'sparkle', label: 'Adore', icon: Sparkles },
  { id: 'miss', label: 'Miss you', icon: Flower2 },
  { id: 'laugh', label: 'Haha', icon: Smile },
  { id: 'proud', label: 'Proud', icon: ThumbsUp },
]

const BY_ID = REACTIONS.reduce((acc, reaction) => ({ ...acc, [reaction.id]: reaction }), {})

export function getReaction(id) {
  return BY_ID[id] ?? null
}

/** Counts reactions from a map of { reactionId: [userId, ...] }. */
export function reactionCount(reactions, id) {
  return reactions?.[id]?.length ?? 0
}

export function hasReacted(reactions, id, userId) {
  return Boolean(reactions?.[id]?.includes(userId))
}

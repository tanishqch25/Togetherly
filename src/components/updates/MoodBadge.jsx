import { getMood } from '../../lib/mood'

export default function MoodBadge({ moodId, size = 'md', className = '' }) {
  const mood = getMood(moodId)
  if (!mood) return null

  const sizing = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${mood.chip} ${sizing} ${className}`}
    >
      <span aria-hidden>{mood.emoji}</span>
      {mood.label}
      <span className="sr-only">mood</span>
    </span>
  )
}

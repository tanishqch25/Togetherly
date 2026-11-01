import { MOODS } from '../../lib/mood'

export default function MoodSelector({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Current mood" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MOODS.map((mood) => {
        const selected = value === mood.id

        return (
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : mood.id)}
            className={`flex flex-col items-center gap-1.5 rounded-3xl border px-2 py-3.5 transition-all duration-200 ${
              selected
                ? `-rotate-1 border-rose-300 bg-rose-50 shadow-soft ${mood.chip}`
                : 'border-cream-300 bg-cream-50 text-ink-500 hover:border-rose-200 hover:bg-rose-50/50'
            }`}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {mood.emoji}
            </span>
            <span className="text-xs font-semibold">{mood.label}</span>
          </button>
        )
      })}
    </div>
  )
}

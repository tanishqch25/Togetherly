import { useEffect, useState } from 'react'
import { CalendarHeart } from 'lucide-react'
import { countdownTo, formatDate } from '../../lib/date'

function Unit({ value, label }) {
  return (
    <div className="flex-1 rounded-2xl bg-cream-50 px-2 py-3 text-center">
      <p className="font-display text-2xl leading-none tabular-nums text-ink-900">
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-eyebrow text-ink-500">{label}</p>
    </div>
  )
}

export default function CountdownCard({ target, className = '' }) {
  const [remaining, setRemaining] = useState(() => countdownTo(target))
  const [tickTarget, setTickTarget] = useState(target)

  // The interval cannot fire until a second after `target` moves, so without this the card spends
  // that second still counting down to — or showing digits for — the previous date.
  if (tickTarget !== target) {
    setTickTarget(target)
    setRemaining(countdownTo(target))
  }

  // Ticks every second so the "next meeting" clock is genuinely live.
  useEffect(() => {
    const id = setInterval(() => setRemaining(countdownTo(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  return (
    <div className={`rounded-4xl bg-butter-200 p-5 shadow-soft sm:p-6 ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <CalendarHeart className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">Next time we meet</p>
          <p className="text-xs text-ink-700">{formatDate(target) || 'No date set'}</p>
        </div>
      </div>

      {!remaining.isSet ? (
        <p className="rounded-2xl bg-cream-50 px-4 py-5 text-center text-sm text-ink-500">
          Pick a date and the clock starts.
        </p>
      ) : remaining.isArrived ? (
        <p className="rounded-2xl bg-rose-100 px-4 py-5 text-center font-display text-title-card text-rose-800">
          Today is the day.
        </p>
      ) : (
        <div className="flex gap-2">
          <Unit value={remaining.days} label="Days" />
          <Unit value={remaining.hours} label="Hrs" />
          <Unit value={remaining.minutes} label="Min" />
          <Unit value={remaining.seconds} label="Sec" />
        </div>
      )}
    </div>
  )
}

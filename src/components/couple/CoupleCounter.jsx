import { Heart } from 'lucide-react'
import { daysTogether, formatDate } from '../../lib/date'

export default function CoupleCounter({ anniversary, className = '' }) {
  const days = daysTogether(anniversary)
  const since = formatDate(anniversary)

  return (
    <div className={`flex items-center gap-4 rounded-4xl bg-butter-200 p-5 shadow-soft sm:p-6 ${className}`}>
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100">
        <Heart className="h-5 w-5 fill-rose-500 text-rose-500" aria-hidden />
      </span>
      <div>
        <p className="font-display text-3xl leading-none text-ink-900 sm:text-4xl">
          {days.toLocaleString()}
          <span className="ml-2 font-sans text-sm font-medium text-ink-700">days together</span>
        </p>
        <p className="mt-1.5 text-xs font-medium text-ink-700">
          {since ? `Since ${since}` : 'Set your anniversary'}
        </p>
      </div>
    </div>
  )
}

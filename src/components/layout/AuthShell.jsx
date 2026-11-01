import { Link } from 'react-router-dom'
import Logo from './Logo'

const HIGHLIGHTS = [
  'One photo, one mood, one line a day',
  'Reactions that answer without a conversation',
  'A timeline of the whole long-distance year',
]

export default function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <div className="grid min-h-dvh bg-cream-100 lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between bg-sage-500 p-12 lg:flex">
        <Logo href="/" className="[&_span]:text-ink-900" />

        <div className="max-w-md">
          <h2 className="font-display text-3xl text-ink-900">
            Distance means so little when someone means so much.
          </h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-ink-900">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-900" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-display text-sm italic text-ink-900">
          “The best part of my day is the ninety seconds I spend in here.”
        </p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-9 flex items-center justify-between lg:hidden">
            <Logo size="sm" />
            <Link to="/" className="text-sm font-medium text-ink-500 hover:text-ink-700">
              Back to site
            </Link>
          </div>

          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-rose-800">{eyebrow}</p>
          )}
          <h1 className="mt-2 font-display text-3xl text-ink-900">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">{description}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-center text-sm text-ink-900">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

/**
 * Every entry here resolves somewhere real. Section links are absolute so they still work
 * from the public legal pages, which render this footer but do not contain the anchors.
 */
const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'Memories', to: '/#memories' },
      { label: 'How it works', to: '/#rituals' },
      { label: 'Create your space', to: '/signup' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
]

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-cream-200 bg-cream-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size="sm" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
            Distance means so little when someone means so much.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden />
            Built for two people
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-ink-900">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-ink-500 transition-colors hover:text-rose-800"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-cream-200 px-5 py-6 text-center text-xs text-ink-500 sm:px-8">
        © {YEAR} Togetherly. A private space, just for two.
      </div>
    </footer>
  )
}

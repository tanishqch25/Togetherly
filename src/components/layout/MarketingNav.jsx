import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Button from '../ui/Button'
import Logo from './Logo'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#memories', label: 'Memories' },
  { href: '#rituals', label: 'How it works' },
]

export default function MarketingNav() {
  const [open, setOpen] = useState(false)

  // Keep the page scrollable if the visitor resizes out of the mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-cream-100/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button to="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button to="/signup" size="sm">
            Get started
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="rounded-full p-2 text-ink-700 transition-colors hover:bg-cream-200 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-cream-200 bg-cream-50 px-5 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-ink-700 transition-colors hover:bg-cream-100"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            <Button to="/login" variant="secondary" fullWidth onClick={() => setOpen(false)}>
              Log in
            </Button>
            <Button to="/signup" fullWidth onClick={() => setOpen(false)}>
              Get started
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

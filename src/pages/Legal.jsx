import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Logo from '../components/layout/Logo'
import Button from '../components/ui/Button'

/**
 * Shared shell for the public legal documents. Rendered twice, once per route, with the
 * sibling passed in so the two pages can cross-link without either naming the other.
 */
export default function Legal({ doc, other }) {
  return (
    <div className="min-h-dvh bg-cream-100">
      <header className="border-b border-cream-200/80 bg-cream-100/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo size="sm" href="/" />
          <div className="flex items-center gap-3">
            <Button to="/login" variant="ghost" size="sm">
              Log in
            </Button>
            <Button to="/signup" size="sm">
              Get started
            </Button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-rose-800">{doc.eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl text-ink-900 sm:text-4xl">{doc.title}</h1>
        <p className="mt-3 text-xs text-ink-500">
          Last updated {doc.updated} · Togetherly v0.1, running on sample data
        </p>

        <p className="mt-8 text-base leading-relaxed text-ink-700">{doc.intro}</p>

        <div className="mt-11 space-y-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-title-section text-ink-900">{section.heading}</h2>
              {section.body?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-700">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-cream-200 pt-6">
          <Link
            to="/"
            className="text-sm font-semibold text-rose-800 transition-colors hover:text-rose-900"
          >
            ← Back to Togetherly
          </Link>
          <Link
            to={other.path}
            className="text-sm text-ink-500 transition-colors hover:text-ink-900"
          >
            {other.title}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

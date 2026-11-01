import { Compass } from 'lucide-react'
import Button from '../components/ui/Button'
import Logo from '../components/layout/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-cream-100 px-6 text-center">
      <Logo />
      <div>
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Compass className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-3xl text-ink-900">This page is not in your space</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
          The link may be old, or it may belong to a part of Togetherly that is still being built.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/app">Back to today</Button>
          <Button to="/" variant="secondary">
            Home page
          </Button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { useAuth } from '../../context/useAuth'
import { redirectTarget } from '../../lib/redirect'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, pending } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: null }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!EMAIL_PATTERN.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 6) nextErrors.password = 'Passwords are at least 6 characters.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await signIn(form)
    // Clearing state stops a refresh from replaying the redirect.
    navigate(redirectTarget(location.state?.from), { replace: true, state: null })
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your space"
      description="Your shared room is exactly where you left it."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-rose-800 hover:text-rose-900">
            Create your space
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email ?? undefined}
        />

        <div>
          <Input
            type="password"
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={update('password')}
            error={errors.password ?? undefined}
          />
          <div className="mt-2 flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-ink-500 hover:text-rose-800">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={pending} disabled={pending}>
          {pending ? 'Opening your space' : 'Log in'}
          {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-3 rounded-3xl border border-cream-200 bg-cream-50 p-4">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Mail className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-xs leading-relaxed text-ink-500">
          Supabase auth is not connected yet, so any well-formed email and a password of six or more
          characters will sign you into the demo space.
        </p>
      </div>
    </AuthShell>
  )
}

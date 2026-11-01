import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, UserPlus } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { useAuth } from '../../context/useAuth'
import { redirectTarget } from '../../lib/redirect'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp, pending } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: null }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Tell us what to call you.'
    if (!EMAIL_PATTERN.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) nextErrors.confirm = 'Passwords do not match.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await signUp(form)
    // A brand-new space has no partner yet, so the connect page is the default landing.
    navigate(redirectTarget(location.state?.from, '/app/connect'), { replace: true, state: null })
  }

  return (
    <AuthShell
      eyebrow="Create your space"
      title="Start your shared room"
      description="Two minutes now, and every day after that takes ninety seconds."
      footer={
        <>
          Already have a space?{' '}
          <Link to="/login" className="font-semibold text-rose-800 hover:text-rose-900">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Your name"
          autoComplete="given-name"
          placeholder="Emerson"
          value={form.name}
          onChange={update('name')}
          error={errors.name ?? undefined}
        />

        <Input
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email ?? undefined}
        />

        <Input
          type="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update('password')}
          error={errors.password ?? undefined}
        />

        <Input
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Type it once more"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm ?? undefined}
        />

        <Button type="submit" fullWidth size="lg" loading={pending} disabled={pending}>
          {pending ? 'Creating your space' : 'Create your space'}
          {!pending && <UserPlus className="h-4 w-4" aria-hidden />}
        </Button>
      </form>

      <p className="mt-6 text-xs leading-relaxed text-ink-500">
        Next you will get an invitation code to send to your partner. Until they use it, your room
        stays empty and private — nothing is shared anywhere.
      </p>

      <div className="mt-4">
        <Button to="/login" variant="ghost" fullWidth>
          I already have an account
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </AuthShell>
  )
}

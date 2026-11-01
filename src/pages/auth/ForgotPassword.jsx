import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email address.')
      return
    }

    setError(null)
    setPending(true)
    // Stage 2: supabase.auth.resetPasswordForEmail(email, { redirectTo })
    await new Promise((resolve) => setTimeout(resolve, 700))
    setPending(false)
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link on its way"
        description="If an account exists for that address, a reset link is waiting."
      >
        <div className="surface flex items-start gap-3 p-5">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-800">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Sent to {sentTo}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Links expire after an hour. Nothing arrived? Check spam, or try again in a minute.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Button to="/login" variant="secondary" fullWidth size="lg">
            Back to login
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Forgot your password?"
      description="Enter the email you signed up with and we will send a reset link."
      footer={
        <Link to="/login" className="font-semibold text-rose-800 hover:text-rose-900">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError(null)
          }}
          error={error ?? undefined}
        />

        <Button type="submit" fullWidth size="lg" loading={pending} disabled={pending}>
          {!pending && <Mail className="h-4 w-4" aria-hidden />}
          {pending ? 'Sending link' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-xs leading-relaxed text-ink-500">
        Email reset is prepared for Supabase but not wired until Stage 2, so this confirms the flow
        rather than sending a real message.
      </p>
    </AuthShell>
  )
}

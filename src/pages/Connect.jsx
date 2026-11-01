import { useState } from 'react'
import { Check, Copy, Heart, Link2, RefreshCw, Send, Unlink } from 'lucide-react'
import ConfirmUnlink from '../components/couple/ConfirmUnlink'
import PartnerCard from '../components/couple/PartnerCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Input } from '../components/ui/Field'
import { formatDate } from '../lib/date'
import { useData } from '../context/useData'

const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/i

export default function Connect() {
  const { currentUser, partner, connection, regenerateInvite, joinWithCode, unlinkPartner } = useData()

  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [confirmingUnlink, setConfirmingUnlink] = useState(false)

  const connected = connection.status === 'connected'

  // The clipboard is missing in insecure contexts and rejects on denied permission. Without the
  // catch the button looked dead, which is the one thing this screen cannot afford.
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(connection.invite.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 4000)
    }
  }

  function handleJoin(event) {
    event.preventDefault()
    const normalised = code.trim().toUpperCase()

    if (!CODE_PATTERN.test(normalised)) {
      setError('Codes look like TLSH-4827 — four characters, a dash, four more.')
      return
    }
    if (normalised === connection.invite.code) {
      setError('That is your own code. Ask your partner for theirs.')
      return
    }

    setError(null)
    joinWithCode(normalised)
    setCode('')
  }

  return (
    <div className="space-y-7">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-rose-800">One room, two people</p>
        <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Connect with your partner</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          Your space only opens when the two of you are linked. Share your code once — it works from any
          device and expires by itself.
        </p>
      </header>

      {connected ? (
        <>
          <Card className="border border-rose-200 bg-rose-50/60">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-50 text-rose-700 shadow-soft">
                <Link2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-title-card text-ink-900">You and {partner.name} are connected</p>
                <p className="mt-1 text-sm text-ink-500">
                  Every update you publish lands in the same timeline.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setConfirmingUnlink(true)}>
                <Unlink className="h-4 w-4" aria-hidden />
                Unlink
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <PartnerCard person={currentUser} relation="You" />
            <PartnerCard person={partner} relation="Connected partner" />
          </div>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-title-section text-ink-900">Your invitation code</h2>
            <p className="mt-2 text-sm text-ink-500">Send this to {partner.name} or read it out on a call.</p>

            <div className="mt-6 rounded-3xl border border-dashed border-rose-200 bg-cream-100 px-5 py-8 text-center">
              <p className="font-display text-figure tracking-code text-rose-700">
                {connection.invite.code}
              </p>
              <p className="mt-3 text-xs text-ink-500">
                Expires {formatDate(connection.invite.expiresAt)}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? 'Copied' : copyFailed ? 'Could not copy' : 'Copy code'}
              </Button>
              <Button variant="secondary" onClick={regenerateInvite}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                New code
              </Button>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-ink-500">
              Generating a new code retires the old one immediately, so an expired code cannot be reused
              by anyone else.
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-title-section text-ink-900">Already have their code?</h2>
            <p className="mt-2 text-sm text-ink-500">
              Paste what {partner.name} sent you and your timelines merge instantly.
            </p>

            <form onSubmit={handleJoin} className="mt-6 space-y-4" noValidate>
              <Input
                label="Partner's invitation code"
                placeholder="TLSH-4827"
                autoComplete="off"
                spellCheck={false}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value)
                  setError(null)
                }}
                error={error ?? undefined}
              />
              <Button type="submit" fullWidth size="lg">
                <Send className="h-4 w-4" aria-hidden />
                Connect
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-3xl bg-cream-100 p-4">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Heart className="h-4 w-4 fill-rose-300 text-rose-600" aria-hidden />
              </span>
              <p className="text-xs leading-relaxed text-ink-500">
                Connection is one-to-one on purpose. A code links exactly two accounts, and either of you
                can unlink later without losing your memories.
              </p>
            </div>
          </Card>
        </div>
      )}

      <ConfirmUnlink
        open={confirmingUnlink}
        onClose={() => setConfirmingUnlink(false)}
        onConfirm={() => {
          unlinkPartner()
          setConfirmingUnlink(false)
        }}
      />
    </div>
  )
}

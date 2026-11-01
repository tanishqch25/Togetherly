import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, ShieldCheck, Sparkles, Unlink } from 'lucide-react'
import ConfirmUnlink from '../components/couple/ConfirmUnlink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Select } from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import Switch from '../components/ui/Switch'
import { useAuth } from '../context/useAuth'
import { useData } from '../context/useData'

const SECTIONS = [
  { id: 'check-ins', label: 'Check-ins' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'recap', label: 'Weekly recap' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'danger', label: 'Your space' },
]

const REMINDER_TIMES = ['19:00', '20:00', '21:00', '22:00']

const RECAP_EXAMPLE = `Your week in three lines

· Sparkles checked in six days, mostly Missing You on weeknights and Happy at the weekend.
· You posted five times. Your proudest moment was the December leave approval.
· 11 days left on the countdown. You reacted to each other 14 times.`

function Section({ id, title, badge, tone = 'plain', children }) {
  return (
    <Card
      as="section"
      id={id}
      className={`scroll-mt-24 ${tone === 'danger' ? 'border border-rose-200 bg-rose-50' : ''}`}
    >
      <div className="flex items-center gap-2.5">
        <h2 className="font-display text-title-section text-ink-900">{title}</h2>
        {badge && (
          <span className="rounded-full bg-butter-200 px-2.5 py-0.5 text-xs font-semibold text-ink-900">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </Card>
  )
}

function Row({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p>
      </div>
      <div className="flex w-full shrink-0 items-center justify-end sm:w-auto sm:justify-start">
        {children}
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { currentUser, partner, unlinkPartner } = useData()

  const [prefs, setPrefs] = useState({
    dailyReminder: true,
    reminderTime: '21:00',
    quietHours: false,
    reactionSounds: true,
    partnerCheckins: true,
    milestones: true,
    weeklyRecap: false,
  })

  const [confirming, setConfirming] = useState(null)
  const [previewing, setPreviewing] = useState(false)

  const set = (key) => (value) => setPrefs((current) => ({ ...current, [key]: value }))

  function jump(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleUnlink() {
    unlinkPartner()
    setConfirming(null)
    navigate('/app/connect')
  }

  async function handleDelete() {
    setConfirming(null)
    await signOut()
    navigate('/')
  }

  return (
    <div className="space-y-7">
      <header>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-rose-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to today
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-eyebrow text-rose-800">Settings</p>
        <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Settings &amp; Privacy</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
          {currentUser.name} &amp; {partner.name} — everything here shapes how the two of you
          experience the space. Nothing is sent anywhere until you switch it on.
        </p>
      </header>

      <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => jump(section.id)}
            className="shrink-0 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-500 transition-colors hover:border-rose-200 hover:text-rose-800"
          >
            {section.label}
          </button>
        ))}
      </nav>

      <Section id="check-ins" title="Check-ins">
        <div className="divide-y divide-cream-200">
          <Switch
            label="Daily check-in reminder"
            description="A nudge if you have not posted today."
            checked={prefs.dailyReminder}
            onChange={set('dailyReminder')}
          />
          <Switch
            label="Quiet hours"
            description="Hold every ping between midnight and 7am your time."
            checked={prefs.quietHours}
            onChange={set('quietHours')}
          />
        </div>
        <div className="mt-5 max-w-xs">
          <Select
            label="Reminder time"
            hint={`Your timezone: ${currentUser.city}`}
            value={prefs.reminderTime}
            onChange={(event) => set('reminderTime')(event.target.value)}
            disabled={!prefs.dailyReminder}
          >
            {REMINDER_TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Select>
        </div>
      </Section>

      <Section id="notifications" title="Notifications">
        <div className="divide-y divide-cream-200">
          <Switch
            label="Their daily check-in"
            description={`Ping me the moment ${partner.name} posts.`}
            checked={prefs.partnerCheckins}
            onChange={set('partnerCheckins')}
          />
          <Switch
            label="Sound on their reactions"
            description="A soft chime when they react to one of your moments."
            checked={prefs.reactionSounds}
            onChange={set('reactionSounds')}
          />
          <Switch
            label="Milestone days"
            description="Anniversaries, and the countdown hitting a round number."
            checked={prefs.milestones}
            onChange={set('milestones')}
          />
        </div>
      </Section>

      <Section id="recap" title="Weekly couple recap" badge="Beta">
        <p className="max-w-prose text-sm leading-relaxed text-ink-500">
          Togetherly can write a short Sunday summary of your week — moods, photos and the days you
          missed each other.
        </p>
        <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-cream-100 px-4 py-3 text-xs leading-relaxed text-ink-700">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-800" aria-hidden />
          Nothing leaves your database until you switch this on. You can turn it off and delete every
          recap afterwards. No third-party AI is connected in this version of the product.
        </p>
        <div className="mt-4 divide-y divide-cream-200">
          <Switch
            label="Enable the recap"
            description="Requires both of you to turn it on."
            checked={prefs.weeklyRecap}
            disabled
            onChange={() => {}}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPreviewing(true)}>
            Preview an example recap
          </Button>
          <span className="inline-flex items-center gap-2 text-xs text-ink-500">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Switched off for everyone for now.
          </span>
        </div>
      </Section>

      <Section id="privacy" title="Privacy">
        <div className="max-w-xs">
          <Select label="Who can see my updates" value="partner" disabled>
            <option value="partner">Only {partner.name}</option>
          </Select>
        </div>
        <p className="mt-3 max-w-prose text-xs leading-relaxed text-ink-500">
          Only the two of you. There is no other option yet — photos live in your shared space.
        </p>
        <div className="mt-5 border-t border-cream-200">
          <Row
            title="Data export"
            description="A full export of everything you have written. The storage layer is a Stage 3 job, so this stays off until it exists."
          >
            <Button variant="secondary" size="sm" disabled>
              <Download className="h-4 w-4" aria-hidden />
              Download my data
            </Button>
          </Row>
        </div>
      </Section>

      <Section id="danger" title="Your space" tone="danger">
        <div className="divide-y divide-rose-200">
          <Row
            title="Manage your connection"
            description={`Regenerate the invite code or re-link with ${partner.name}.`}
          >
            <Button to="/app/connect" variant="secondary" size="sm">
              Open Connect
            </Button>
          </Row>
          <Row
            title={`Unlink ${partner.name}`}
            description="Hides the shared timeline from both accounts. Your memories stay saved in case you reconnect."
          >
            <button
              type="button"
              onClick={() => setConfirming('unlink')}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-cream-50 px-3.5 py-2 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-100"
            >
              <Unlink className="h-4 w-4" aria-hidden />
              Unlink partner
            </button>
          </Row>
          <Row
            title="Delete my space"
            description="Removes your account and every update you wrote. This one cannot be undone."
          >
            <button
              type="button"
              onClick={() => setConfirming('delete')}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-cream-50 px-3.5 py-2 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-100"
            >
              Delete my space
            </button>
          </Row>
        </div>
      </Section>

      <p className="text-xs text-ink-500">
        Togetherly v0.1 · Stage 1, running on mock data · switches here apply to this session only.
      </p>

      <Modal
        open={previewing}
        onClose={() => setPreviewing(false)}
        title="An example recap"
        footer={
          <Button variant="ghost" onClick={() => setPreviewing(false)}>
            Close
          </Button>
        }
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{RECAP_EXAMPLE}</p>
      </Modal>

      <ConfirmUnlink
        open={confirming === 'unlink'}
        onClose={() => setConfirming(null)}
        onConfirm={handleUnlink}
      />

      <Modal
        open={confirming === 'delete'}
        onClose={() => setConfirming(null)}
        title="Delete your space?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button onClick={handleDelete}>Delete my space</Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-700">
          This demo signs you out and clears the local session. Real account deletion arrives with
          Supabase in Stage 3.
        </p>
      </Modal>
    </div>
  )
}

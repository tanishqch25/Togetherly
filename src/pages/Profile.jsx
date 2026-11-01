import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarHeart, Heart, ImagePlus, Settings } from 'lucide-react'
import CountdownCard from '../components/couple/CountdownCard'
import CoupleCounter from '../components/couple/CoupleCounter'
import PartnerCard from '../components/couple/PartnerCard'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Input } from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import { useData } from '../context/useData'

const toDateInput = (value) => {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? '' : new Date(time).toISOString().slice(0, 10)
}

export default function Profile() {
  const { couple, currentUser, partner, editPartner, editCouple } = useData()

  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(null)
  const [nameError, setNameError] = useState(null)
  const avatarRef = useRef(null)

  function openEdit(person) {
    setEditing(person)
    setDraft({ name: person.name, nickname: person.nickname, city: person.city, avatarUrl: person.avatarUrl })
    setNameError(null)
  }

  function saveEdit() {
    const name = draft.name.trim()
    if (!name) {
      setNameError('A name is needed — it heads your profile and every card.')
      return
    }
    editPartner(editing.id, { ...draft, name, initials: name.charAt(0).toUpperCase() })
    setEditing(null)
    setNameError(null)
  }

  function handleAvatarPick(event) {
    const file = event.target.files?.[0]
    if (!file?.type.startsWith('image/')) return
    setDraft((current) => ({ ...current, avatarUrl: URL.createObjectURL(file) }))
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-rose-800">Togetherly</p>
        <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">
          {currentUser.name} &amp; {partner.name}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
          The two of you, in one room. Everything here is visible to each other and nobody else.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <PartnerCard person={currentUser} relation="You" onEdit={openEdit} />
        <PartnerCard person={partner} relation="Your partner" onEdit={openEdit} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CoupleCounter anniversary={couple.anniversary} />
        <CountdownCard target={couple.nextMeeting} />
      </div>

      <Card as="section">
        <h2 className="font-display text-title-section text-ink-900">Couple details</h2>
        <p className="mt-2 text-sm text-ink-500">Changes apply to your counters immediately.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Anniversary"
            value={toDateInput(couple.anniversary)}
            onChange={(event) => editCouple({ anniversary: event.target.value })}
          />
          <Input
            type="date"
            label="Next meeting"
            value={toDateInput(couple.nextMeeting)}
            onChange={(event) => editCouple({ nextMeeting: event.target.value })}
          />
          <Input
            label="Your city"
            value={currentUser.city}
            onChange={(event) => editPartner(currentUser.id, { city: event.target.value })}
          />
          <Input
            label="Their city"
            value={partner.city}
            onChange={(event) => editPartner(partner.id, { city: event.target.value })}
          />
        </div>

        <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-cream-100 px-4 py-3">
          <CalendarHeart className="h-4 w-4 shrink-0 text-sage-800" aria-hidden />
          <p className="text-xs text-ink-500">
            {currentUser.city} ↔ {partner.city} · {couple.timezoneLabel}
          </p>
        </div>
      </Card>

      <Card as="section">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-title-section text-ink-900">Settings &amp; Privacy</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
              Reminders, quiet hours, reaction sounds, the weekly recap and the two irreversible
              actions now live together on one page.
            </p>
          </div>
          <Button to="/app/settings" variant="secondary" size="sm" className="shrink-0">
            <Settings className="h-4 w-4" aria-hidden />
            Open settings
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-sm text-ink-500">
        <Link to="/app" className="inline-flex items-center gap-2 hover:text-rose-800">
          <Heart className="h-4 w-4" aria-hidden />
          Back to today
        </Link>
        <span className="inline-flex items-center gap-2">
          <CalendarHeart className="h-4 w-4" aria-hidden />
          {couple.timezoneLabel} · reminders follow your local time
        </span>
      </div>

      <Modal
        open={Boolean(editing && draft)}
        onClose={() => setEditing(null)}
        title={editing?.id === currentUser?.id ? 'Edit your profile' : `Edit ${editing?.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar src={draft.avatarUrl} initials={draft.name?.charAt(0)} size="xl" ring />
              <div>
                <Button variant="secondary" size="sm" onClick={() => avatarRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  Change photo
                </Button>
                <p className="mt-2 text-xs text-ink-500">Uploads are local until Stage 3 storage.</p>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
              </div>
            </div>

            <Input
              label="Name"
              value={draft.name}
              onChange={(event) => {
                setDraft({ ...draft, name: event.target.value })
                setNameError(null)
              }}
              error={nameError ?? undefined}
            />
            <Input
              label="Nickname"
              hint="What you actually call each other."
              value={draft.nickname}
              onChange={(event) => setDraft({ ...draft, nickname: event.target.value })}
            />
            <Input
              label="City"
              value={draft.city}
              onChange={(event) => setDraft({ ...draft, city: event.target.value })}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

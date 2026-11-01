import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, PenLine } from 'lucide-react'
import DailyUpdateForm from '../components/updates/DailyUpdateForm'
import MoodBadge from '../components/updates/MoodBadge'
import PhotoCard from '../components/updates/PhotoCard'
import { UpdateReactions } from '../components/updates/ReactionBar'
import Button from '../components/ui/Button'
import { isToday, relativeTime } from '../lib/date'
import { useData } from '../context/useData'

export default function NewUpdate() {
  const { currentUser, partner, updates, publishUpdate, toggleReaction } = useData()
  const [publishing, setPublishing] = useState(false)
  // Kept from the publish result so the confirmation can show the moment it just created.
  const [published, setPublished] = useState(null)

  const myUserId = currentUser?.id
  const myLatest = updates.find((update) => update.authorId === myUserId)
  const postedToday = Boolean(myLatest && isToday(myLatest.createdAt))

  async function handlePublish(payload) {
    setPublishing(true)
    const created = await publishUpdate(payload)
    setPublishing(false)
    setPublished(created)
  }

  const backLink = (
    <Link
      to="/app"
      className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-rose-800"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to today
    </Link>
  )

  if (published) {
    return (
      <div className="space-y-7">
        <header>
          {backLink}
          <p className="mt-6 text-xs font-semibold uppercase tracking-eyebrow text-rose-800">
            New update
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
            That is on their phone.
          </h1>
        </header>

        <p className="flex items-start gap-3 rounded-3xl bg-sage-100 px-4 py-3 text-sm leading-relaxed text-sage-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Published. They will see it the moment they open their phone.
        </p>

        <PhotoCard
          update={published}
          author={currentUser}
          footer={<UpdateReactions update={published} currentUserId={myUserId} onToggle={toggleReaction} />}
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setPublished(null)}>
            <PenLine className="h-4 w-4" aria-hidden />
            Share another moment
          </Button>
          <Button to="/app" variant="secondary">
            Back to today
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <header>
        {backLink}
        <p className="mt-6 text-xs font-semibold uppercase tracking-eyebrow text-rose-800">
          New update
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
          Tell {partner.name.split(' ')[0]} about your day
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
          A photo and one line is enough. It lands on their phone the moment you publish.
        </p>
      </header>

      {postedToday && myLatest && (
        <p className="flex flex-wrap items-center gap-3 rounded-3xl bg-sand-100 px-4 py-3 text-sm leading-relaxed text-ink-700">
          <MoodBadge moodId={myLatest.moodId} size="sm" />
          <span>
            You already shared {relativeTime(myLatest.createdAt)} — publishing again adds another
            moment to the timeline.
          </span>
        </p>
      )}

      <DailyUpdateForm onSubmit={handlePublish} publishing={publishing} />
    </div>
  )
}

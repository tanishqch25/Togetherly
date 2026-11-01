import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Heart, PenLine, Sparkles } from 'lucide-react'
import CountdownCard from '../components/couple/CountdownCard'
import CoupleCounter from '../components/couple/CoupleCounter'
import MoodBadge from '../components/updates/MoodBadge'
import PhotoCard from '../components/updates/PhotoCard'
import { UpdateReactions } from '../components/updates/ReactionBar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { isToday, relativeTime } from '../lib/date'
import { useData } from '../context/useData'

function greeting(hour) {
  if (hour < 5) return 'Still awake'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Winding down'
}

function QuickLink({ to, icon: Icon, label, description }) {
  return (
    <Link
      to={to}
      className="surface group flex items-center gap-4 p-5 transition-shadow duration-200 hover:shadow-lift"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100 group-hover:text-rose-800">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="mt-0.5 truncate text-xs text-ink-500">{description}</p>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { couple, currentUser, partner, updates, toggleReaction, loading } = useData()
  const [now] = useState(() => new Date())

  const myUserId = currentUser?.id
  const partnerUpdate = useMemo(() => updates.find((update) => update.authorId === partner.id), [updates, partner.id])
  const myLatest = useMemo(() => updates.find((update) => update.authorId === myUserId), [updates, myUserId])

  if (loading) {
    return (
      <Card>
        <LoadingSpinner label="Loading your space" />
      </Card>
    )
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-rose-800">
          {greeting(now.getHours())}, {currentUser.nickname}
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
          {partnerUpdate
            ? `${partner.name} checked in ${relativeTime(partnerUpdate.createdAt)}.`
            : `${partner.name} has not posted today yet.`}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
          {partner.name} is in {partner.city}. Post a photo and a line so they know how your day is
          going.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <CoupleCounter anniversary={couple.anniversary} />
        <CountdownCard target={couple.nextMeeting} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section aria-labelledby="their-update">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="their-update" className="font-display text-title-section text-ink-900">
                From {partner.name.split(' ')[0]}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Newest
              </span>
            </div>

            {partnerUpdate ? (
              <PhotoCard
                update={partnerUpdate}
                author={partner}
                footer={<UpdateReactions update={partnerUpdate} currentUserId={myUserId} onToggle={toggleReaction} />}
              />
            ) : (
              <Card>
                <EmptyState
                  icon={Heart}
                  title={`No update from ${partner.name} yet`}
                  description="The moment they post, their photo, mood and message land right here."
                />
              </Card>
            )}
          </section>

          <section aria-labelledby="your-update">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="your-update" className="font-display text-title-section text-ink-900">
                Your update
              </h2>
              <Button variant="ghost" size="sm" to="/app/new">
                <PenLine className="h-4 w-4" aria-hidden />
                {myLatest ? 'Share another moment' : 'Add today’s update'}
              </Button>
            </div>

            {myLatest ? (
              <PhotoCard
                update={myLatest}
                author={currentUser}
                footer={<UpdateReactions update={myLatest} currentUserId={myUserId} onToggle={toggleReaction} />}
              />
            ) : (
              <Card>
                <EmptyState
                  icon={PenLine}
                  title="You have not posted yet"
                  description="One photo and one line is a whole day worth of telling."
                  action={
                    <Button size="sm" to="/app/new">
                      Write your first update
                    </Button>
                  }
                />
              </Card>
            )}

            {myLatest && isToday(myLatest.createdAt) && (
              <p className="mt-3 text-xs text-ink-500">
                You already shared today — that is the streak {partner.name} is looking for.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <QuickLink
            to="/app/memories"
            icon={BookOpen}
            label="Memories"
            description={`${updates.length} moments, grouped by month`}
          />
          <QuickLink
            to="/app/profile"
            icon={Heart}
            label="Your profile"
            description={`${currentUser.name} & ${partner.name}`}
          />

          <Card>
            <h2 className="font-display text-title-section text-ink-900">Their recent moods</h2>
            <ul className="mt-4 space-y-3">
              {updates
                .filter((update) => update.authorId === partner.id)
                .slice(0, 4)
                .map((update) => (
                  <li key={update.id} className="flex items-center justify-between gap-3">
                    <MoodBadge moodId={update.moodId} size="sm" />
                    <span className="shrink-0 text-xs text-ink-500">{relativeTime(update.createdAt)}</span>
                  </li>
                ))}
            </ul>
            {updates.filter((update) => update.authorId === partner.id).length === 0 && (
              <p className="mt-3 text-sm text-ink-500">Moods will collect here as they check in.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}

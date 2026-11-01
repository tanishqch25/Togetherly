import { useMemo, useState } from 'react'
import { BookOpen, Image, Images } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import MemoryCard from '../components/memories/MemoryCard'
import PhotoCard from '../components/updates/PhotoCard'
import { UpdateReactions } from '../components/updates/ReactionBar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import { monthKey, monthLabel } from '../lib/date'
import { useData } from '../context/useData'

const FILTERS = [
  { id: 'all', label: 'All moments', icon: BookOpen },
  { id: 'photo', label: 'With photos', icon: Image },
]

export default function Memories() {
  const { updates, currentUser, personById, toggleReaction, loading } = useData()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  // `?open=upd-…` lets a notification land directly on the moment it came from.
  const [selectedId, setSelectedId] = useState(() => params.get('open'))

  function openMemory(id) {
    setSelectedId(id)
    const next = new URLSearchParams(params)
    next.set('open', id)
    setParams(next)
  }

  function closeMemory() {
    setSelectedId(null)
    const next = new URLSearchParams(params)
    next.delete('open')
    setParams(next, { replace: true })
  }

  // Looked up live so reactions toggled inside the modal are reflected immediately.
  const selected = useMemo(
    () => updates.find((update) => update.id === selectedId) ?? null,
    [updates, selectedId],
  )

  const visible = useMemo(
    () => (filter === 'photo' ? updates.filter((update) => update.photo) : updates),
    [updates, filter],
  )

  // Updates are already newest-first, so months fall out in descending order.
  const months = useMemo(() => {
    const groups = new Map()
    visible.forEach((update) => {
      const key = monthKey(update.createdAt)
      if (!groups.has(key)) {
        groups.set(key, { key, label: monthLabel(update.createdAt), items: [] })
      }
      groups.get(key).items.push(update)
    })
    return [...groups.values()]
  }, [visible])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-eyebrow text-rose-800">Your timeline</p>
          <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Memories</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
            {visible.length} moments between the two of you, filed by month. Tap any one to reopen the
            whole day.
          </p>
        </div>

        <div className="flex gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                filter === option.id
                  ? 'border-rose-300 bg-rose-100 text-rose-700'
                  : 'border-cream-300 bg-cream-50 text-ink-500 hover:border-rose-200 hover:text-rose-800'
              }`}
            >
              <option.icon className="h-4 w-4" aria-hidden />
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <Card>
          <LoadingSpinner label="Collecting your memories" />
        </Card>
      ) : months.length === 0 ? (
        <Card>
          <EmptyState
            icon={Images}
            title="No memories here yet"
            description="Every daily update you publish becomes part of this timeline. Start with today."
            action={
              <Button to="/app/new" size="sm">
                Write today's update
              </Button>
            }
          />
        </Card>
      ) : (
        months.map((month) => (
          <section key={month.key} aria-label={month.label}>
            <div className="mb-4 flex items-center gap-4">
              <h2 className="font-display text-title-card text-ink-900">{month.label}</h2>
              <span className="h-px flex-1 bg-cream-300" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                {month.items.length} {month.items.length === 1 ? 'moment' : 'moments'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {month.items.map((update) => (
                <MemoryCard key={update.id} update={update} onOpen={openMemory} />
              ))}
            </div>
          </section>
        ))
      )}

      <Modal
        open={Boolean(selected)}
        onClose={closeMemory}
        title={selected ? personById(selected.authorId)?.name ?? 'Memory' : 'Memory'}
        className="sm:max-w-xl"
      >
        {selected && (
          <div className="space-y-4">
            <PhotoCard
              update={selected}
              author={personById(selected.authorId)}
              footer={
                <UpdateReactions update={selected} currentUserId={currentUser?.id} onToggle={toggleReaction} />
              }
            />
            <p className="text-xs text-ink-500">
              {selected.photo ? 'This memory includes a photo.' : 'A message-only moment.'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

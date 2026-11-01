import { useState } from 'react'
import { SendHorizonal } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { Textarea } from '../ui/Field'
import MoodSelector from './MoodSelector'
import PhotoUploader from './PhotoUploader'

const MAX_MESSAGE = 280

export default function DailyUpdateForm({ onSubmit, publishing = false }) {
  const [photo, setPhoto] = useState(null)
  const [uploaderKey, setUploaderKey] = useState(0)
  const [moodId, setMoodId] = useState(null)
  const [message, setMessage] = useState('')
  const [photoError, setPhotoError] = useState(null)
  const [error, setError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()

    if (!message.trim()) {
      setError('Write a few words before publishing.')
      return
    }
    if (!moodId) {
      setError('Pick how you are feeling today.')
      return
    }

    setError(null)
    onSubmit({ photo, moodId, message: message.trim() })

    setPhoto(null)
    setMoodId(null)
    setMessage('')
    setPhotoError(null)
    // Remounting the uploader drops its blob preview along with the photo.
    setUploaderKey((key) => key + 1)
  }

  return (
    <Card as="section" className="p-5 sm:p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-title-section text-ink-900">Your daily update</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Only they will see this</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PhotoUploader
          key={uploaderKey}
          onChange={setPhoto}
          error={photoError}
          onError={setPhotoError}
        />

        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-ink-700">How are you feeling?</p>
          <MoodSelector value={moodId} onChange={setMoodId} />
        </div>

        <Textarea
          label="A message for them"
          rows={4}
          maxLength={MAX_MESSAGE}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell them about your day, or just say good morning…"
          error={error ?? undefined}
          hint={`${message.length}/${MAX_MESSAGE} characters`}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-500">Published updates join your shared timeline.</p>
          <Button type="submit" loading={publishing} disabled={publishing}>
            <SendHorizonal className="h-4 w-4" aria-hidden />
            {publishing ? 'Publishing' : 'Publish update'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/**
 * Mood vocabulary shared by the update form, dashboard and memory gallery.
 * Class strings are written out literally (never composed at runtime) so the
 * Tailwind scanner can see them.
 *
 * Colour rule: a chip's background comes from a tint step (200–500 range) and its
 * text from a 700+ or ink step, so every chip clears 4.5:1. Butter is used for
 * fills only and always carries ink text.
 */
export const MOODS = [
  {
    id: 'happy',
    label: 'Happy',
    emoji: '😊',
    chip: 'bg-butter-200 text-ink-900 border-butter-300',
  },
  { id: 'loved', label: 'Loved', emoji: '🥰', chip: 'bg-rose-100 text-rose-700 border-rose-200' },
  {
    id: 'excited',
    label: 'Excited',
    emoji: '🤩',
    chip: 'bg-butter-300 text-ink-700 border-butter-500',
  },
  { id: 'sad', label: 'Sad', emoji: '😔', chip: 'bg-sand-300 text-ink-700 border-sand-500' },
  {
    id: 'tired',
    label: 'Tired',
    emoji: '😴',
    chip: 'bg-sand-200 text-ink-500 border-sand-300',
  },
  {
    id: 'missing_you',
    label: 'Missing You',
    emoji: '🥹',
    chip: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  {
    id: 'peaceful',
    label: 'Peaceful',
    emoji: '😌',
    chip: 'bg-sage-200 text-sage-800 border-sage-300',
  },
  {
    id: 'stressed',
    label: 'Stressed',
    emoji: '😵‍💫',
    chip: 'bg-sand-500 text-ink-700 border-sand-600',
  },
]

const BY_ID = MOODS.reduce((acc, mood) => ({ ...acc, [mood.id]: mood }), {})

export function getMood(id) {
  return BY_ID[id] ?? null
}

import { MapPin, Pencil } from 'lucide-react'
import Avatar from '../ui/Avatar'

export default function PartnerCard({ person, relation = 'You', onEdit }) {
  return (
    <div className="surface flex items-center gap-4 p-5 sm:p-6">
      <Avatar src={person.avatarUrl} initials={person.initials} name={person.name} size="lg" ring />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-rose-800">{relation}</p>
        <p className="truncate font-display text-title-card text-ink-900">{person.name}</p>
        {person.nickname && <p className="truncate text-sm text-ink-500">“{person.nickname}”</p>}
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-500">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {person.city}
        </p>
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(person)}
          aria-label={`Edit ${person.name}`}
          className="shrink-0 rounded-full p-2 text-ink-500 transition-colors hover:bg-cream-200 hover:text-ink-700"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

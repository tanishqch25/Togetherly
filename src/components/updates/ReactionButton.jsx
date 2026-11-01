export default function ReactionButton({ reaction, count = 0, active = false, onClick }) {
  const Icon = reaction.icon

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={reaction.label}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
        active
          ? 'border-rose-200 bg-rose-100 text-rose-700'
          : 'border-cream-300 bg-cream-50 text-ink-500 hover:border-rose-200 hover:text-rose-800'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden />
      {reaction.label}
      {count > 0 && <span className="tabular-nums text-ink-500">{count}</span>}
      <span className="sr-only">{active ? 'reacted' : 'not reacted'}</span>
    </button>
  )
}

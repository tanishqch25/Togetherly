export default function Switch({ label, description, checked, onChange, disabled = false }) {
  return (
    <label
      className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-900">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{description}</span>}
      </span>

      <span className="relative shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden
          className="block h-6 w-11 rounded-full bg-cream-300 transition-colors duration-200 peer-checked:bg-rose-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rose-800"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-cream-50 shadow-soft transition-transform duration-200 peer-checked:translate-x-5"
        />
      </span>
    </label>
  )
}

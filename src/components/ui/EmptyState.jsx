export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <h3 className="font-display text-title-card text-ink-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

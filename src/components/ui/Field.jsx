import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

const CONTROL =
  'w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-ink-900 placeholder:text-ink-500 transition-colors duration-200 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100'

function Wrapper({ id, label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ label, hint, error, className = '', id: providedId, ...rest }) {
  const generated = useId()
  const id = providedId ?? generated
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={`${CONTROL} ${error ? 'border-rose-300' : ''} ${className}`}
        {...rest}
      />
    </Wrapper>
  )
}

export function Textarea({ label, hint, error, rows = 4, className = '', id: providedId, ...rest }) {
  const generated = useId()
  const id = providedId ?? generated
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`${CONTROL} resize-none ${error ? 'border-rose-300' : ''} ${className}`}
        {...rest}
      />
    </Wrapper>
  )
}

export function Select({ label, hint, error, className = '', id: providedId, children, ...rest }) {
  const generated = useId()
  const id = providedId ?? generated
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <span className="relative block">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={`${CONTROL} cursor-pointer appearance-none pr-11 ${
            error ? 'border-rose-300' : ''
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
          aria-hidden
        />
      </span>
    </Wrapper>
  )
}

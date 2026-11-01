import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-rose-800 text-cream-50 hover:bg-rose-900 active:bg-rose-950 shadow-soft disabled:hover:bg-rose-800',
  secondary:
    'bg-cream-50 text-ink-900 border border-cream-300 hover:border-rose-300 hover:text-rose-800',
  soft: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  ghost: 'text-ink-500 hover:text-ink-900 hover:bg-cream-200',
}

const SIZES = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55'

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  to,
  href,
  className = '',
  children,
  ...rest
}) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </a>
    )
  }

  return (
    <button type={rest.type ?? 'button'} className={classes} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

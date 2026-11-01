const SIZES = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-24 w-24 text-3xl',
}

export default function Avatar({ src, initials, name, size = 'md', ring = false, className = '' }) {
  const sizing = SIZES[size] ?? SIZES.md

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s photo` : 'Profile photo'}
        className={`${sizing} shrink-0 rounded-full object-cover ${
          ring ? 'ring-2 ring-rose-200 ring-offset-2 ring-offset-cream-50' : ''
        } ${className}`}
      />
    )
  }

  return (
    <span
      aria-hidden={name ? undefined : true}
      className={`${sizing} inline-flex shrink-0 items-center justify-center rounded-full bg-rose-100 font-display font-semibold text-rose-700 ${
        ring ? 'ring-2 ring-rose-200 ring-offset-2 ring-offset-cream-50' : ''
      } ${className}`}
      title={name}
    >
      {initials ?? '?'}
    </span>
  )
}

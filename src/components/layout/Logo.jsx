import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

const MARK = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }
const WORDMARK = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }

export default function Logo({ size = 'md', href = '/', className = '' }) {
  return (
    <Link to={href} className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${MARK[size]} inline-flex items-center justify-center rounded-2xl bg-cream-50 shadow-soft ring-1 ring-rose-100 transition-transform duration-200 group-hover:-rotate-6`}
      >
        <Heart className="h-4 w-4 fill-rose-500 text-rose-500 transition-colors group-hover:fill-rose-500 group-hover:text-rose-800" />
      </span>
      <span className={`font-display font-semibold tracking-tight text-ink-900 ${WORDMARK[size]}`}>
        Togetherly
      </span>
    </Link>
  )
}

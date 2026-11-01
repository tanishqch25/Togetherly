import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ label = 'Loading', className = '' }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-rose-700" aria-hidden />
      <p className="text-sm text-ink-500">{label}…</p>
    </div>
  )
}

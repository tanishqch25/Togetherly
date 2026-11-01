import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Disclosure popover shared by the notification bell and the account menu.
 * Closes on outside pointer-down, on Escape (which returns focus to the
 * trigger) and when a link inside the panel is followed.
 */
export default function Menu({
  trigger,
  label,
  className = '',
  rootClassName = 'relative',
  panelClassName = '',
  children,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useLayoutEffect(() => {
    if (open) panelRef.current?.querySelector('a, button, select, input')?.focus()
  }, [open])

  return (
    <div ref={rootRef} className={rootClassName}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className={className}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          onClick={(event) => {
            if (event.target.closest('a')) setOpen(false)
          }}
          className={`absolute right-0 z-50 mt-2 w-[min(21rem,calc(100vw-2.5rem))] rounded-4xl border border-cream-200 bg-cream-50 shadow-lift ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

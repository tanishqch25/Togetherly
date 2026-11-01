import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'

const MAX_BYTES = 10 * 1024 * 1024

export default function PhotoUploader({ onChange, error, onError }) {
  const pickRef = useRef(null)
  const captureRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // The blob URL is created in the pick handler below. This cleanup revokes the
  // previous URL whenever a new one arrives, and on unmount.
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  function handleFiles(selected) {
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      onError('Please choose an image file.')
      return
    }
    if (selected.size > MAX_BYTES) {
      onError('That image is over 10 MB. Pick a smaller one.')
      return
    }
    onError(null)
    setPreviewUrl(URL.createObjectURL(selected))
    onChange(selected)
  }

  function clearPhoto() {
    setPreviewUrl(null)
    onError(null)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="group relative overflow-hidden rounded-4xl border border-cream-300 bg-cream-200">
          <img
            src={previewUrl}
            alt="Selected photo preview"
            className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <button
            type="button"
            onClick={clearPhoto}
            aria-label="Remove photo"
            className="absolute right-3 top-3 rounded-full bg-ink-900/55 p-2 text-cream-50 backdrop-blur-sm transition-colors hover:bg-ink-900/75"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-4xl border border-dashed border-cream-300 bg-cream-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ImagePlus className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Add today's photo</p>
              <p className="text-xs text-ink-500">JPG or PNG, up to 10 MB</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => captureRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-rose-200 hover:text-rose-800"
            >
              <Camera className="h-4 w-4" aria-hidden />
              Capture
            </button>
            <button
              type="button"
              onClick={() => pickRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-rose-800 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-rose-900"
            >
              <ImagePlus className="h-4 w-4" aria-hidden />
              Upload
            </button>
          </div>
        </div>
      )}

      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files?.[0])}
      />
      {/* `capture` nudges mobile browsers straight to the camera. */}
      <input
        ref={captureRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files?.[0])}
      />

      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  )
}

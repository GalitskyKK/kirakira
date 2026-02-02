import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Card } from '@/components/ui'
import {
  hasSeenPageHint,
  markPageHintSeen,
  type PageHintId,
} from '@/utils/storage'

interface PageHintProps {
  readonly id: PageHintId
  readonly title: string
  readonly description: string
  readonly actionLabel: string
  readonly targetSelector?: string
  readonly className?: string
  readonly onDismiss?: () => void
}

interface HighlightRect {
  readonly top: number
  readonly left: number
  readonly width: number
  readonly height: number
}

export function PageHint({
  id,
  title,
  description,
  actionLabel,
  targetSelector,
  className,
  onDismiss,
}: PageHintProps) {
  const [isVisible, setIsVisible] = useState(() => !hasSeenPageHint(id))
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)

  useEffect(() => {
    setIsVisible(!hasSeenPageHint(id))
  }, [id])

  useEffect(() => {
    if (!isVisible || typeof document === 'undefined') return
    const root = document.documentElement
    const body = document.body
    const prevRootOverflow = root.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevRootOverscroll = root.style.overscrollBehavior
    const prevBodyOverscroll = body.style.overscrollBehavior

    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    root.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'

    return () => {
      root.style.overflow = prevRootOverflow
      body.style.overflow = prevBodyOverflow
      root.style.overscrollBehavior = prevRootOverscroll
      body.style.overscrollBehavior = prevBodyOverscroll
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible || !targetSelector || typeof window === 'undefined') {
      setHighlightRect(null)
      return
    }

    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(targetSelector)
      if (!target) {
        setHighlightRect(null)
        return
      }
      const rect = target.getBoundingClientRect()
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    updateRect()

    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    const target = document.querySelector<HTMLElement>(targetSelector)
    const resizeObserver =
      target && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateRect)
        : null

    if (target && resizeObserver) {
      resizeObserver.observe(target)
    }

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
      resizeObserver?.disconnect()
    }
  }, [isVisible, targetSelector])

  const handleDismiss = useCallback(() => {
    markPageHintSeen(id)
    setIsVisible(false)
    onDismiss?.()
  }, [id, onDismiss])

  if (!isVisible) return null

  const hintBody = (
    <>
      <div
        className="fixed inset-0 z-[1980] bg-transparent"
        onWheel={event => event.preventDefault()}
        onTouchMove={event => event.preventDefault()}
        style={{ touchAction: 'none' }}
      />
      {highlightRect && (
        <div
          className="pointer-events-none fixed z-[1990] rounded-2xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] dark:border-white/70"
          style={{
            top: Math.max(highlightRect.top - 8, 8),
            left: Math.max(highlightRect.left - 8, 8),
            width: Math.max(highlightRect.width + 16, 0),
            height: Math.max(highlightRect.height + 16, 0),
          }}
        />
      )}
      <div className="fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-[2000] flex justify-center px-4 sm:bottom-6">
        <Card className={`max-w-[320px] ${className ?? ''}`} padding="sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 sm:text-xs">
                {title}
              </p>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-300 sm:text-[11px]">
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={actionLabel}
              className="rounded-full p-1 text-neutral-500 transition hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-2 text-[10px] font-semibold text-kira-600 hover:text-kira-700 dark:text-kira-300 dark:hover:text-kira-200"
          >
            {actionLabel}
          </button>
        </Card>
      </div>
    </>
  )

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(hintBody, document.body)
}

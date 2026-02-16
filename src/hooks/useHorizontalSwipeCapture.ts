/**
 * Хук для каруселей в Telegram WebApp (iOS).
 * Предотвращает propagation touch-событий к родительскому скроллу,
 * когда пользователь свайпит горизонтально — иначе приложение "дергается".
 * Использует native addEventListener с passive: false (React по умолчанию passive: true).
 */

import type { MutableRefObject, RefObject } from 'react'
import { useRef, useCallback, useEffect } from 'react'

const HORIZONTAL_THRESHOLD = 1.2 // Если |deltaX| > |deltaY| * threshold — считаем горизонтальным

function assignRef<T>(ref: RefObject<T> | ((node: T | null) => void) | null, node: T | null): void {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(node)
  } else {
    ;(ref as MutableRefObject<T | null>).current = node
  }
}

export function useHorizontalSwipeCapture<T extends HTMLElement = HTMLDivElement>(
  forwardedRef?: RefObject<T> | ((node: T | null) => void) | null
) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isHorizontalRef = useRef<boolean | null>(null)
  const elementRef = useRef<T | null>(null)

  const setRef = useCallback(
    (node: T | null) => {
      elementRef.current = node
      if (forwardedRef) assignRef(forwardedRef, node)
    },
    [forwardedRef]
  )

  useEffect(() => {
    const el = elementRef.current as HTMLDivElement | null
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        isHorizontalRef.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.touches[0]
      if (!touch) return

      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)

      if (isHorizontalRef.current === null && (deltaX > 5 || deltaY > 5)) {
        isHorizontalRef.current = deltaX > deltaY * HORIZONTAL_THRESHOLD
      }

      if (isHorizontalRef.current === true) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      touchStartRef.current = null
      isHorizontalRef.current = null
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [])

  return { ref: setRef }
}

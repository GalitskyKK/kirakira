/**
 * 📜 Хук для управления скроллом в SPA
 * Автоматически скроллит наверх при открытии страниц
 */

import { useEffect, useRef } from 'react'

interface UseScrollToTopOptions {
  readonly enabled?: boolean
  readonly behavior?: ScrollBehavior
  readonly delay?: number
}

export function useScrollToTop(options: UseScrollToTopOptions = {}) {
  const { enabled = true, behavior = 'smooth', delay = 0 } = options

  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    if (!enabled) return

    const scrollElement = containerRef.current || window
    const scrollTo = (element: HTMLElement | Window) => {
      if (element === window) {
        window.scrollTo({ top: 0, behavior })
      } else {
        element.scrollTo({ top: 0, behavior })
      }
    }

    if (delay > 0) {
      setTimeout(() => scrollTo(scrollElement), delay)
    } else {
      scrollTo(scrollElement)
    }
  }

  // Автоматический скролл при монтировании
  useEffect(() => {
    if (enabled) {
      scrollToTop()
    }
  }, [enabled])

  return {
    containerRef,
    scrollToTop,
  }
}

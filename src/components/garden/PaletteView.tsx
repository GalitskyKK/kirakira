/**
 * 🎨 Компонент палитры настроений
 * Canvas-based визуализация настроений
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMoodTracking } from '@/hooks/useMoodTracking'
import {
  convertMoodHistoryToPalette,
  type PaletteMetaBall,
  type PaletteGenerationOptions,
} from '@/utils/paletteData'
import { VibeCanvas } from '@/components/garden/VibeCanvas'

interface PaletteViewProps {
  readonly className?: string
  readonly width?: number
  readonly height?: number
}

/**
 * Конвертирует HSL в RGB (0-1)
 */
function hslToRgbNormalized(
  h: number,
  s: number,
  l: number
): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

export function PaletteView({
  className = '',
  width,
  height,
}: PaletteViewProps) {
  // Адаптивные размеры для мобильных устройств
  const [canvasSize, setCanvasSize] = useState({ width: 650, height: 650 })
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    const updateSize = () => {
      // Максимальные размеры для стабильности генерации
      const fixedWidth = 650
      const fixedHeight = 650

      // Используем минимальные значения, чтобы избежать постепенного уменьшения
      const minWidth = 300
      const minHeight = 400

      // Адаптивная ширина и высота с максимумом (для прямоугольной формы на мобильных)
      // Используем доступную высоту окна для стабильности (не зависеть от размера контейнера)
      const availableHeight = window.innerHeight - 200
      const availableWidth = window.innerWidth - 32

      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()

        // Ширина: берем из контейнера, но с защитой
        const containerWidth = Math.max(
          minWidth,
          Math.min(containerRect.width || availableWidth, fixedWidth)
        )
        // Высота: всегда используем доступную высоту окна (не контейнера!) для избежания циклов
        const containerHeight = Math.max(
          minHeight,
          Math.min(availableHeight, fixedHeight)
        )

        setCanvasSize(prevSize => {
          // Обновляем только если новый размер больше предыдущего или если разница значительная
          // Это предотвращает постепенное уменьшение
          const newWidth = width ?? containerWidth
          const newHeight = height ?? containerHeight

          // Защита от циклов ресайза
          if (
            Math.abs(newWidth - prevSize.width) < 10 &&
            Math.abs(newHeight - prevSize.height) < 10
          ) {
            return prevSize
          }

          return {
            width: Math.min(newWidth, fixedWidth),
            height: Math.min(newHeight, fixedHeight),
          }
        })
      } else {
        const containerWidth = Math.max(
          minWidth,
          Math.min(window.innerWidth - 32, fixedWidth)
        )
        const containerHeight = Math.max(
          minHeight,
          Math.min(window.innerHeight - 200, fixedHeight)
        )
        setCanvasSize({
          width: width ?? containerWidth,
          height: height ?? containerHeight,
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // Используем ResizeObserver для более точного отслеживания размера контейнера
    const setupResizeObserver = () => {
      if (containerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0) {
              updateSize()
            }
          }
        })
        resizeObserverRef.current.observe(containerRef.current)
      }
    }

    const timeoutId = setTimeout(setupResizeObserver, 100)

    return () => {
      window.removeEventListener('resize', updateSize)
      clearTimeout(timeoutId)
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
    }
  }, [width, height])

  const canvasWidth = width ?? canvasSize.width
  const canvasHeight = height ?? canvasSize.height

  const { moodHistory } = useMoodTracking()
  // const { isDark } = useTelegramTheme() // Unused for now as Vibe handles it

  const moodHistoryHashRef = useRef<string>('')
  const baseBallsRef = useRef<readonly PaletteMetaBall[]>([])

  // Генерация цветов из истории настроений
  const generateColors = useCallback((): [number, number, number][] => {
    if (moodHistory.length === 0) {
      return []
    }

    const lastEntry = moodHistory[0]
    const moodSum = moodHistory.reduce((sum, entry) => {
      return sum + entry.date.getTime() + entry.mood.charCodeAt(0)
    }, 0)
    const historyHash = `${moodHistory.length}_${lastEntry?.date.getTime() ?? 0}_${lastEntry?.mood ?? ''}_${moodSum}`

    if (
      historyHash === moodHistoryHashRef.current &&
      baseBallsRef.current.length > 0
    ) {
      // Возвращаем сохраненные цвета
      return baseBallsRef.current.map(ball =>
        hslToRgbNormalized(ball.colorHsl.h, ball.colorHsl.s, ball.colorHsl.l)
      )
    }

    let seed = 0
    for (let i = 0; i < historyHash.length; i++) {
      const char = historyHash.charCodeAt(i)
      seed = ((seed << 5) - seed + char) | 0
    }
    seed = Math.abs(seed) || 1

    const options: PaletteGenerationOptions = {
      width: 650,
      height: 650,
      period: 'month',
      maxBalls: 6,
      minRadius: 40,
      maxRadius: 160,
      seed,
    }

    const baseBalls = convertMoodHistoryToPalette(moodHistory, options)
    moodHistoryHashRef.current = historyHash
    baseBallsRef.current = baseBalls

    // Reverse the order so most frequent moods render on top (last in loop)
    const colors = baseBalls.map(ball =>
      hslToRgbNormalized(ball.colorHsl.h, ball.colorHsl.s, ball.colorHsl.l)
    )
    return colors.reverse()
  }, [moodHistory])

  const colors = useMemo(() => generateColors(), [generateColors])

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <VibeCanvas
        width={canvasWidth}
        height={canvasHeight}
        className="rounded-2xl border border-neutral-200/50 shadow-lg dark:border-neutral-700/50"
        config={{
          ...(colors.length > 0 ? { colors } : { hue: 210 }),
          baseScale: 1,
          energy: 0.2 + (moodHistory.length > 0 ? 0.1 : 0),
        }}
      />

      {moodHistory.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-neutral-50/80 backdrop-blur-sm dark:bg-neutral-900/80">
          <div className="text-center">
            <div className="mb-2 text-4xl">🎨</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Отметьте настроение, чтобы увидеть палитру
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

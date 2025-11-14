/**
 * 🎨 Компонент палитры настроений
 * Canvas-based визуализация настроений
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useMoodTracking } from '@/hooks/useMoodTracking'
import {
  convertMoodHistoryToPalette,
  type PaletteMetaBall,
  type PaletteGenerationOptions,
} from '@/utils/paletteData'

interface PaletteViewProps {
  readonly className?: string
  readonly width?: number
  readonly height?: number
}

/**
 * Конвертирует HSL в RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
  ]
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
      // Используем реальную ширину и высоту контейнера
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        // Используем реальную ширину контейнера
        const containerWidth = Math.min(containerRect.width, 650)
        // Используем реальную высоту контейнера (почти весь доступный экран)
        const containerHeight = Math.min(
          containerRect.height > 0
            ? containerRect.height
            : window.innerHeight - 200,
          650
        )
        setCanvasSize({
          width: width ?? containerWidth,
          height: height ?? containerHeight,
        })
      } else {
        
        const containerWidth = Math.min(window.innerWidth - 32, 650)
        // Для палитры используем больше высоты
        const containerHeight = Math.min(window.innerHeight - 200, 650)
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
        resizeObserverRef.current = new ResizeObserver(updateSize)
        resizeObserverRef.current.observe(containerRef.current)
      }
    }

    const timeoutId = setTimeout(setupResizeObserver, 0)

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const ballsRef = useRef<readonly PaletteMetaBall[]>([])
  const baseBallsRef = useRef<readonly PaletteMetaBall[]>([]) // Базовые шары с фиксированными размерами
  const moodHistoryHashRef = useRef<string>('') // Хеш истории для отслеживания изменений
  const timeRef = useRef(0)
  const [isInitialized, setIsInitialized] = useState(false)

  const { moodHistory } = useMoodTracking()

  // Фиксированные размеры для стабильной генерации
  const FIXED_WIDTH = 650
  const FIXED_HEIGHT = 650

  // Генерация базовых шаров из истории настроений (только при изменении истории)
  const generateBaseBalls = useCallback((): readonly PaletteMetaBall[] => {
    if (moodHistory.length === 0) {
      return []
    }

    // Создаем более надежный хеш истории для отслеживания изменений
    // Используем длину истории, дату последней записи и сумму всех настроений
    // Это гарантирует обновление при любом изменении истории
    const lastEntry = moodHistory[0] // Первая запись - самая новая (история отсортирована)
    const moodSum = moodHistory.reduce((sum, entry) => {
      // Создаем уникальный идентификатор для каждой записи
      return sum + entry.date.getTime() + entry.mood.charCodeAt(0)
    }, 0)
    const historyHash = `${moodHistory.length}_${lastEntry?.date.getTime() ?? 0}_${lastEntry?.mood ?? ''}_${moodSum}`

    // Если история не изменилась, возвращаем существующие шары
    if (
      historyHash === moodHistoryHashRef.current &&
      baseBallsRef.current.length > 0
    ) {
      return baseBallsRef.current
    }

    const options: PaletteGenerationOptions = {
      width: FIXED_WIDTH,
      height: FIXED_HEIGHT,
      period: 'month', // Используем месяц для более стабильной визуализации
      maxBalls: 6, // Максимум 6 шаров (по одному на каждое настроение)
      minRadius: 40, // Фиксированный минимальный радиус
      maxRadius: 160, // Фиксированный максимальный радиус
    }

    const baseBalls = convertMoodHistoryToPalette(moodHistory, options)
    moodHistoryHashRef.current = historyHash
    baseBallsRef.current = baseBalls

    return baseBalls
  }, [moodHistory])

  // Масштабирование базовых шаров под текущий размер canvas
  const scaleBalls = useCallback(
    (baseBalls: readonly PaletteMetaBall[]): readonly PaletteMetaBall[] => {
      if (baseBalls.length === 0) {
        return []
      }

      const scaleX = canvasWidth / FIXED_WIDTH
      const scaleY = canvasHeight / FIXED_HEIGHT
      const scale = Math.min(scaleX, scaleY) // Используем минимальный масштаб для сохранения пропорций

      return baseBalls.map(ball => ({
        ...ball,
        x: ball.x * scaleX,
        y: ball.y * scaleY,
        radius: ball.radius * scale,
        // Масштабируем скорости пропорционально для сохранения визуальной скорости
        vx: ball.vx * scale,
        vy: ball.vy * scale,
      }))
    },
    [canvasWidth, canvasHeight]
  )

  // Инициализация базовых шаров (только при изменении истории настроений)
  useEffect(() => {
    const baseBalls = generateBaseBalls()
    baseBallsRef.current = baseBalls
    const scaledBalls = scaleBalls(baseBalls)
    ballsRef.current = scaledBalls
    setIsInitialized(true)
  }, [generateBaseBalls, scaleBalls])

  // Масштабирование шаров при изменении размера canvas (без перегенерации)
  useEffect(() => {
    if (baseBallsRef.current.length > 0 && isInitialized) {
      const scaledBalls = scaleBalls(baseBallsRef.current)
      ballsRef.current = scaledBalls
    }
  }, [canvasWidth, canvasHeight, scaleBalls, isInitialized])

  // Анимация
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isInitialized) {
      return
    }

    const ctx = canvas.getContext('2d', { alpha: false })
    if (ctx === null) {
      return
    }

    let isRunning = true

    const drawMetaBalls = () => {
      if (!isRunning) {
        return
      }

      const imageData = ctx.createImageData(canvasWidth, canvasHeight)
      const data = imageData.data
      const balls = ballsRef.current

      // Очищаем canvas с легким затуханием
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Рисуем мета-шары с смешиванием цветов (шаг 1px для максимального сглаживания)
      for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
          let sum = 0
          let totalR = 0
          let totalG = 0
          let totalB = 0
          let weights = 0

          // Вычисляем влияние всех шаров и смешиваем их цвета
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
          for (const ball of balls) {
            const dx = x - ball.x
            const dy = y - ball.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const influence = (ball.radius * ball.radius) / (dist * dist + 1)
            sum += influence

            // Смешиваем цвета от всех влияющих шаров
            if (influence > 0.05) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
              const colorHsl = ball.colorHsl
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              const rgb = hslToRgb(colorHsl.h, colorHsl.s, colorHsl.l)
              totalR += rgb[0] * influence
              totalG += rgb[1] * influence
              totalB += rgb[2] * influence
              weights += influence
            }
          }

          // Создаем плавный градиент с мягким переходом
          const threshold = 1.0
          if (sum > threshold) {
            // Более плавная интерполяция интенсивности для сглаживания границ
            const intensity = Math.min(1, (sum - threshold) * 1.5)

            // Усредненный цвет от всех влияющих шаров
            const r = weights > 0 ? totalR / weights : 255
            const g = weights > 0 ? totalG / weights : 255
            const b = weights > 0 ? totalB / weights : 255

            // Добавляем яркость на основе интенсивности
            const boost = 1 + intensity * 0.3
            const finalR = Math.min(255, Math.round(r * boost))
            const finalG = Math.min(255, Math.round(g * boost))
            const finalB = Math.min(255, Math.round(b * boost))

            // Плавное затухание на границах через альфа-канал
            const alpha = Math.min(255, Math.round(intensity * 255))

            const idx = (y * canvasWidth + x) * 4
            data[idx] = finalR
            data[idx + 1] = finalG
            data[idx + 2] = finalB
            data[idx + 3] = alpha
          } else if (sum > threshold * 0.7) {
            // Плавный переход на границах (антиалиасинг)
            const fadeIntensity = (sum - threshold * 0.7) / (threshold * 0.3)
            const intensity = Math.min(1, fadeIntensity * 1.5)

            const r = weights > 0 ? totalR / weights : 255
            const g = weights > 0 ? totalG / weights : 255
            const b = weights > 0 ? totalB / weights : 255

            const boost = 1 + intensity * 0.3
            const finalR = Math.min(255, Math.round(r * boost))
            const finalG = Math.min(255, Math.round(g * boost))
            const finalB = Math.min(255, Math.round(b * boost))
            const alpha = Math.min(255, Math.round(intensity * 255 * 0.5))

            const idx = (y * canvasWidth + x) * 4
            data[idx] = finalR
            data[idx + 1] = finalG
            data[idx + 2] = finalB
            data[idx + 3] = alpha
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // Добавляем многослойное размытие для максимально мягких краёв (как в HTML)
      ctx.filter = 'blur(50px)'
      ctx.drawImage(canvas, 0, 0)
      ctx.filter = 'blur(30px)'
      ctx.drawImage(canvas, 0, 0)
      ctx.filter = 'none'
    }

    const animate = () => {
      if (!isRunning) {
        return
      }

      // Обновляем позиции шаров
      const balls = ballsRef.current
      const updatedBalls: PaletteMetaBall[] = []

      for (const ball of balls) {
        let newX = ball.x + ball.vx
        let newY = ball.y + ball.vy

        // Отскок от границ
        if (newX < 0 || newX > canvasWidth) {
          newX = Math.max(0, Math.min(canvasWidth, newX))
        }
        if (newY < 0 || newY > canvasHeight) {
          newY = Math.max(0, Math.min(canvasHeight, newY))
        }

        // Инвертируем скорость при столкновении с границей
        let newVx = ball.vx
        let newVy = ball.vy

        if (newX <= 0 || newX >= canvasWidth) {
          newVx *= -1
        }
        if (newY <= 0 || newY >= canvasHeight) {
          newVy *= -1
        }

        updatedBalls.push({
          ...ball,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
        })
      }

      ballsRef.current = updatedBalls
      drawMetaBalls()

      timeRef.current += 0.01

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      isRunning = false
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth, canvasHeight, isInitialized])

  if (!isInitialized) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-kira-600 dark:border-neutral-700 dark:border-t-kira-400" />
      </div>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="rounded-2xl border border-neutral-200/50 shadow-lg dark:border-neutral-700/50"
        style={{
          background: 'transparent',
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
      {moodHistory.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-neutral-50/80 backdrop-blur-sm dark:bg-neutral-900/80">
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

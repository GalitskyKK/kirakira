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

  useEffect(() => {
    const updateSize = () => {
      const containerWidth = Math.min(window.innerWidth - 32, 650) // -32 для padding
      const containerHeight = Math.min(window.innerHeight * 0.6, 650)
      setCanvasSize({
        width: width ?? containerWidth,
        height: height ?? containerHeight,
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [width, height])

  const canvasWidth = width ?? canvasSize.width
  const canvasHeight = height ?? canvasSize.height
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const ballsRef = useRef<readonly PaletteMetaBall[]>([])
  const timeRef = useRef(0)
  const [isInitialized, setIsInitialized] = useState(false)

  const { moodHistory } = useMoodTracking()

  // Генерация шаров из истории настроений
  const generateBalls = useCallback((): readonly PaletteMetaBall[] => {
    if (moodHistory.length === 0) {
      return []
    }

    const options: PaletteGenerationOptions = {
      width: canvasWidth,
      height: canvasHeight,
      period: 'month', // Используем месяц для более стабильной визуализации
      maxBalls: 6, // Максимум 6 шаров (по одному на каждое настроение)
      minRadius: Math.min(40, canvasWidth * 0.06), // Минимальный радиус (для 10 отметок)
      maxRadius: Math.min(160, canvasWidth * 0.25), // Максимальный радиус (для 30+ отметок)
    }

    return convertMoodHistoryToPalette(moodHistory, options)
  }, [moodHistory, canvasWidth, canvasHeight])

  // Инициализация шаров
  useEffect(() => {
    const balls = generateBalls()
    ballsRef.current = balls
    setIsInitialized(true)
  }, [generateBalls])

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

      // Рисуем мета-шары с смешиванием цветов
      for (let y = 0; y < canvasHeight; y += 2) {
        for (let x = 0; x < canvasWidth; x += 2) {
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
            if (influence > 0.1) {
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

          // Создаем плавный градиент
          const threshold = 1.0
          if (sum > threshold) {
            const intensity = Math.min(1, (sum - threshold) * 2)

            // Усредненный цвет от всех влияющих шаров
            const r = weights > 0 ? totalR / weights : 255
            const g = weights > 0 ? totalG / weights : 255
            const b = weights > 0 ? totalB / weights : 255

            // Добавляем яркость на основе интенсивности
            const boost = 1 + intensity * 0.3
            const finalR = Math.min(255, Math.round(r * boost))
            const finalG = Math.min(255, Math.round(g * boost))
            const finalB = Math.min(255, Math.round(b * boost))

            const idx = (y * canvasWidth + x) * 4
            data[idx] = finalR
            data[idx + 1] = finalG
            data[idx + 2] = finalB
            data[idx + 3] = 255

            // Заполняем соседние пиксели для сглаживания
            if (x + 1 < canvasWidth) {
              const idx2 = (y * canvasWidth + x + 1) * 4
              data[idx2] = finalR
              data[idx2 + 1] = finalG
              data[idx2 + 2] = finalB
              data[idx2 + 3] = 255
            }
            if (y + 1 < canvasHeight) {
              const idx3 = ((y + 1) * canvasWidth + x) * 4
              data[idx3] = finalR
              data[idx3 + 1] = finalG
              data[idx3 + 2] = finalB
              data[idx3 + 3] = 255

              if (x + 1 < canvasWidth) {
                const idx4 = ((y + 1) * canvasWidth + x + 1) * 4
                data[idx4] = finalR
                data[idx4 + 1] = finalG
                data[idx4 + 2] = finalB
                data[idx4 + 3] = 255
              }
            }
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

  // Перегенерация при изменении истории
  useEffect(() => {
    const balls = generateBalls()
    ballsRef.current = balls
  }, [generateBalls])

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

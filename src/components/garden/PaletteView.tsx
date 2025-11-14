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
import { MOOD_CONFIG } from '@/types/mood'

interface PaletteViewProps {
  readonly className?: string
  readonly width?: number
  readonly height?: number
}

/**
 * Конвертирует HEX в RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
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
      maxBalls: 8, // Оптимальное количество для производительности
      minRadius: Math.min(60, canvasWidth * 0.1),
      maxRadius: Math.min(120, canvasWidth * 0.2),
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

      // Рисуем мета-шары
      for (let y = 0; y < canvasHeight; y += 2) {
        for (let x = 0; x < canvasWidth; x += 2) {
          let sum = 0

          // Вычисляем влияние всех шаров
          for (const ball of balls) {
            const dx = x - ball.x
            const dy = y - ball.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            sum += (ball.radius * ball.radius) / (dist * dist + 1)
          }

          // Создаем плавный градиент
          const threshold = 1.0
          if (sum > threshold) {
            const intensity = Math.min(1, (sum - threshold) * 2)

            // Определяем цвет на основе ближайшего шара
            let nearestBall: PaletteMetaBall | null = null
            let minDist = Infinity

            for (const ball of balls) {
              const dx = x - ball.x
              const dy = y - ball.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < minDist) {
                minDist = dist
                nearestBall = ball
              }
            }

            // Если нет ближайшего шара, пропускаем пиксель
            if (!nearestBall) {
              continue
            }

            // Цветовая анимация на основе настроения
            const moodConfig = MOOD_CONFIG[nearestBall.moodType]
            const baseRgb = hexToRgb(moodConfig.color)
            const [r, g, b] = baseRgb

            // Применяем интенсивность
            const finalR = Math.min(255, Math.round(r * intensity))
            const finalG = Math.min(255, Math.round(g * intensity))
            const finalB = Math.min(255, Math.round(b * intensity))

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

      // Добавляем размытие для плавности
      ctx.filter = 'blur(20px)'
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

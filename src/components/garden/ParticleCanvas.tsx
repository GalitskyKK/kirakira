import { useEffect, useRef, useState } from 'react'
import type { GardenTheme } from '@/hooks/useGardenTheme'

interface ParticleCanvasProps {
  theme: GardenTheme
  isLowPerf: boolean
  shouldUseAnimations: boolean
  particleDensity: number
  containerRef?: React.RefObject<HTMLDivElement>
}

/**
 * Оптимизированный Canvas для частиц вместо множества DOM элементов
 * Значительно снижает нагрузку на производительность
 */
export function ParticleCanvas({
  theme,
  isLowPerf,
  shouldUseAnimations,
  particleDensity,
  containerRef,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const particlesRef = useRef<Array<{
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    targetOpacity: number
    maxX?: number
    maxY?: number
  }>>([])
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  // Получаем размеры контейнера
  useEffect(() => {
    if (!containerRef?.current) return
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [containerRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const { width, height } = dimensions
    canvas.width = width
    canvas.height = height

    // Инициализация частиц с детерминированными позициями
    const pseudoRandom = (seed: number): number => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    // Пересоздаем частицы только если изменилась плотность или размеры
    if (particlesRef.current.length !== particleDensity || 
        particlesRef.current[0]?.maxX !== width) {
      particlesRef.current = Array.from({ length: particleDensity }, (_, i) => ({
        x: (10 + pseudoRandom(i * 137.5) * 80) * (width / 100),
        y: (10 + pseudoRandom(i * 97.3) * 80) * (height / 100),
        vx: (pseudoRandom(i * 19.3) - 0.5) * 0.5,
        vy: -0.3 - pseudoRandom(i * 42.7) * 0.2,
        size: 1 + pseudoRandom(i * 73.1) * 0.5,
        opacity: 0.3 + pseudoRandom(i * 91.2) * 0.5,
        targetOpacity: 0.3 + pseudoRandom(i * 91.2) * 0.5,
        maxX: width,
        maxY: height,
      }))
    } else {
      // Обновляем размеры существующих частиц
      particlesRef.current.forEach(p => {
        if (p.maxX && p.maxY) {
          p.x = (p.x / p.maxX) * width
          p.y = (p.y / p.maxY) * height
        }
        p.maxX = width
        p.maxY = height
      })
    }

    // Градиент для частиц
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, theme.particleFrom)
    gradient.addColorStop(1, theme.particleTo)

    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      if (isLowPerf || !shouldUseAnimations) {
        // Статичный режим - просто рисуем частицы
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = gradient
        particlesRef.current.forEach(p => {
          ctx.globalAlpha = p.opacity
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.globalAlpha = 1
        return
      }

      const delta = Math.min((currentTime - lastTime) / 16, 2) // Ограничиваем delta для стабильности
      lastTime = currentTime

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = gradient

      // Батчинг для оптимизации - рисуем все частицы одним проходом
      particlesRef.current.forEach(p => {
        // Обновление позиции
        p.x += p.vx * delta
        p.y += p.vy * delta

        // Ограничение границами
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) {
          p.y = height
          p.vy = -0.3 - pseudoRandom(p.x * 42.7) * 0.2
        }

        // Плавное изменение прозрачности (оптимизировано)
        if (Math.abs(p.opacity - p.targetOpacity) > 0.02) {
          p.opacity += (p.targetOpacity - p.opacity) * 0.1
        } else if (Math.floor(currentTime / 2000) !== Math.floor((currentTime - delta * 16) / 2000)) {
          // Обновляем targetOpacity только раз в 2 секунды
          p.targetOpacity = 0.3 + pseudoRandom(p.x + Math.floor(currentTime / 2000)) * 0.5
        }

        // Рисование частицы
        ctx.globalAlpha = p.opacity
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    if (shouldUseAnimations && !isLowPerf) {
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      // Статичный режим - один раз отрисовываем
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = gradient
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.opacity
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [theme.particleFrom, theme.particleTo, isLowPerf, shouldUseAnimations, particleDensity, dimensions])

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0 pointer-events-none"
      style={{
        imageRendering: 'pixelated',
        willChange: shouldUseAnimations && !isLowPerf ? 'contents' : 'auto',
      }}
    />
  )
}


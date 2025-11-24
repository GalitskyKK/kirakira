import { useState, useEffect } from 'react'

/**
 * Определяет, нужно ли уменьшать анимации для лучшей производительности
 * Учитывает:
 * - Системные настройки prefers-reduced-motion
 * - Производительность устройства (CPU cores, память)
 * - Является ли устройство мобильным
 */
export function useReducedMotion(): boolean {
  const [shouldReduce, setShouldReduce] = useState(false)

  useEffect(() => {
    // 1. Проверка системных настроек
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    // 2. Определение слабого устройства
    const isLowPerformanceDevice = (): boolean => {
      // Проверка количества логических процессоров
      const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency
      const hasLowCores = cores != null && cores <= 4

      // Проверка памяти устройства (если доступно)
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      const hasLowMemory = memory != null && memory <= 4 // <= 4GB

      // Проверка типа подключения (если доступно)
      const connection = (navigator as Navigator & { 
        connection?: { 
          effectiveType?: string
          saveData?: boolean
        } 
      }).connection
      const hasSlowConnection = 
        connection?.effectiveType === '2g' || 
        connection?.effectiveType === 'slow-2g' ||
        connection?.saveData === true

      return hasLowCores || hasLowMemory || hasSlowConnection
    }

    // 3. Проверка мобильного устройства
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    // Уменьшаем анимации если:
    // - Пользователь явно выбрал уменьшенные анимации
    // - ИЛИ устройство слабое И мобильное (на мобилках особенно важно)
    const reduce = mediaQuery.matches || (isLowPerformanceDevice() && isMobile)
    
    setShouldReduce(reduce)

    // Слушаем изменения настроек
    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduce(e.matches || (isLowPerformanceDevice() && isMobile))
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return shouldReduce
}

/**
 * Возвращает упрощенные параметры анимации для Framer Motion
 */
export function useAnimationConfig() {
  const shouldReduce = useReducedMotion()

  return {
    shouldReduce,
    // Упрощенные transition параметры
    transition: shouldReduce
      ? { duration: 0.15, ease: 'easeOut' }
      : { duration: 0.3, ease: 'easeInOut' },
    // Более быстрый spring
    spring: shouldReduce
      ? { type: 'tween', duration: 0.2 }
      : { type: 'spring', stiffness: 200, damping: 20 },
    // Отключение сложных эффектов
    enableComplexEffects: !shouldReduce,
  }
}


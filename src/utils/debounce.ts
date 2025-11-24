/**
 * Утилита для дебаунсинга функций
 * Предотвращает слишком частое выполнение функций
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Утилита для троттлинга функций
 * Ограничивает частоту выполнения функции
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  let lastResult: ReturnType<T>

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
    return lastResult
  }
}

/**
 * Утилита для батчинга API запросов
 * Собирает несколько запросов в один пакет
 */
interface BatchConfig<T, R> {
  readonly batchWindow: number // Время ожидания в мс
  readonly maxBatchSize: number // Максимальный размер пакета
  readonly execute: (items: readonly T[]) => Promise<readonly R[]>
}

export function createBatcher<T, R>(
  config: BatchConfig<T, R>
): (item: T) => Promise<R> {
  let queue: T[] = []
  let timeout: ReturnType<typeof setTimeout> | null = null
  let resolvers: Array<{
    readonly resolve: (value: R) => void
    readonly reject: (reason?: any) => void
  }> = []

  const flush = async () => {
    if (queue.length === 0) return

    const currentQueue = [...queue]
    const currentResolvers = [...resolvers]

    queue = []
    resolvers = []
    timeout = null

    try {
      const results = await config.execute(currentQueue)
      currentResolvers.forEach((resolver, index) => {
        const result = results[index]
        if (result !== undefined) {
          resolver.resolve(result)
        } else {
          resolver.reject(new Error('No result for this item'))
        }
      })
    } catch (error) {
      currentResolvers.forEach(resolver => {
        resolver.reject(error)
      })
    }
  }

  return (item: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      queue.push(item)
      resolvers.push({ resolve, reject })

      if (queue.length >= config.maxBatchSize) {
        if (timeout !== null) {
          clearTimeout(timeout)
          timeout = null
        }
        void flush()
      } else if (timeout === null) {
        timeout = setTimeout(() => {
          void flush()
        }, config.batchWindow)
      }
    })
  }
}


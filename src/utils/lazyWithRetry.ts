/**
 * Утилита для lazy loading с автоматическим retry при ошибках загрузки
 * Решает проблему 404 ошибок при деплое на Vercel, когда чанки еще не задеплоены
 */

import React from 'react'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Создает lazy компонент с автоматическим retry при ошибках загрузки
 * Поддерживает как default export, так и named export
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: RetryOptions = {}
): React.LazyExoticComponent<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options

  return React.lazy(async () => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const module = await importFn()
        // Если модуль уже имеет default, возвращаем как есть
        // Иначе оборачиваем в { default: ... }
        if ('default' in module && module.default) {
          return module as { default: T }
        }
        // Если модуль экспортирован напрямую как default
        return { default: module as T }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Если это последняя попытка, выбрасываем ошибку
        if (attempt === maxRetries) {
          console.error(
            `❌ Failed to load module after ${maxRetries + 1} attempts:`,
            lastError
          )
          throw lastError
        }

        // Вызываем callback перед retry
        if (onRetry) {
          onRetry(attempt + 1, lastError)
        }

        // Определяем тип ошибки для более умной стратегии retry
        const is404Error =
          lastError.message.includes('404') ||
          lastError.message.includes('Failed to fetch') ||
          lastError.message.includes('net::ERR_ABORTED')

        // Для 404 ошибок используем более длинную задержку
        // так как файл может еще не задеплоиться
        const baseDelay = is404Error ? retryDelay * 2 : retryDelay

        // Логируем попытку retry
        console.warn(
          `⚠️ Module load failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${baseDelay * Math.pow(2, attempt)}ms...`,
          lastError.message
        )

        // Ждем перед следующей попыткой (exponential backoff)
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))

        // Пытаемся очистить кеш браузера для page-* чанков
        // Это помогает при проблемах с Service Worker кешем старых версий
        if ('caches' in window && is404Error) {
          try {
            const cacheNames = await caches.keys()
            for (const cacheName of cacheNames) {
              // Очищаем только кеш JS чанков, не трогаем vendor и другие стабильные файлы
              if (
                cacheName.includes('js-chunks') ||
                cacheName.includes('workbox')
              ) {
                const cache = await caches.open(cacheName)
                const keys = await cache.keys()
                // Удаляем только page-* чанки, которые могут быть устаревшими
                for (const request of keys) {
                  if (
                    request.url.includes('page-') &&
                    request.url.includes('.js')
                  ) {
                    await cache.delete(request)
                  }
                }
              }
            }
          } catch (cacheError) {
            // Игнорируем ошибки очистки кеша
            console.debug('Cache cleanup failed:', cacheError)
          }
        }
      }
    }

    // Этот код не должен выполняться, но TypeScript требует return
    throw lastError || new Error('Unknown error during lazy loading')
  })
}

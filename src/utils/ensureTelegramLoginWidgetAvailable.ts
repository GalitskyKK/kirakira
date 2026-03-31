let cachedPromise: Promise<boolean> | null = null

interface Options {
  readonly timeoutMs: number
}

function loadScriptOnce(timeoutMs: number): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (typeof document === 'undefined') return Promise.resolve(false)

  const existing = document.querySelector<HTMLScriptElement>(
    'script[src^=\"https://telegram.org/js/telegram-widget.js\"]'
  )
  if (existing) {
    // Уже пробовали грузить. Если оно реально подгрузилось — виджет сам нарисуется при вставке скрипта в контейнер.
    return Promise.resolve(true)
  }

  return new Promise(resolve => {
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'

    let done = false
    const finish = (value: boolean) => {
      if (done) return
      done = true
      resolve(value)
    }

    const timer = window.setTimeout(() => finish(false), timeoutMs)

    script.onload = () => {
      window.clearTimeout(timer)
      finish(true)
    }

    script.onerror = () => {
      window.clearTimeout(timer)
      finish(false)
    }

    document.head.appendChild(script)
  })
}

export function ensureTelegramLoginWidgetAvailable(
  options: Options
): Promise<boolean> {
  if (cachedPromise) return cachedPromise
  const timeoutMs =
    Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
      ? options.timeoutMs
      : 2500
  cachedPromise = loadScriptOnce(timeoutMs)
  return cachedPromise
}


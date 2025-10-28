import React from 'react'

/**
 * Утилиты для управления режимом рендеринга
 * Позволяет переключать между оригинальным SVG и оптимизированным Canvas
 */

export type RenderMode = 'original' | 'precompiled' | 'optimized'

const RENDER_MODE_KEY = 'kirakira_render_mode'

/**
 * Получает текущий режим рендеринга из localStorage
 */
export function getRenderMode(): RenderMode {
  if (typeof window === 'undefined') return 'original'

  const saved = localStorage.getItem(RENDER_MODE_KEY)
  if (saved && ['original', 'precompiled', 'optimized'].includes(saved)) {
    return saved as RenderMode
  }

  return 'original'
}

/**
 * Устанавливает режим рендеринга в localStorage
 */
export function setRenderMode(mode: RenderMode): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(RENDER_MODE_KEY, mode)

  // Уведомляем другие компоненты об изменении
  window.dispatchEvent(
    new CustomEvent('renderModeChanged', { detail: { mode } })
  )
}

/**
 * Хук для управления режимом рендеринга
 */
export function useRenderMode() {
  const [renderMode, setRenderModeState] =
    React.useState<RenderMode>(getRenderMode)

  React.useEffect(() => {
    const handleModeChange = (event: CustomEvent) => {
      setRenderModeState(event.detail.mode)
    }

    window.addEventListener(
      'renderModeChanged',
      handleModeChange as EventListener
    )

    return () => {
      window.removeEventListener(
        'renderModeChanged',
        handleModeChange as EventListener
      )
    }
  }, [])

  const changeRenderMode = React.useCallback((mode: RenderMode) => {
    setRenderMode(mode)
    setRenderModeState(mode)
  }, [])

  return {
    renderMode,
    changeRenderMode,
    isOriginal: renderMode === 'original',
    isPrecompiled: renderMode === 'precompiled',
    isOptimized: renderMode === 'optimized',
  }
}

/**
 * Компонент для переключения режима рендеринга
 */
export function RenderModeSwitcher() {
  const { renderMode, changeRenderMode } = useRenderMode()

  return (
    <div className="fixed left-4 top-4 z-50 rounded-lg bg-white p-3 shadow-lg">
      <div className="mb-2 text-sm font-medium">Режим рендеринга</div>
      <div className="flex gap-2">
        <button
          onClick={() => changeRenderMode('original')}
          className={`rounded px-2 py-1 text-xs ${
            renderMode === 'original'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          SVG
        </button>
        <button
          onClick={() => changeRenderMode('precompiled')}
          className={`rounded px-2 py-1 text-xs ${
            renderMode === 'precompiled'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Canvas
        </button>
        <button
          onClick={() => changeRenderMode('optimized')}
          className={`rounded px-2 py-1 text-xs ${
            renderMode === 'optimized'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Optimized
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {renderMode === 'original' && 'Оригинальный SVG рендеринг'}
        {renderMode === 'precompiled' && 'Canvas с предкомпиляцией'}
        {renderMode === 'optimized' && 'Полная оптимизация + кэш'}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useGardenState } from '@/hooks/index.v2'
import { useMoodTracking } from '@/hooks/index.v2'
import { useGardenClientStore } from '@/stores/gardenStore'
import { GardenRoomManager } from './GardenRoomManager'
import { IsometricRoomView } from './IsometricRoomView'
import { ElementDetails } from './ElementDetails'
import { PaletteView } from './PaletteView'
import { LoadingOverlay, Card } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import type { GardenElement as GardenElementType } from '@/types'
import { ViewMode, GardenDisplayMode } from '@/types'

interface GardenViewProps {
  className?: string
  compact?: boolean
}

export function GardenView({ className, compact = false }: GardenViewProps) {
  const t = useTranslation()
  const {
    garden,
    isLoading,
    selectedElement,
    viewMode,
    currentRoomIndex,
    selectElement,
    setViewMode,
    setCurrentRoomIndex,
    moveElementSafely,
  } = useGardenState()

  const displayMode = useGardenClientStore(state => state.displayMode)
  const lastChangedRoomIndex = useGardenClientStore(
    state => state.lastChangedRoomIndex
  )
  const highlightedElementId = useGardenClientStore(
    state => state.highlightedElementId
  )
  const highlightedElementUntilMs = useGardenClientStore(
    state => state.highlightedElementUntilMs
  )
  const clearHighlight = useGardenClientStore(state => state.clearHighlight)
  const highlightElement = useGardenClientStore(state => state.highlightElement)
  const { moodHistory } = useMoodTracking()

  const [draggedElement] = useState<GardenElementType | null>(null)
  const [elementBeingMoved, setElementBeingMoved] =
    useState<GardenElementType | null>(null) // Элемент для перемещения
  const [isFullscreen, setIsFullscreen] = useState(false) // Полноэкранный режим палетки
  const didRestoreRoomRef = useRef(false)

  // При входе в сад: открываем комнату, где были изменения
  useEffect(() => {
    if (!garden) {
      return
    }
    if (didRestoreRoomRef.current) {
      return
    }

    const maxRoomIndex =
      garden.elements.length > 0
        ? garden.elements.reduce((max, el) => {
            const roomIndex = Math.floor(el.position.y / 4)
            return roomIndex > max ? roomIndex : max
          }, 0)
        : 0

    const targetRoomIndex =
      lastChangedRoomIndex !== null
        ? Math.min(lastChangedRoomIndex, maxRoomIndex)
        : maxRoomIndex

    // Устанавливаем комнату один раз на входе (не ломаем ручную навигацию)
    setCurrentRoomIndex(targetRoomIndex)
    didRestoreRoomRef.current = true

    // Если подсветки нет (например, на другом устройстве), подсвечиваем последний элемент,
    // но только если он достаточно "свежий" (чтобы не подсвечивать старое при каждом входе).
    if (garden.elements.length > 0 && highlightedElementId === null) {
      const newest = garden.elements.reduce((latest, el) => {
        return el.unlockDate.getTime() > latest.unlockDate.getTime() ? el : latest
      }, garden.elements[0]!)

      const ageMs = Date.now() - newest.unlockDate.getTime()
      const MAX_HIGHLIGHT_AGE_MS = 2 * 60 * 60 * 1000 // 2 часа

      if (ageMs >= 0 && ageMs <= MAX_HIGHLIGHT_AGE_MS) {
        highlightElement(newest.id, 10 * 60 * 1000) // 10 минут на поиск
      }
    }
  }, [
    garden,
    highlightElement,
    lastChangedRoomIndex,
    setCurrentRoomIndex,
    highlightedElementId,
  ])

  // Авто-очистка подсветки по таймеру
  useEffect(() => {
    if (!highlightedElementId || !highlightedElementUntilMs) {
      return
    }

    const now = Date.now()
    if (highlightedElementUntilMs <= now) {
      clearHighlight()
      return
    }

    const timeoutMs = highlightedElementUntilMs - now
    const timer = window.setTimeout(() => {
      clearHighlight()
    }, timeoutMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [clearHighlight, highlightedElementId, highlightedElementUntilMs])

  const handleElementClick = useCallback(
    (element: GardenElementType) => {
      if (elementBeingMoved) {
        if (elementBeingMoved.id === element.id) {
          return
        }

        void (async () => {
          try {
            const success = await moveElementSafely(
              elementBeingMoved.id,
              element.position,
              { swapWithId: element.id }
            )

            if (success) {
              setElementBeingMoved(null)
              selectElement(null)
            }
          } catch (error) {
            console.error('❌ Error during element swap:', error)
          }
        })()

        return
      }

      selectElement(element)
      setViewMode(ViewMode.DETAIL)
    },
    [
      elementBeingMoved,
      moveElementSafely,
      selectElement,
      setElementBeingMoved,
      setViewMode,
    ]
  )

  const handleElementLongPress = useCallback(
    (element: GardenElementType) => {
      // Долгое нажатие активирует режим перемещения в любом режиме
      if (viewMode !== ViewMode.DETAIL) {
        setElementBeingMoved(element)
        selectElement(element)
      }
    },
    [viewMode, selectElement]
  )

  const handleSlotClick = useCallback(
    (globalShelfIndex: number, position: number) => {
      if (!elementBeingMoved) {
        return
      }

      const gridX = position
      const gridY = globalShelfIndex
      const occupyingElement =
        garden?.elements.find(
          currentElement =>
            currentElement.position.x === gridX &&
            currentElement.position.y === gridY
        ) ?? null

      void (async () => {
        try {
          const success = await moveElementSafely(
            elementBeingMoved.id,
            { x: gridX, y: gridY },
            occupyingElement && occupyingElement.id !== elementBeingMoved.id
              ? { swapWithId: occupyingElement.id }
              : undefined
          )

          if (success) {
            setElementBeingMoved(null)
            selectElement(null)
          }
        } catch (error) {
          console.error('❌ Error during movement:', error)
        }
      })()
    },
    [
      elementBeingMoved,
      garden,
      moveElementSafely,
      selectElement,
      setElementBeingMoved,
    ]
  )

  const handleConfirmMovement = useCallback(() => {
    // Подтверждение завершает режим перемещения
    setElementBeingMoved(null)
    selectElement(null)
    setViewMode(ViewMode.OVERVIEW)
  }, [selectElement, setViewMode])

  const handleCancelMovement = useCallback(() => {
    // Отмена сбрасывает режим перемещения без изменений
    setElementBeingMoved(null)
    selectElement(null)
  }, [selectElement])

  const handleBackToOverview = useCallback(() => {
    selectElement(null)
    setViewMode(ViewMode.OVERVIEW)
  }, [selectElement, setViewMode])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  if (!garden) {
    return (
      <Card className={clsx('min-h-[400px]', className)}>
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 text-6xl">🌱</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t.gardenActions.emptyGarden}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t.gardenActions.markMoodToGrow}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      {/* Fullscreen Palette Overlay - Rendered via Portal to document.body */}
      {createPortal(
        <AnimatePresence>
          {isFullscreen && displayMode === GardenDisplayMode.PALETTE && (
            <motion.div
              key="fullscreen-palette"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-900"
            >
              {/* Fullscreen Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t.gardenActions.palette}
                </h2>
                <button
                  onClick={toggleFullscreen}
                  className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                  title={t.gardenActions.exitFullscreen}
                >
                  <Minimize2 className="h-5 w-5" />
                </button>
              </div>

              {/* Fullscreen Palette Content */}
              <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6 lg:p-8">
                <PaletteView className="h-full w-full max-w-4xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <LoadingOverlay isLoading={isLoading}>
        <Card
          className={clsx(compact ? 'h-[75vh]' : 'min-h-[500px]', className)}
          padding="none"
        >
          <AnimatePresence mode="wait">
            {viewMode === ViewMode.DETAIL && selectedElement ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ElementDetails
                  element={selectedElement}
                  onBack={handleBackToOverview}
                />
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {/* Compact controls */}
                <div
                  className={clsx(
                    'border-b border-gray-200 px-4',
                    compact ? 'py-2' : 'py-3'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="rounded-full bg-neutral-100 px-2 py-1 font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
                        {displayMode === GardenDisplayMode.PALETTE
                          ? t.displayMode.palette
                          : displayMode === GardenDisplayMode.ISOMETRIC_ROOM
                            ? t.displayMode.room
                            : t.displayMode.garden}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-2 py-1 font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
                        {displayMode === GardenDisplayMode.PALETTE
                          ? `${moodHistory.length} ${t.moodStats.entries.toLowerCase()}`
                          : `${garden.elements.length} ${t.garden.elements.toLowerCase()}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {elementBeingMoved ? (
                        <>
                          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 dark:bg-blue-900/30">
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                              {t.gardenActions.moving}: {elementBeingMoved.name}
                            </span>
                          </div>
                          <button
                            onClick={handleConfirmMovement}
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                            title={t.gardenActions.confirmMove}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelMovement}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                            title={t.gardenActions.cancelMove}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          {displayMode === GardenDisplayMode.PALETTE && (
                            <button
                              onClick={toggleFullscreen}
                              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                              title={
                                isFullscreen
                                  ? t.gardenActions.exitFullscreen
                                  : t.gardenActions.fullscreen
                              }
                            >
                              {isFullscreen ? (
                                <Minimize2 className="h-5 w-5" />
                              ) : (
                                <Maximize2 className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setViewMode(ViewMode.OVERVIEW)}
                            className={clsx(
                              'rounded-lg px-3 py-1.5 text-sm transition-colors',
                              viewMode === ViewMode.OVERVIEW
                                ? 'bg-kira-100 text-kira-700 dark:bg-kira-800 dark:text-kira-100'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            {t.gardenActions.overview}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Garden Display - Switch between display modes */}
                <div
                  className={clsx(
                    displayMode === GardenDisplayMode.PALETTE
                      ? 'flex items-center justify-center p-2 sm:p-4 lg:p-6'
                      : 'p-2 sm:p-4 lg:p-6',
                    compact && 'overflow-hidden'
                  )}
                  style={
                    compact
                      ? {
                          height: '',
                          transform: '',
                          transformOrigin: '',
                        }
                      : undefined
                  }
                >
                  <AnimatePresence mode="wait">
                    {displayMode === GardenDisplayMode.PALETTE ? (
                      <motion.div
                        key="palette"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <PaletteView className="h-full w-full max-w-2xl" />
                      </motion.div>
                    ) : displayMode === GardenDisplayMode.ISOMETRIC_ROOM ? (
                      <motion.div
                        key="isometric-room"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className={clsx(
                          compact ? '' : 'h-full min-h-[600px]'
                        )}
                        style={
                          compact
                            ? {
                                transform: 'scale(0.75)',
                                transformOrigin: 'top center',
                              }
                            : {}
                        }
                      >
                        <IsometricRoomView
                          elements={garden.elements}
                          selectedElement={selectedElement}
                          elementBeingMoved={elementBeingMoved}
                          viewMode={viewMode}
                          currentRoomIndex={currentRoomIndex}
                          onRoomChange={setCurrentRoomIndex}
                          onElementClick={handleElementClick}
                          onElementLongPress={handleElementLongPress}
                          onSlotClick={handleSlotClick}
                          highlightedElementId={highlightedElementId}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="garden"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className={clsx(compact ? 'h-[75vh]' : 'h-full')}
                        style={
                          compact
                            ? {
                                transform: 'scale(0.75)',
                                transformOrigin: 'top center',
                              }
                            : {}
                        }
                      >
                        <GardenRoomManager
                          elements={garden.elements}
                          selectedElement={selectedElement}
                          draggedElement={draggedElement}
                          elementBeingMoved={elementBeingMoved}
                          viewMode={viewMode}
                          currentRoomIndex={currentRoomIndex}
                          onRoomChange={setCurrentRoomIndex}
                          onElementClick={handleElementClick}
                          onElementLongPress={handleElementLongPress}
                          onSlotClick={handleSlotClick}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </LoadingOverlay>
    </>
  )
}

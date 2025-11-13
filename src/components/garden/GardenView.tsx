import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useGardenState } from '@/hooks/index.v2'
import { GardenRoomManager } from './GardenRoomManager'
import { GardenStats } from './GardenStats'
import { ElementDetails } from './ElementDetails'
import { LoadingOverlay, Card } from '@/components/ui'
import type { GardenElement as GardenElementType } from '@/types'
import { ViewMode } from '@/types'

interface GardenViewProps {
  className?: string
}

export function GardenView({ className }: GardenViewProps) {
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

  const [draggedElement] = useState<GardenElementType | null>(null)
  const [elementBeingMoved, setElementBeingMoved] =
    useState<GardenElementType | null>(null) // Элемент для перемещения

  const handleElementClick = useCallback(
    (element: GardenElementType) => {
      if (elementBeingMoved) {
        setElementBeingMoved(null)
        selectElement(null)
      } else {
        selectElement(element)
        setViewMode(ViewMode.DETAIL)
      }
    },
    [viewMode, elementBeingMoved, selectElement, setViewMode]
  )

  const handleElementLongPress = useCallback(
    (element: GardenElementType) => {
      // Долгое нажатие активирует режим перемещения в любом режиме (кроме детального просмотра)
      if (viewMode !== ViewMode.DETAIL) {
        setElementBeingMoved(element)
        selectElement(element)
      }
    },
    [viewMode, selectElement, elementBeingMoved]
  )

  const handleSlotClick = useCallback(
    async (globalShelfIndex: number, position: number) => {
      if (elementBeingMoved) {
        try {
          // GardenRoomManager передаёт уже глобальные координаты
          // globalShelfIndex уже учитывает текущую комнату
          const gridX = position
          const gridY = globalShelfIndex

          await moveElementSafely(elementBeingMoved.id, { x: gridX, y: gridY })

          // Сбрасываем состояние перемещения
          setElementBeingMoved(null)
          selectElement(null)
        } catch (error) {
          console.error('❌ Error during movement:', error)
        }
      }
    },
    [elementBeingMoved, moveElementSafely, selectElement]
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

  if (!garden) {
    return (
      <Card className={clsx('min-h-[400px]', className)}>
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 text-6xl">🌱</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ваш сад пуст
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Отметьте свое настроение, чтобы вырастить первое растение!
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <LoadingOverlay isLoading={isLoading}>
      <Card className={clsx('min-h-[500px]', className)} padding="none">
        <AnimatePresence mode="wait">
          {viewMode === 'detail' && selectedElement ? (
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
              {/* Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Мой Сад
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {garden.elements.length} растений
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    {/* Режим перемещения элемента */}
                    {elementBeingMoved ? (
                      <>
                        <div className="flex items-center space-x-2 rounded-lg bg-blue-50 px-3 py-1.5 dark:bg-blue-900/30">
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            Перемещение: {elementBeingMoved.name}
                          </span>
                        </div>
                        <button
                          onClick={handleConfirmMovement}
                          className="rounded-lg bg-green-100 px-3 py-1.5 text-sm text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                          title="Подтвердить перемещение"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelMovement}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                          title="Отменить перемещение"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setViewMode(ViewMode.OVERVIEW)}
                          className={clsx(
                            'rounded-lg px-3 py-1.5 text-sm transition-colors',
                            viewMode === 'overview'
                              ? 'bg-garden-100 text-garden-700 dark:bg-garden-700 dark:text-garden-100'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          Обзор
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile-first adaptive layout */}
              <div className="flex flex-col lg:flex-row">
                {/* Garden Display - Room Manager with Multi-Room Support */}
                <div className="flex-1 p-2 sm:p-4 lg:p-6">
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
                </div>

                {/* Sidebar - Hidden on mobile, shown on desktop */}
                {viewMode === 'overview' && (
                  <motion.div
                    className="hidden border-t border-gray-200 p-4 lg:block lg:w-80 lg:border-l lg:border-t-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <GardenStats garden={garden} />
                  </motion.div>
                )}
              </div>

              {/* Mobile Stats Panel - Only visible on mobile for overview mode */}
              {viewMode === 'overview' && (
                <motion.div
                  className="border-t border-gray-200 p-4 lg:hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <GardenStats garden={garden} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </LoadingOverlay>
  )
}

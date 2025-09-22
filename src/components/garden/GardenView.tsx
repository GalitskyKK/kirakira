import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useGardenState } from '@/hooks'
// import { GardenElement } from './GardenElement'
import { GardenGrid } from './GardenGrid'
import { ShelfView } from './ShelfView'
import { GardenStats } from './GardenStats'
import { ElementDetails } from './ElementDetails'
import { LoadingOverlay, Card } from '@/components/ui'
import type { GardenElement as GardenElementType } from '@/types'
import { ViewMode } from '@/types'

interface GardenViewProps {
  className?: string
}

type DisplayMode = 'grid' | 'shelf'

export function GardenView({ className }: GardenViewProps) {
  const {
    garden,
    isLoading,
    selectedElement,
    viewMode,
    selectElement,
    setViewMode,
    moveElementSafely,
  } = useGardenState()

  const [draggedElement, setDraggedElement] =
    useState<GardenElementType | null>(null)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('shelf')
  const [elementBeingMoved, setElementBeingMoved] =
    useState<GardenElementType | null>(null) // Элемент для перемещения

  const handleElementClick = useCallback(
    (element: GardenElementType) => {
      console.log('🖱️ Element clicked:', {
        elementName: element.name,
        elementBeingMoved: elementBeingMoved?.name,
        viewMode,
        hasElementBeingMoved: !!elementBeingMoved,
      })

      if (elementBeingMoved) {
        console.log('🚫 Cancelling movement mode due to element click')
        setElementBeingMoved(null)
        selectElement(null)
      } else if (viewMode === ViewMode.ARRANGEMENT) {
        console.log('📝 Showing details in arrangement mode')
        selectElement(element)
        setViewMode(ViewMode.DETAIL)
      } else {
        console.log('📖 Showing details in normal mode')
        selectElement(element)
        setViewMode(ViewMode.DETAIL)
      }
    },
    [viewMode, elementBeingMoved, selectElement, setViewMode]
  )

  const handleElementLongPress = useCallback(
    (element: GardenElementType) => {
      console.log('🔄 Long press detected:', {
        elementName: element.name,
        viewMode,
        currentElementBeingMoved: elementBeingMoved?.name,
      })

      // Долгое нажатие активирует режим перемещения в любом режиме (кроме детального просмотра)
      if (viewMode !== ViewMode.DETAIL) {
        console.log('✅ Activating movement mode for:', element.name)
        setElementBeingMoved(element)
        selectElement(element)
        console.log('📌 Element set for movement:', element.name)
      } else {
        console.log('⚠️ Long press ignored - in detail mode')
      }
    },
    [viewMode, selectElement, elementBeingMoved]
  )

  const handleElementDragStart = useCallback(
    (element: GardenElementType) => {
      if (viewMode === ViewMode.ARRANGEMENT) {
        setDraggedElement(element)
      }
    },
    [viewMode]
  )

  const handleElementDragEnd = useCallback(
    async (element: GardenElementType, newX: number, newY: number) => {
      setDraggedElement(null)

      if (viewMode === ViewMode.ARRANGEMENT) {
        await moveElementSafely(element.id, { x: newX, y: newY })
      }
    },
    [viewMode, moveElementSafely]
  )

  const handleSlotClick = useCallback(
    async (shelfIndex: number, position: number) => {
      console.log('🎯 handleSlotClick called:', {
        shelfIndex,
        position,
        elementBeingMoved: elementBeingMoved?.name,
        hasElementBeingMoved: !!elementBeingMoved,
      })

      if (elementBeingMoved) {
        console.log('✅ Element is being moved, proceeding with move')
        try {
          // ИСПРАВЛЕННЫЙ маппинг: прямое размещение в точную позицию слота
          const elementsPerShelf =
            displayMode === 'shelf' ? (window.innerWidth < 1024 ? 4 : 5) : 5 // Соответствует логике ShelfView

          // БЕЗОПАСНЫЕ координаты с проверками границ
          const maxPosition = elementsPerShelf - 1
          const maxShelf = 3 // У нас 4 полки (0-3)

          // Проверяем границы
          if (position > maxPosition || shelfIndex > maxShelf) {
            console.error('❌ Invalid slot coordinates:', {
              shelfIndex,
              maxShelf,
              position,
              maxPosition,
              elementsPerShelf,
            })
            return
          }

          // НОВАЯ система: упаковываем shelfIndex и position в координаты 10x10
          // Используем "виртуальную" сетку где каждая полка занимает определенные ряды
          const gridX = position // Позиция на полке (0-4)
          const gridY = shelfIndex // Каждая полка = отдельный ряд (0-3)

          console.log('📍 Moving element to SAFE SLOT coordinates:', {
            elementName: elementBeingMoved.name,
            fromShelf: 'unknown',
            toShelf: shelfIndex,
            toPosition: position,
            elementsPerShelf,
            finalCoords: { gridX, gridY },
            boundsCheck: {
              positionOK: position <= maxPosition,
              shelfOK: shelfIndex <= maxShelf,
            },
          })

          await moveElementSafely(elementBeingMoved.id, { x: gridX, y: gridY })
          console.log('✅ Move completed successfully')

          // Сбрасываем состояние перемещения
          console.log('🧹 Resetting movement state')
          setElementBeingMoved(null)
          selectElement(null)
          console.log('✅ Movement state reset')
        } catch (error) {
          console.error('❌ Error during movement:', error)
        }
      } else {
        console.log('⚠️ No element being moved, ignoring slot click')
      }
    },
    [elementBeingMoved, moveElementSafely, selectElement, displayMode]
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
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Ваш сад пуст
            </h3>
            <p className="text-gray-600">
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
                    <h2 className="text-lg font-semibold text-gray-900">
                      Мой Сад
                    </h2>
                    <p className="text-sm text-gray-600">
                      {garden.elements.length} растений
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    {/* Режим перемещения элемента */}
                    {elementBeingMoved ? (
                      <>
                        <div className="flex items-center space-x-2 rounded-lg bg-blue-50 px-3 py-1.5">
                          <span className="text-sm text-blue-700">
                            Перемещение: {elementBeingMoved.name}
                          </span>
                        </div>
                        <button
                          onClick={handleConfirmMovement}
                          className="rounded-lg bg-green-100 px-3 py-1.5 text-sm text-green-700 transition-colors hover:bg-green-200"
                          title="Подтвердить перемещение"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelMovement}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-200"
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
                              ? 'bg-garden-100 text-garden-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          Обзор
                        </button>
                        <button
                          onClick={() => setViewMode(ViewMode.ARRANGEMENT)}
                          className={clsx(
                            'rounded-lg px-3 py-1.5 text-sm transition-colors',
                            viewMode === ViewMode.ARRANGEMENT
                              ? 'bg-garden-100 text-garden-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          Редактировать
                        </button>

                        {/* Display mode toggle */}
                        <div className="border-l border-gray-200 pl-2">
                          <button
                            onClick={() =>
                              setDisplayMode(
                                displayMode === 'grid' ? 'shelf' : 'grid'
                              )
                            }
                            className={clsx(
                              'rounded-lg px-3 py-1.5 text-sm transition-colors',
                              'flex items-center space-x-1 text-gray-600 hover:bg-gray-100'
                            )}
                            title={
                              displayMode === 'grid'
                                ? 'Переключить на полки'
                                : 'Переключить на сетку'
                            }
                          >
                            <span>{displayMode === 'grid' ? '📚' : '⊞'}</span>
                            <span>
                              {displayMode === 'grid' ? 'Полки' : 'Сетка'}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile-first adaptive layout */}
              <div className="flex h-full flex-col lg:flex-row">
                {/* Garden Display */}
                <div className="flex-1 p-2 sm:p-4">
                  {displayMode === 'grid' ? (
                    <GardenGrid
                      elements={garden.elements}
                      selectedElement={selectedElement}
                      draggedElement={draggedElement}
                      viewMode={viewMode}
                      onElementClick={handleElementClick}
                      onElementDragStart={handleElementDragStart}
                      onElementDragEnd={handleElementDragEnd}
                    />
                  ) : (
                    <ShelfView
                      elements={garden.elements}
                      selectedElement={selectedElement}
                      draggedElement={draggedElement}
                      elementBeingMoved={elementBeingMoved}
                      viewMode={viewMode}
                      onElementClick={handleElementClick}
                      onElementLongPress={handleElementLongPress}
                      onSlotClick={handleSlotClick}
                    />
                  )}
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

                {viewMode === ViewMode.ARRANGEMENT && (
                  <motion.div
                    className="border-t border-gray-200 p-4 lg:w-80 lg:border-l lg:border-t-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-900">
                          Режим редактирования
                        </h3>
                        <p className="text-xs text-gray-600">
                          Перетащите растения, чтобы изменить их расположение в
                          саду.
                        </p>
                      </div>

                      {selectedElement && (
                        <Card padding="sm" variant="outlined">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {selectedElement.emoji}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {selectedElement.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                Позиция: {selectedElement.position.x},{' '}
                                {selectedElement.position.y}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
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

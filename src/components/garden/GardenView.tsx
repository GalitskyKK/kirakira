import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useGardenState } from '@/hooks'
// import { GardenElement } from './GardenElement'
import { GardenGrid } from './GardenGrid'
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
    selectElement,
    setViewMode,
    moveElementSafely,
  } = useGardenState()

  const [draggedElement, setDraggedElement] =
    useState<GardenElementType | null>(null)

  const handleElementClick = useCallback(
    (element: GardenElementType) => {
      if (viewMode === ViewMode.ARRANGEMENT) {
        // In arrangement mode, just select element for moving
        selectElement(element)
      } else {
        // In other modes, show details
        selectElement(element)
        setViewMode(ViewMode.DETAIL)
      }
    },
    [viewMode, selectElement, setViewMode]
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
                  </div>
                </div>
              </div>

              <div className="flex h-full">
                {/* Garden Grid */}
                <div className="flex-1 p-4">
                  <GardenGrid
                    elements={garden.elements}
                    selectedElement={selectedElement}
                    draggedElement={draggedElement}
                    viewMode={viewMode}
                    onElementClick={handleElementClick}
                    onElementDragStart={handleElementDragStart}
                    onElementDragEnd={handleElementDragEnd}
                  />
                </div>

                {/* Sidebar */}
                {viewMode === 'overview' && (
                  <motion.div
                    className="w-80 border-l border-gray-200 p-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <GardenStats garden={garden} />
                  </motion.div>
                )}

                {viewMode === ViewMode.ARRANGEMENT && (
                  <motion.div
                    className="w-80 border-l border-gray-200 p-4"
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
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </LoadingOverlay>
  )
}

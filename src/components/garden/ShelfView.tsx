import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { ShelfElement } from './ShelfElement.tsx'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { ParticleCanvas } from './ParticleCanvas'
import type { GardenElement as GardenElementType, ViewMode } from '@/types'
import { RarityLevel } from '@/types/garden'
import type { GardenTheme } from '@/hooks/useGardenTheme'

interface ShelfViewProps {
  elements: readonly GardenElementType[]
  selectedElement?: GardenElementType | null
  draggedElement?: GardenElementType | null
  elementBeingMoved?: GardenElementType | null // Элемент в режиме перемещения
  viewMode: ViewMode
  onElementClick?: (element: GardenElementType) => void
  onElementLongPress?: (element: GardenElementType) => void // Долгое нажатие
  onSlotClick?: (shelfIndex: number, position: number) => void // Клик по слоту
  friendTheme?: GardenTheme | null // Опциональная тема для сада друга
}

// Responsive constants - optimized to fit shelf width n
const SHELF_COUNT = 4
const ELEMENTS_PER_SHELF_DESKTOP = 4 // Desktop: 5 elements fit comfortably
const ELEMENTS_PER_SHELF_MOBILE = 4 // Mobile: 4 elements fit screen
const SHELF_HEIGHT_DESKTOP = 140 // Desktop: taller shelves
const SHELF_HEIGHT_MOBILE = 120 // Mobile: shorter shelves
const ELEMENT_WIDTH_DESKTOP = 75 // Desktop: slightly smaller for better fit
const ELEMENT_WIDTH_MOBILE = 60 // Mobile: narrower slots
const ELEMENT_SPACING_DESKTOP = 8 // Desktop: reduced spacing for better fit
const ELEMENT_SPACING_MOBILE = 5 // Mobile: minimal spacing

export function ShelfView({
  elements,
  selectedElement,
  draggedElement,
  elementBeingMoved,
  viewMode,
  onElementClick,
  onElementLongPress,
  onSlotClick,
  friendTheme,
}: ShelfViewProps) {
  // Responsive design hook
  const [isMobile, setIsMobile] = useState(false)
  const { theme: defaultTheme } = useGardenTheme()

  // Используем тему друга если она передана, иначе используем тему текущего пользователя
  const theme = friendTheme ?? defaultTheme

  // Оптимизация: всегда используем уменьшенное количество частиц для производительности
  // Canvas уже оптимизирован, но уменьшаем количество для всех устройств
  const effectiveParticleDensity = Math.min(theme.particleDensity, 20) // Максимум 20 частиц для всех
  const shouldUseAnimations = Boolean(theme.hasAnimations)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    // Debounce resize для производительности
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, 150)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Responsive constants
  const ELEMENTS_PER_SHELF = isMobile
    ? ELEMENTS_PER_SHELF_MOBILE
    : ELEMENTS_PER_SHELF_DESKTOP
  const SHELF_HEIGHT = isMobile ? SHELF_HEIGHT_MOBILE : SHELF_HEIGHT_DESKTOP
  const ELEMENT_WIDTH = isMobile ? ELEMENT_WIDTH_MOBILE : ELEMENT_WIDTH_DESKTOP
  const ELEMENT_SPACING = isMobile
    ? ELEMENT_SPACING_MOBILE
    : ELEMENT_SPACING_DESKTOP
  // Organize elements by shelf and position
  const shelves = useMemo(() => {
    const shelfData = Array.from({ length: SHELF_COUNT }, (_, shelfIndex) => ({
      index: shelfIndex,
      elements: [] as Array<{
        element: GardenElementType
        position: number
      }>,
    }))

    // ИСПРАВЛЕНО: Distribute elements based on their EXACT SLOT COORDINATES

    elements.forEach(element => {
      const { x: gridX, y: gridY } = element.position

      // НОВАЯ система координат: gridY = shelfIndex, gridX = position
      if (gridY < SHELF_COUNT && gridX < 10) {
        // Элемент размещен через новую систему (grid-based)
        let shelfIndex = gridY % SHELF_COUNT
        let positionOnShelf = gridX

        // ИСПРАВЛЕНИЕ: если позиция больше слотов, перераспределяем на следующие полки
        while (positionOnShelf >= ELEMENTS_PER_SHELF) {
          positionOnShelf -= ELEMENTS_PER_SHELF
          shelfIndex = (shelfIndex + 1) % SHELF_COUNT
        }

        if (
          shelfData[shelfIndex] &&
          shelfIndex < SHELF_COUNT &&
          positionOnShelf < ELEMENTS_PER_SHELF
        ) {
          shelfData[shelfIndex]?.elements.push({
            element,
            position: positionOnShelf,
          })
        } else {
          console.warn(
            '⚠️ Cannot place element:',
            element.name,
            'shelfIndex:',
            shelfIndex,
            'position:',
            positionOnShelf
          )
        }
      } else {
        // Fallback для старых элементов: используем линейную логику
        const elementIndex = gridY * 10 + gridX
        const shelfIndex =
          Math.floor(elementIndex / ELEMENTS_PER_SHELF) % SHELF_COUNT
        const positionOnShelf = elementIndex % ELEMENTS_PER_SHELF

        if (shelfData[shelfIndex] && positionOnShelf < ELEMENTS_PER_SHELF) {
          shelfData[shelfIndex].elements.push({
            element,
            position: positionOnShelf,
          })
        }
      }
    })

    // НЕ сортируем элементы по rarity, чтобы сохранить правильные позиции
    // Позиции теперь рассчитываются на основе grid координат и должны оставаться неизменными

    // Сортируем элементы на каждой полке по их вычисленной позиции для правильного отображения
    shelfData.forEach(shelf => {
      shelf.elements.sort((a, b) => a.position - b.position)
    })

    return shelfData
  }, [elements, ELEMENTS_PER_SHELF])

  const isElementMoving = elementBeingMoved !== null

  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div 
      ref={containerRef}
      className="shelf-container relative min-h-[650px] w-full overflow-visible sm:min-h-[700px] lg:min-h-[750px]"
      style={{
        contain: 'layout style paint',
        willChange: 'contents',
      }}
    >
      {/* Background with wooden texture and magical atmosphere */}
      <div className="absolute left-0 right-0 top-0 h-full min-h-[650px] sm:min-h-[700px] lg:min-h-[750px]">
        <div
          className="absolute inset-0"
          style={{
            background: theme.containerBackground,
            animation: shouldUseAnimations ? theme.glowAnimation : undefined,
            willChange: shouldUseAnimations ? 'opacity' : 'auto', // Упрощено для производительности
          }}
        />

        {/* Subtle wood grain texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                rgba(139, 69, 19, 0.1) 0px,
                rgba(160, 82, 45, 0.1) 2px,
                rgba(139, 69, 19, 0.1) 4px
              )
            `,
          }}
        />

        {/* Magical floating particles - Canvas оптимизация */}
        <ParticleCanvas
          theme={theme}
          shouldUseAnimations={shouldUseAnimations}
          particleDensity={effectiveParticleDensity}
          containerRef={containerRef}
        />
      </div>

      {/* Main shelf container - оптимизировано */}
      <div
        className="relative w-full"
        style={{
          contain: 'layout style',
        }}
      >
        {/* Shelves */}
        <div
          className={clsx(
            'shelves-wrapper relative mx-auto py-8',
            isMobile ? 'max-w-full px-2' : 'max-w-4xl px-8 py-12'
          )}
        >
          {Array.from({ length: SHELF_COUNT }, (_, shelfIndex) => {
            const shelfElements = shelves[shelfIndex]?.elements ?? []

            return (
              <motion.div
                key={`shelf-${shelfIndex}`}
                className={clsx('shelf relative', isMobile ? 'mb-6' : 'mb-10')}
                style={{
                  height: SHELF_HEIGHT,
                  transformStyle: 'preserve-3d',
                  willChange: 'opacity',
                  contain: 'layout style paint',
                  opacity: 1,
                }}
              >
                {/* Enhanced wooden shelf base */}
                <div
                  className={clsx(
                    'shelf-base absolute inset-x-0 bottom-0',
                    isMobile ? 'h-10' : 'h-12' // Увеличенная высота полки
                  )}
                  style={{
                    borderRadius: theme.shelfRadius,
                  }}
                >
                  {/* Main shelf surface */}
                  <div
                    className="shelf-surface absolute inset-0 shadow-lg"
                    style={{
                      background: theme.shelfSurface,
                      borderRadius: theme.shelfRadius,
                      boxShadow: theme.shelfShadow,
                      animation: shouldUseAnimations
                        ? theme.shelfAnimation
                        : undefined,
                      willChange: shouldUseAnimations ? 'opacity' : 'auto', // Упрощено для производительности
                    }}
                  >
                    {/* Wood grain details */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
                      style={{ borderRadius: theme.shelfRadius }}
                    />
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        borderRadius: theme.shelfRadius,
                        backgroundImage: `
                        repeating-linear-gradient(
                          0deg,
                          rgba(139, 69, 19, 0.1) 0px,
                          rgba(160, 82, 45, 0.1) 1px,
                          rgba(139, 69, 19, 0.1) 2px
                        )
                      `,
                      }}
                    />

                    {/* Enhanced surface texture */}
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10"
                      style={{ borderRadius: theme.shelfRadius }}
                    />
                  </div>

                  {/* Enhanced shelf edge (3D effect) */}
                  <div
                    className={clsx(
                      'shelf-edge absolute inset-x-0 bottom-0 shadow-md',
                      isMobile ? 'h-3' : 'h-4' // Более объемный край
                    )}
                    style={{
                      background: theme.shelfEdge,
                      borderBottomLeftRadius: theme.shelfRadius,
                      borderBottomRightRadius: theme.shelfRadius,
                    }}
                  />

                  {/* Enhanced shelf supports */}
                  <div
                    className={clsx(
                      'shelf-support absolute -left-2 bottom-0 shadow-md',
                      isMobile ? 'h-12 w-5' : 'h-16 w-6' // Более крупные опоры
                    )}
                    style={{
                      background: theme.shelfSupport,
                      borderRadius: theme.shelfRadius,
                    }}
                  />
                  <div
                    className={clsx(
                      'shelf-support absolute -right-2 bottom-0 shadow-md',
                      isMobile ? 'h-12 w-5' : 'h-16 w-6'
                    )}
                    style={{
                      background: theme.shelfSupport,
                      borderRadius: theme.shelfRadius,
                    }}
                  />

                  {/* Additional shelf depth */}
                  <div className="shelf-depth absolute inset-x-0 top-0 -z-10 h-1 rounded-t-lg bg-gradient-to-b from-amber-100 to-amber-200 shadow-inner" />
                </div>

                {/* Back wall */}
                <div
                  className="shelf-back absolute inset-0 -z-10 opacity-80"
                  style={{
                    background: theme.wallBackground,
                    borderRadius: theme.wallRadius,
                    borderTopLeftRadius: theme.shelfRadius,
                    borderTopRightRadius: theme.shelfRadius,
                  }}
                >
                  {/* Wall texture */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      borderRadius: theme.wallRadius,
                      borderTopLeftRadius: theme.shelfRadius,
                      borderTopRightRadius: theme.shelfRadius,
                      backgroundImage: `
                      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px),
                      radial-gradient(circle at 75% 75%, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                      backgroundSize: '20px 20px',
                    }}
                  />
                </div>

                {/* Drop zones for element moving */}
                {isElementMoving && (
                  <div
                    className={clsx(
                      'drop-zones absolute inset-x-0 top-4 flex items-end justify-center',
                      isMobile ? 'bottom-4 px-2' : 'bottom-4 px-8'
                    )}
                    style={{
                      maxWidth: `${ELEMENTS_PER_SHELF * (ELEMENT_WIDTH + ELEMENT_SPACING)}px`,
                      margin: '0 auto',
                    }}
                  >
                    {Array.from(
                      { length: ELEMENTS_PER_SHELF },
                      (_, position) => {
                        return (
                          <motion.div
                            key={`drop-zone-${shelfIndex}-${position}`}
                            className={clsx(
                              'drop-zone z-50 cursor-pointer rounded-lg border-2 border-dashed',
                              isElementMoving
                                ? 'border-blue-400/80 bg-blue-100/30 hover:border-blue-500 hover:bg-blue-200/40'
                                : 'border-amber-300/60 hover:border-amber-400 hover:bg-amber-200/30',
                              'flex items-center justify-center transition-all duration-200'
                            )}
                            style={{
                              width: ELEMENT_WIDTH,
                              height: SHELF_HEIGHT - 40,
                              minWidth: ELEMENT_WIDTH,
                              marginLeft: position === 0 ? 0 : ELEMENT_SPACING,
                              opacity: 1,
                            }}
                            whileHover={{
                              scale: 1.03,
                              backgroundColor: isElementMoving
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(245, 158, 11, 0.1)',
                            }}
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()

                              if (isElementMoving && onSlotClick) {
                                onSlotClick(shelfIndex, position)
                              }
                            }}
                          >
                            {isElementMoving ? (
                              <span className="text-lg text-blue-600/60">
                                📦
                              </span>
                            ) : (
                              <div className="text-2xl text-amber-400/50">
                                ⬇
                              </div>
                            )}
                          </motion.div>
                        )
                      }
                    )}
                  </div>
                )}

                {/* Elements on this shelf */}
                <div
                  className={clsx(
                    'shelf-elements absolute inset-x-0 top-0 z-10 flex items-end justify-center',
                    isMobile ? 'bottom-4 px-2' : 'bottom-4 px-8'
                  )}
                  style={{
                    maxWidth: `${ELEMENTS_PER_SHELF * (ELEMENT_WIDTH + ELEMENT_SPACING)}px`,
                    margin: '0 auto',
                  }}
                >
                  <AnimatePresence>
                    {/* Создаем все слоты (0-4) и заполняем элементами или пустотой */}
                    {Array.from(
                      { length: ELEMENTS_PER_SHELF },
                      (_, slotPosition) => {
                        // Ищем элемент для этого слота
                        const elementInSlot = shelfElements.find(
                          ({ position }) => position === slotPosition
                        )

                        if (elementInSlot) {
                          // Есть элемент в этом слоте
                          return (
                            <ShelfElement
                              key={elementInSlot.element.id}
                              element={elementInSlot.element}
                              shelfIndex={shelfIndex}
                              position={slotPosition}
                              isSelected={
                                selectedElement?.id === elementInSlot.element.id
                              }
                              isDragged={
                                draggedElement?.id === elementInSlot.element.id
                              }
                              isBeingMoved={
                                elementBeingMoved?.id ===
                                elementInSlot.element.id
                              }
                              viewMode={viewMode}
                              elementWidth={ELEMENT_WIDTH}
                              elementSpacing={ELEMENT_SPACING}
                              onClick={onElementClick ?? (() => {})}
                              onLongPress={onElementLongPress ?? (() => {})}
                            />
                          )
                        } else {
                          // Пустой слот - создаем невидимый placeholder
                          return (
                            <div
                              key={`empty-${slotPosition}`}
                              style={{
                                width: ELEMENT_WIDTH,
                                height: 20, // Минимальная высота
                                marginLeft:
                                  slotPosition === 0 ? 0 : ELEMENT_SPACING,
                                visibility: 'hidden', // Невидимый но занимает место
                              }}
                            />
                          )
                        }
                      }
                    )}
                  </AnimatePresence>
                </div>

                {/* Enhanced shelf lighting effects */}
                <motion.div
                  className="shelf-lighting pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: theme.shelfRadius,
                    overflow: 'hidden',
                    opacity: 0.7,
                  }}
                >
                  {/* Ambient light from above for 3D objects */}
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-yellow-200/50 via-yellow-100/30 to-transparent" />

                  {/* Warm glow on shelf surface */}
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-amber-300/40 via-amber-200/20 to-transparent" />

                  {/* Side lighting for depth */}
                  <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-orange-200/20 to-transparent" />
                  <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-orange-200/20 to-transparent" />

                  {/* Spotlight effect for featured items */}
                  {shelfElements.some(
                    ({ element }) => element.rarity === RarityLevel.LEGENDARY
                  ) && (
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse 60% 40% at center 20%, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                        opacity: 0.2,
                      }}
                    />
                  )}
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Empty state - скрываем при перемещении элемент */}
        {elements.length === 0 && !isElementMoving && (
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                className="mb-6 text-8xl"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: 'easeInOut',
                }}
              >
                📚
              </motion.div>
              <h3 className="mb-3 text-xl font-semibold text-gray-700">
                Полки пусты
              </h3>
              <p className="text-gray-600">
                Отметьте свое настроение, чтобы добавить первый элемент в вашу
                коллекцию!
              </p>
            </div>
          </div>
        )}

        {/* Подсказка при перемещении в пустую комнату */}
        {elements.length === 0 && isElementMoving && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="rounded-2xl bg-blue-50/90 px-8 py-6 text-center shadow-xl backdrop-blur-sm">
              <div className="mb-3 text-6xl">📦</div>
              <h3 className="mb-2 text-lg font-semibold text-blue-900">
                Выберите место для элемента
              </h3>
              <p className="text-sm text-blue-700">
                Нажмите на любой пустой слот на полках
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

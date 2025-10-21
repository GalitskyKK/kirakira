import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { ShelfElement } from './ShelfElement.tsx'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import type { GardenElement as GardenElementType, ViewMode } from '@/types'
import { RarityLevel } from '@/types/garden'

interface ShelfViewProps {
  elements: readonly GardenElementType[]
  selectedElement?: GardenElementType | null
  draggedElement?: GardenElementType | null
  elementBeingMoved?: GardenElementType | null // Элемент в режиме перемещения
  viewMode: ViewMode
  onElementClick?: (element: GardenElementType) => void
  onElementLongPress?: (element: GardenElementType) => void // Долгое нажатие
  onSlotClick?: (shelfIndex: number, position: number) => void // Клик по слоту
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
}: ShelfViewProps) {
  // Responsive design hook
  const [isMobile, setIsMobile] = useState(false)
  const { theme } = useGardenTheme()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
    console.log(
      '🔍 ALL ELEMENTS IN GARDEN:',
      elements.map(el => ({
        name: el.name,
        position: el.position,
        id: el.id,
      }))
    )

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

        console.log(`📦 Placing element ${element.name} [GRID-BASED SYSTEM]:`, {
          gridCoords: element.position,
          shelfFromGridY: gridY,
          positionFromGridX: gridX,
          finalShelf: shelfIndex,
          finalPosition: positionOnShelf,
          ELEMENTS_PER_SHELF,
          canPlace:
            shelfIndex < SHELF_COUNT && positionOnShelf < ELEMENTS_PER_SHELF,
        })

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

        console.log(`📦 Placing element ${element.name} [LINEAR FALLBACK]:`, {
          gridCoords: element.position,
          elementIndex,
          shelfIndex,
          positionOnShelf,
          ELEMENTS_PER_SHELF,
        })

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

      console.log(
        `🗂️ Shelf ${shelf.index} elements:`,
        shelf.elements.map(e => `${e.element.name}@pos${e.position}`).join(', ')
      )
    })

    return shelfData
  }, [elements, ELEMENTS_PER_SHELF])

  const isElementMoving = elementBeingMoved !== null

  return (
    <div className="shelf-container relative min-h-[650px] w-full overflow-visible sm:min-h-[700px] lg:min-h-[750px]">
      {/* Background with wooden texture and magical atmosphere */}
      <div className="absolute left-0 right-0 top-0 h-full min-h-[650px] sm:min-h-[700px] lg:min-h-[750px]">
        <div
          className="absolute inset-0"
          style={{ background: theme.containerBackground }}
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

        {/* Magical floating particles */}
        {Array.from({ length: theme.particleDensity }, (_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute h-1 w-1 rounded-full opacity-60"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              background: `linear-gradient(90deg, ${theme.particleFrom}, ${theme.particleTo})`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main shelf container with perspective */}
      <motion.div
        className="relative w-full"
        style={{
          perspective: '1200px',
          perspectiveOrigin: 'center center',
        }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
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
                }}
                initial={{ opacity: 0, rotateX: -15 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{
                  delay: shelfIndex * 0.2,
                  duration: 0.6,
                  ease: 'easeOut',
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
                        console.log(`🎯 Slot ${shelfIndex}-${position}:`, {
                          width: ELEMENT_WIDTH,
                          spacing: ELEMENT_SPACING,
                          marginLeft: position === 0 ? 0 : ELEMENT_SPACING,
                        })

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
                            }}
                            whileHover={{
                              scale: 1.03,
                              backgroundColor: isElementMoving
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(245, 158, 11, 0.1)',
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: position * 0.1,
                              duration: 0.3,
                            }}
                            onMouseEnter={() => {
                              console.log(
                                '🖱️ Mouse entered slot:',
                                shelfIndex,
                                position,
                                'isElementMoving:',
                                isElementMoving
                              )
                            }}
                            onMouseDown={() => {
                              console.log(
                                '🖱️ Mouse down on slot:',
                                shelfIndex,
                                position
                              )
                            }}
                            onClick={e => {
                              console.log('🎪 SLOT CLICK EVENT:', {
                                event: e.type,
                                target: e.target,
                                currentTarget: e.currentTarget,
                                shelfIndex,
                                position,
                                isElementMoving,
                                elementBeingMoved: elementBeingMoved?.name,
                              })

                              e.preventDefault()
                              e.stopPropagation()

                              console.log('🎪 Slot clicked in ShelfView:', {
                                shelfIndex,
                                position,
                                isElementMoving,
                                hasOnSlotClick: !!onSlotClick,
                                elementBeingMoved: elementBeingMoved?.name,
                              })

                              if (isElementMoving && onSlotClick) {
                                console.log('🚀 Calling onSlotClick handler')
                                onSlotClick(shelfIndex, position)
                              } else {
                                console.log('❌ Not calling onSlotClick:', {
                                  isElementMoving,
                                  hasOnSlotClick: !!onSlotClick,
                                })
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

                        console.log(
                          `🎲 Slot ${slotPosition}:`,
                          elementInSlot
                            ? `Element ${elementInSlot.element.name}`
                            : 'Empty'
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
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: shelfIndex * 0.3 + 0.5 }}
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
                      }}
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </motion.div>

                {/* Shelf label */}
                {/* <motion.div
                  className="shelf-label absolute -left-8 top-1/2 -translate-y-1/2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: shelfIndex * 0.2 + 0.8 }}
                >
                  <div className="rounded-lg bg-amber-100/80 px-2 py-1 text-xs font-medium text-amber-800 shadow-sm">
                    Полка {shelfIndex + 1}
                  </div>
                </motion.div> */}
              </motion.div>
            )
          })}
        </div>

        {/* Empty state - скрываем при перемещении элемента */}
        {elements.length === 0 && !isElementMoving && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
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
          </motion.div>
        )}

        {/* Подсказка при перемещении в пустую комнату */}
        {elements.length === 0 && isElementMoving && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
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
          </motion.div>
        )}

        {/* Global magical effects */}
        <motion.div
          className="magical-effects pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1.5 }}
        >
          {/* Floating dust particles */}
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={`dust-${i}`}
              className="absolute h-0.5 w-0.5 rounded-full bg-amber-300"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [0, -100],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 10,
                ease: 'linear',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

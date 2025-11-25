import { motion, useReducedMotion } from 'framer-motion'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { FlowerSVG } from './FlowerSVG'
import { TreeSVG } from './TreeSVG'
import { CrystalSVG } from './CrystalSVG'
import { MushroomSVG } from './MushroomSVG'
import { StoneSVG } from './StoneSVG'
import { GrassSVG } from './GrassSVG'
import { WaterSVG } from './WaterSVG'
import { DecorationSVG } from './DecorationSVG'
// Премиум элементы
import { RainbowFlowerSVG } from './RainbowFlowerSVG'
import { GlowingCrystalSVG } from './GlowingCrystalSVG'
import { MysticMushroomSVG } from './MysticMushroomSVG'
import { StarlightDecorationSVG } from './StarlightDecorationSVG'
import type { GardenElement } from '@/types'
import { ElementType } from '@/types'

interface PlantRendererProps {
  element: GardenElement
  size?: number
  isSelected?: boolean
  isHovered?: boolean
  showTooltip?: boolean
  onClick?: () => void
}

function PlantRendererComponent({
  element,
  size = 64,
  isSelected = false,
  isHovered = false,
  showTooltip = false,
  onClick,
}: PlantRendererProps) {
  // Применяем масштаб элемента для разнообразия
  const actualSize = Math.round(size * (element.scale ?? 1.0))

  // Ленивая активация анимаций по видимости
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  useEffect(() => {
    if (!rootRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting)
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.05 }
    )
    observer.observe(rootRef.current)
    return () => observer.disconnect()
  }, [])

  const prefersReducedMotion = useReducedMotion()

  // Runtime FPS probe: включаем staticMode, если средний FPS за 1с < 50
  const [isLowPerf, setIsLowPerf] = useState<boolean>(false)
  useEffect(() => {
    let mounted = true
    let frames = 0
    let start = performance.now()
    let rafId = 0
    const loop = () => {
      frames++
      const now = performance.now()
      if (now - start >= 1000) {
        const fps = (frames * 1000) / (now - start)
        if (mounted) setIsLowPerf(fps < 50)
        return
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => {
      mounted = false
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const isAnimVisible = isVisible && !prefersReducedMotion && !isLowPerf

  const commonProps = useMemo(
    () => ({
      size: actualSize,
      color: element.color,
      rarity: element.rarity,
      season: element.seasonalVariant,
      isSelected,
      isHovered,
      name: element.name,
      isVisible: isAnimVisible,
      staticMode: prefersReducedMotion || isLowPerf || !isVisible,
    }), [
      actualSize,
      element.color,
      element.rarity,
      element.seasonalVariant,
      element.name,
      isSelected,
      isHovered,
      isAnimVisible,
      prefersReducedMotion,
      isLowPerf,
      isVisible,
    ]
  )

  const renderPlant = () => {

    switch (element.type) {
      case ElementType.FLOWER:
        return <FlowerSVG {...commonProps} />

      case ElementType.TREE:
        return <TreeSVG {...commonProps} />

      case ElementType.CRYSTAL:
        return <CrystalSVG {...commonProps} />

      case ElementType.MUSHROOM:
        return <MushroomSVG {...commonProps} />

      case ElementType.STONE:
        return <StoneSVG {...commonProps} />

      // Премиум элементы
      case ElementType.RAINBOW_FLOWER:
        return <RainbowFlowerSVG {...commonProps} />

      case ElementType.GLOWING_CRYSTAL:
        return <GlowingCrystalSVG {...commonProps} />

      case ElementType.MYSTIC_MUSHROOM:
        return <MysticMushroomSVG {...commonProps} />

      case ElementType.AURORA_TREE:
        return <TreeSVG {...commonProps} /> // Используем обычное дерево с особыми эффектами

      case ElementType.GRASS:
        return <GrassSVG {...commonProps} />

      case ElementType.WATER:
        return <WaterSVG {...commonProps} />

      case ElementType.DECORATION:
        return <DecorationSVG {...commonProps} />

      case ElementType.STARLIGHT_DECORATION:
        return <StarlightDecorationSVG {...commonProps} />

      default:
        return <FlowerSVG {...commonProps} />
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <motion.div
        className="cursor-pointer"
        onClick={onClick}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        style={{ willChange: 'transform, opacity' }}
      >
        {renderPlant()}
      </motion.div>

      {showTooltip && (
        <motion.div
          className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-black px-2 py-1 text-xs text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {element.name}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
        </motion.div>
      )}
    </div>
  )
}

function areEqual(prev: PlantRendererProps, next: PlantRendererProps) {
  return (
    prev.element.id === next.element.id &&
    prev.element.type === next.element.type &&
    prev.element.color === next.element.color &&
    prev.element.rarity === next.element.rarity &&
    prev.element.seasonalVariant === next.element.seasonalVariant &&
    prev.element.name === next.element.name &&
    (prev.element.scale ?? 1) === (next.element.scale ?? 1) &&
    prev.size === next.size &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.showTooltip === next.showTooltip &&
    prev.onClick === next.onClick
  )
}

export const PlantRenderer = memo(PlantRendererComponent, areEqual)

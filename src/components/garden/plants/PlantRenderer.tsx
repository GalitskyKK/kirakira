import { motion } from 'framer-motion'
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

export function PlantRenderer({
  element,
  size = 64,
  isSelected = false,
  isHovered = false,
  showTooltip = false,
  onClick,
}: PlantRendererProps) {
  const renderPlant = () => {
    const commonProps = {
      size,
      color: element.color,
      rarity: element.rarity,
      season: element.seasonalVariant,
      isSelected,
      isHovered,
      name: element.name,
    }

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
    <div className="relative">
      <motion.div
        className="cursor-pointer"
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
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

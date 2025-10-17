import { motion } from 'framer-motion'

/**
 * 🧊 Компонент отображения заморозок стрика
 * Показывается в хедере рядом с валютой
 */

interface StreakFreezeIndicatorProps {
  readonly manual: number // Обычные заморозки
  readonly auto: number // Авто-заморозки
  readonly max: number // Максимальное накопление
  readonly onClick?: () => void
  readonly showBorder?: boolean // Показывать ли рамку (по умолчанию true)
}

export function StreakFreezeIndicator({
  manual,
  auto,
  max,
  onClick,
  showBorder = true,
}: StreakFreezeIndicatorProps) {
  const isNearMax = manual >= max - 1

  const content = (
    <>
      {/* Обычные заморозки */}
      <div className="flex items-center gap-1">
        <span className="text-lg">❄️</span>
        <span
          className={`text-sm font-semibold ${
            manual > 0 ? 'text-blue-400' : 'text-gray-500'
          }`}
        >
          {manual}
        </span>
      </div>

      {/* Авто-заморозки (если есть) */}
      {auto > 0 && (
        <>
          <span className="text-xs text-gray-400">|</span>
          <div className="flex items-center gap-1">
            <span className="text-lg">❄️</span>
            <span className="absolute -ml-1 -mt-2 text-[10px]">✨</span>
            <span className="text-sm font-semibold text-cyan-400">{auto}</span>
          </div>
        </>
      )}

      {/* Индикатор близости к максимуму */}
      {isNearMax && manual < max && (
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-yellow-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </>
  )

  if (showBorder) {
    return (
      <motion.button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 transition-colors hover:bg-blue-500/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`Заморозки стрика:\n• Обычные: ${manual}/${max}\n• Авто: ${auto} (срабатывают автоматически)`}
      >
        {content}
      </motion.button>
    )
  }

  return (
    <div
      className="flex items-center gap-1.5"
      title={`Заморозки стрика:\n• Обычные: ${manual}/${max}\n• Авто: ${auto} (срабатывают автоматически)`}
    >
      {content}
    </div>
  )
}

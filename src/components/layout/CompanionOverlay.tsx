import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GardenCompanion } from '@/components/garden'
import { CompanionInfoPanel } from './CompanionInfoPanel'
import {
  useCompanionVisibility,
  useCompanionInfoPanel,
  useCompanionStore,
} from '@/stores/companionStore'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useUserSync } from '@/hooks/index.v2'
import { useTranslation } from '@/hooks/useTranslation'

export function CompanionOverlay() {
  const { isVisible } = useCompanionVisibility()
  const { isInfoOpen, setInfoOpen } = useCompanionInfoPanel()
  const position = useCompanionStore(state => state.position)
  const isDragging = useCompanionStore(state => state.isDragging)

  // Отслеживаем предыдущую сторону для определения смены
  const prevSideRef = useRef(position.side)
  const [isChangingSide, setIsChangingSide] = useState(false)

  const telegramId = useTelegramId()
  const isTelegramIdAvailable = telegramId !== undefined && telegramId !== null
  const { data: userData } = useUserSync(telegramId, isTelegramIdAvailable)
  const userLevel = userData?.user?.level ?? 1
  const isUnlocked = userLevel >= 3
  const levelsRemaining = Math.max(3 - userLevel, 0)

  // Отслеживаем размер экрана для определения mobile/desktop
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640
    }
    return true
  })

  useEffect(() => {
    if ((!isUnlocked || !isVisible) && isInfoOpen) {
      setInfoOpen(false)
    }
  }, [isUnlocked, isVisible, isInfoOpen, setInfoOpen])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Отслеживаем смену стороны
  useEffect(() => {
    if (prevSideRef.current !== position.side) {
      setIsChangingSide(true)
      prevSideRef.current = position.side

      // Сбрасываем флаг после короткой анимации
      const timer = setTimeout(() => {
        setIsChangingSide(false)
      }, 100)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [position.side])

  // Определяем позицию для locked preview (используем дефолтную позицию)
  const lockedPositionStyle = {
    bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
  }

  // Определяем динамическую позицию для компаньона
  // ВАЖНО: явно устанавливаем все 4 стороны для избежания конфликтов
  const companionPositionStyle: React.CSSProperties = useMemo(() => {
    return isMobile
      ? {
          // Для мобильных - позиционируем снизу
          bottom: `calc(${position.yPosition}px + env(safe-area-inset-bottom, 0px))`,
          top: 'auto',
          left: position.side === 'left' ? '24px' : 'auto',
          right: position.side === 'right' ? '24px' : 'auto',
        }
      : {
          // Для десктопа - позиционируем сверху
          top: '24px',
          bottom: 'auto',
          left: position.side === 'left' ? '32px' : 'auto',
          right: position.side === 'right' ? '32px' : 'auto',
        }
  }, [isMobile, position.yPosition, position.side])

  if (!isUnlocked) {
    return (
      <div
        className="pointer-events-none fixed right-6 z-[1500] sm:bottom-auto sm:right-8 sm:top-6"
        style={lockedPositionStyle}
      >
        <CompanionLockedPreview levelsRemaining={levelsRemaining} />
      </div>
    )
  }

  if (!isVisible) {
    return null
  }

  // Стили с CSS transition
  const containerStyle: React.CSSProperties = {
    ...companionPositionStyle,
    // Transition только для bottom (Y позиция), НЕ для left/right
    transition:
      isDragging || isChangingSide
        ? 'none'
        : 'bottom 0.25s ease-out, top 0.25s ease-out',
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={`companion-container-${position.side}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="pointer-events-none fixed z-[1500]"
            style={containerStyle}
          >
            <GardenCompanion className="pointer-events-auto" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Рендерим модалку отдельно на верхнем уровне */}
      <CompanionInfoPanel />
    </>
  )
}

interface CompanionLockedPreviewProps {
  readonly levelsRemaining: number
}

function CompanionLockedPreview({
  levelsRemaining,
}: CompanionLockedPreviewProps) {
  const t = useTranslation()
  const [showHint, setShowHint] = useState(true)
  const hideTimerRef = useRef<number | null>(null)

  const getLevelText = (count: number): string => {
    if (count <= 0) {
      return t.companionSettings.verySoon
    }
    if (count === 1) {
      return t.companionSettings.levelRemaining
    }
    if (count >= 2 && count <= 4) {
      return t.companionSettings.levelsRemaining.replace(
        '{count}',
        String(count)
      )
    }
    return t.companionSettings.levelsRemainingPlural.replace(
      '{count}',
      String(count)
    )
  }

  const remainingText = getLevelText(levelsRemaining)

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = window.setTimeout(() => {
      setShowHint(false)
    }, 3200)
  }, [])

  useEffect(() => {
    scheduleHide()
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [scheduleHide])

  const handleRevealHint = () => {
    setShowHint(true)
    scheduleHide()
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <motion.button
        type="button"
        onClick={handleRevealHint}
        className="pointer-events-auto relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-400/50 bg-slate-200/40 shadow-inner transition hover:border-slate-400 dark:border-slate-600/50 dark:bg-slate-800/40 dark:hover:border-slate-500"
        animate={{ opacity: [0.6, 0.85, 0.6], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-label={t.companionSettings.willUnlockAtLevel}
      >
        <motion.div
          className="absolute bottom-[-6px] h-6 w-12 rounded-full bg-slate-400/35 blur-lg dark:bg-slate-600/40"
          animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="relative text-xl text-slate-400/80 dark:text-slate-500/80"
          animate={{ y: [0, -4, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✨
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {showHint && (
          <motion.div
            key="locked-hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none max-w-[220px] rounded-2xl bg-white/90 px-3 py-2 text-right shadow-lg backdrop-blur dark:bg-slate-900/90"
          >
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-100">
              {t.companionSettings.willUnlockAtLevel}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-300">
              {remainingText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

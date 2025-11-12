import { AnimatePresence, motion } from 'framer-motion'
import { getCompanionDefinition } from '@/data/companions'
import {
  useCompanionStore,
  useCompanionInfoPanel,
} from '@/stores/companionStore'
import { MOOD_CONFIG } from '@/types'

export function CompanionInfoPanel() {
  const { isInfoOpen, setInfoOpen } = useCompanionInfoPanel()
  const activeCompanionId = useCompanionStore(state => state.activeCompanionId)
  const currentEmotion = useCompanionStore(state => state.currentEmotion)
  const lastMood = useCompanionStore(state => state.lastMood)

  const definition = getCompanionDefinition(activeCompanionId)
  const emotionVisual = definition.emotions[currentEmotion]

  console.log('📋 CompanionInfoPanel render - isInfoOpen:', isInfoOpen)

  return (
    <AnimatePresence>
      {isInfoOpen && (
        <>
          {/* Фоновый overlay */}
          <motion.div
            key="companion-info-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto fixed inset-0 z-[1599] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setInfoOpen(false)}
          >
            {/* Панель информации */}
            <motion.div
              key="companion-info"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-auto relative z-[1600] w-[280px] max-w-[90vw] rounded-2xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Дух сада
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {definition.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  className="rounded-full bg-slate-200/60 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-300/70 dark:bg-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-600/80"
                >
                  Закрыть
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {definition.description}
              </p>

              <div className="mt-3 rounded-xl bg-gradient-to-r from-indigo-100/70 via-white/40 to-indigo-50/60 p-3 shadow-inner dark:from-indigo-500/15 dark:via-slate-900/60 dark:to-indigo-400/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  Текущее состояние
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {emotionVisual.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {emotionVisual.description}
                </p>
                {lastMood && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                    Настроение дня:{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-100">
                      {`${MOOD_CONFIG[lastMood].emoji} ${MOOD_CONFIG[lastMood].label}`}
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-slate-300/60 p-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-300">
                ✨ В будущих обновлениях вы сможете менять облик Лумины и
                открывать коллекцию питомцев.
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

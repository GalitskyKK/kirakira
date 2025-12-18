import { motion } from 'framer-motion'
import { useState } from 'react'
import { User, MoodStats } from '@/types'
import { calculateAchievements } from '@/utils/achievements'
import { useTranslation } from '@/hooks/useTranslation'

interface ProfileAchievementsProps {
  readonly user: User
  readonly moodStats: MoodStats
  readonly totalElements: number
}

interface AchievementBadgeProps {
  readonly emoji: string
  readonly name: string
  readonly description: string
  readonly isUnlocked: boolean
  readonly progress: number
  readonly maxProgress: number
  readonly delay?: number
}

function AchievementBadge({
  emoji,
  name,
  description,
  isUnlocked,
  progress,
  maxProgress,
  delay = 0,
}: AchievementBadgeProps) {
  return (
    <motion.div
      className={`rounded-lg border p-3 transition-all ${
        isUnlocked
          ? 'glass-card border-kira-200 dark:border-kira-700'
          : 'glass-card border-neutral-200 dark:border-neutral-700'
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="text-center">
        <div
          className={`mb-1 text-2xl ${isUnlocked ? 'grayscale-0' : 'grayscale'}`}
        >
          {emoji}
        </div>
        <div
          className={`text-xs font-medium ${isUnlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {name}
        </div>
        <div
          className={`mt-1 text-xs ${isUnlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}
        >
          {description}
        </div>

        {/* Progress bar for incomplete achievements */}
        {!isUnlocked && maxProgress > 1 && (
          <div className="mt-2">
            <div className="mb-1 h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-garden-400 to-green-500"
                style={{
                  width: `${Math.min((progress / maxProgress) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {progress}/{maxProgress}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ProfileAchievements({
  user,
  moodStats,
  totalElements,
}: ProfileAchievementsProps) {
  const t = useTranslation()
  const [showAll, setShowAll] = useState(false)

  // Защита от undefined - создаем fallback значения для moodStats
  const safeMoodStats = moodStats ?? {
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    mostFrequentMood: null,
    averageIntensity: 0,
    moodDistribution: {
      joy: 0,
      calm: 0,
      stress: 0,
      sadness: 0,
      anger: 0,
      anxiety: 0,
    },
    weeklyTrend: [],
    monthlyTrend: [],
  }

  // Use the new achievements system
  const achievements = calculateAchievements(user, safeMoodStats, totalElements)
  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const displayedAchievements = showAll
    ? achievements
    : achievements.slice(0, 2)

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🏆 {t.profile.achievements}
        </h2>
        <div className="rounded-full bg-garden-100 px-3 py-1 text-sm font-medium text-garden-600 dark:bg-garden-900/50 dark:text-garden-400">
          {unlockedCount}/{achievements.length}
        </div>
      </div>

      {/* Achievements Grid - показываем только первые 2 или все */}
      <div className="grid grid-cols-2 gap-3">
        {displayedAchievements.map((achievement, index) => (
          <AchievementBadge
            key={achievement.name}
            emoji={achievement.emoji}
            name={achievement.name}
            description={achievement.description}
            isUnlocked={achievement.isUnlocked}
            progress={achievement.progress ?? 0}
            maxProgress={achievement.maxProgress ?? 1}
            delay={0.1 + index * 0.05}
          />
        ))}
      </div>

      {/* Кнопка "Посмотреть все" если есть больше 2 достижений */}
      {achievements.length > 2 && !showAll && (
        <motion.button
          onClick={() => setShowAll(true)}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {t.profile.viewAll} ({achievements.length})
        </motion.button>
      )}

      {/* Кнопка "Свернуть" если показаны все */}
      {showAll && achievements.length > 2 && (
        <motion.button
          onClick={() => setShowAll(false)}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {t.profile.collapse}
        </motion.button>
      )}

      {/* Progress Summary */}
      <motion.div
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-center">
          <div className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {unlockedCount === achievements.length ? '🎉' : '🎯'}
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {unlockedCount === achievements.length
              ? t.profile.allUnlocked
              : t.profile.moreAchievements.replace(
                  '{count}',
                  String(achievements.length - unlockedCount)
                )}
          </div>
          {unlockedCount < achievements.length && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t.profile.continueCaring}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

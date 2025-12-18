/**
 * 📜 КОМПОНЕНТ: История транзакций валюты
 * Показывает историю заработка и трат валюты
 */

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useCurrencyTransactions } from '@/hooks/queries'
import type { CurrencyTransaction } from '@/types/currency'
import { SingleCurrencyDisplay } from './CurrencyDisplay'
import { ArrowUp, ArrowDown, Clock, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'

interface TransactionHistoryProps {
  readonly telegramId: number
  readonly limit?: number
  readonly showFilters?: boolean
}

/**
 * Компонент истории транзакций
 */
export function TransactionHistory({
  telegramId,
  limit = 50,
  showFilters = true,
}: TransactionHistoryProps): JSX.Element {
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const dateLocale = locale === 'en' ? enUS : ru

  // Используем React Query для получения данных
  const { data: transactionsData, isLoading } = useCurrencyTransactions(
    telegramId,
    limit,
    !!telegramId
  )
  // Получаем транзакции из v2 store (синхронизируются через useCurrencySync)
  const { recentTransactions } = useCurrencyClientStore()
  // Используем данные из React Query если есть, иначе из store
  const transactions = transactionsData ?? recentTransactions

  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all')
  const [currencyFilter, setCurrencyFilter] = useState<
    'all' | 'sprouts' | 'gems'
  >('all')

  // Фильтрация транзакций
  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all' && tx.transactionType !== filter) return false
    if (currencyFilter !== 'all' && tx.currencyType !== currencyFilter)
      return false
    return true
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">
          {t.transactionHistory.empty}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t.transactionHistory.emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-500 dark:text-gray-400" />

          {/* Фильтр по типу транзакции */}
          <div className="glass-card flex rounded-2xl p-1.5">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              {t.transactionHistory.all}
            </FilterButton>
            <FilterButton
              active={filter === 'earn'}
              onClick={() => setFilter('earn')}
            >
              {t.transactionHistory.earned}
            </FilterButton>
            <FilterButton
              active={filter === 'spend'}
              onClick={() => setFilter('spend')}
            >
              {t.transactionHistory.spent}
            </FilterButton>
          </div>

          {/* Фильтр по валюте */}
          <div className="glass-card flex rounded-2xl p-1.5">
            <FilterButton
              active={currencyFilter === 'all'}
              onClick={() => setCurrencyFilter('all')}
            >
              {t.transactionHistory.all}
            </FilterButton>
            <FilterButton
              active={currencyFilter === 'sprouts'}
              onClick={() => setCurrencyFilter('sprouts')}
            >
              {t.transactionHistory.all}
            </FilterButton>
            <FilterButton
              active={currencyFilter === 'gems'}
              onClick={() => setCurrencyFilter('gems')}
            >
              Кристаллы
            </FilterButton>
          </div>
        </div>
      )}

      {/* Список транзакций */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">
            Нет транзакций с выбранными фильтрами
          </p>
        ) : (
          filteredTransactions.map((tx, index) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              index={index}
              t={t}
              dateLocale={dateLocale}
            />
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Отдельный элемент транзакции
 */
interface TransactionItemProps {
  readonly transaction: CurrencyTransaction
  readonly index: number
  readonly t: ReturnType<typeof useTranslation>
  readonly dateLocale: typeof ru | typeof enUS
}

function TransactionItem({
  transaction,
  index,
  t,
  dateLocale,
}: TransactionItemProps): JSX.Element {
  const isEarn = transaction.transactionType === 'earn'
  const Icon = isEarn ? ArrowUp : ArrowDown
  const iconColor = isEarn
    ? 'text-green-500 bg-green-100 dark:bg-green-900/20'
    : 'text-red-500 bg-red-100 dark:bg-red-900/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
    >
      {/* Левая часть: иконка и описание */}
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${iconColor}`}>
          <Icon size={16} />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {transaction.description ||
              formatReason(transaction.reason as string, t)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', {
              locale: dateLocale,
            })}
          </span>
        </div>
      </div>

      {/* Правая часть: сумма */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <span
            className={`text-sm font-bold ${
              isEarn
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isEarn ? '+' : '-'}
            {(transaction.amount ?? 0).toLocaleString()}
          </span>
          <SingleCurrencyDisplay
            amount={0}
            type={transaction.currencyType as 'sprouts' | 'gems'}
            size="sm"
            showAnimation={false}
          />
        </div>

        {/* Баланс после транзакции */}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {t.transactionHistory.balance}{' '}
          {(transaction.balanceAfter ?? 0).toLocaleString()}
        </span>
      </div>
    </motion.div>
  )
}

/**
 * Кнопка фильтра
 */
interface FilterButtonProps {
  readonly active: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}

function FilterButton({
  active,
  onClick,
  children,
}: FilterButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-white text-kira-600 shadow-md dark:bg-neutral-800 dark:text-kira-400'
          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Форматирование причины транзакции для отображения
 */
function formatReason(
  reason: string,
  t: ReturnType<typeof useTranslation>
): string {
  const reasonMap: Record<string, string> = {
    // Ежедневные действия
    daily_mood: t.transactions.dailyMood,
    daily_login: t.transactions.dailyLogin,
    first_mood_of_day: t.transactions.firstMoodOfDay,

    // Стрики
    streak_3_days: t.transactions.streak3Days,
    streak_7_days: t.transactions.streak7Days,
    streak_14_days: t.transactions.streak14Days,
    streak_30_days: t.transactions.streak30Days,
    streak_100_days: t.transactions.streak100Days,
    streak_365_days: t.transactions.streak365Days,

    // Прогрессия
    level_up: t.transactions.levelUp,
    achievement_unlock: t.transactions.achievementUnlock,
    rare_achievement: t.transactions.rareAchievement,

    // Элементы
    element_common: t.transactions.elementCommon,
    element_uncommon: t.transactions.elementUncommon,
    element_rare: t.transactions.elementRare,
    element_epic: t.transactions.elementEpic,
    element_legendary: t.transactions.elementLegendary,

    // Социальное
    friend_visit_garden: t.transactions.friendVisitGarden,
    visit_friend_garden: t.transactions.visitFriendGarden,
    like_friend_garden: t.transactions.likeFriendGarden,
    receive_like: t.transactions.receiveLike,
    share_garden: t.transactions.shareGarden,

    // Челленджи
    complete_daily_quest: t.transactions.completeDailyQuest,
    complete_weekly_challenge: t.transactions.completeWeeklyChallenge,
    complete_monthly_challenge: t.transactions.completeMonthlyChallenge,

    // Покупки
    extra_room: t.transactions.extraRoom,
    upgrade_to_rare: t.transactions.upgradeToRare,
    upgrade_to_epic: t.transactions.upgradeToEpic,
    upgrade_to_legendary: t.transactions.upgradeToLegendary,
  }

  return reasonMap[reason] || reason
}

/**
 * Компактная версия истории (последние 5 транзакций)
 */
interface CompactTransactionHistoryProps {
  readonly telegramId: number
  readonly onSeeAll?: () => void
}

export function CompactTransactionHistory({
  telegramId,
  onSeeAll,
}: CompactTransactionHistoryProps): JSX.Element {
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const dateLocale = locale === 'en' ? enUS : ru

  // Используем React Query для получения данных
  const { data: transactionsData, isLoading } = useCurrencyTransactions(
    telegramId,
    5,
    !!telegramId
  )
  // Получаем транзакции из v2 store (синхронизируются через useCurrencySync)
  const { recentTransactions } = useCurrencyClientStore()
  // Используем данные из React Query если есть, иначе из store
  const transactions = transactionsData ?? recentTransactions

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.slice(0, 5).map((tx, index) => (
        <TransactionItem
          key={tx.id}
          transaction={tx}
          index={index}
          t={t}
          dateLocale={dateLocale}
        />
      ))}

      {transactions.length > 5 && onSeeAll && (
        <button
          onClick={onSeeAll}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300"
        >
          Показать всю историю
        </button>
      )}
    </div>
  )
}

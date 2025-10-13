/**
 * 📜 КОМПОНЕНТ: История транзакций валюты
 * Показывает историю заработка и трат валюты
 */

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useCurrencyStore } from '@/stores/currencyStore'
import type { CurrencyTransaction } from '@/types/currency'
import { SingleCurrencyDisplay } from './CurrencyDisplay'
import { ArrowUp, ArrowDown, Clock, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

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
  const { recentTransactions, loadTransactions, isLoading } = useCurrencyStore()
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all')
  const [currencyFilter, setCurrencyFilter] = useState<
    'all' | 'sprouts' | 'gems'
  >('all')

  useEffect(() => {
    void loadTransactions(telegramId, limit)
  }, [telegramId, limit, loadTransactions])

  // Фильтрация транзакций
  const filteredTransactions = recentTransactions.filter(tx => {
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

  if (recentTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">
          История транзакций пока пуста
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Начните зарабатывать валюту!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-500" />

          {/* Фильтр по типу транзакции */}
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Все
            </FilterButton>
            <FilterButton
              active={filter === 'earn'}
              onClick={() => setFilter('earn')}
            >
              Заработано
            </FilterButton>
            <FilterButton
              active={filter === 'spend'}
              onClick={() => setFilter('spend')}
            >
              Потрачено
            </FilterButton>
          </div>

          {/* Фильтр по валюте */}
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <FilterButton
              active={currencyFilter === 'all'}
              onClick={() => setCurrencyFilter('all')}
            >
              Все
            </FilterButton>
            <FilterButton
              active={currencyFilter === 'sprouts'}
              onClick={() => setCurrencyFilter('sprouts')}
            >
              Ростки
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
            <TransactionItem key={tx.id} transaction={tx} index={index} />
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
}

function TransactionItem({
  transaction,
  index,
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
              formatReason(transaction.reason as string)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', {
              locale: ru,
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
            {transaction.amount.toLocaleString()}
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
          Баланс: {transaction.balanceAfter.toLocaleString()}
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
      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Форматирование причины транзакции для отображения
 */
function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    // Ежедневные действия
    daily_mood: 'Запись настроения',
    daily_login: 'Ежедневный вход',
    first_mood_of_day: 'Первая запись за день',

    // Стрики
    streak_3_days: 'Стрик 3 дня',
    streak_7_days: 'Стрик 7 дней',
    streak_14_days: 'Стрик 14 дней',
    streak_30_days: 'Стрик 30 дней',
    streak_100_days: 'Стрик 100 дней',
    streak_365_days: 'Стрик год!',

    // Прогрессия
    level_up: 'Повышение уровня',
    achievement_unlock: 'Достижение',
    rare_achievement: 'Редкое достижение',

    // Элементы
    element_common: 'Обычный элемент',
    element_uncommon: 'Необычный элемент',
    element_rare: 'Редкий элемент',
    element_epic: 'Эпический элемент',
    element_legendary: 'Легендарный элемент',

    // Социальное
    friend_visit_garden: 'Посещение сада',
    visit_friend_garden: 'Посетил друга',
    like_friend_garden: 'Лайк саду',
    receive_like: 'Получен лайк',
    share_garden: 'Поделился садом',

    // Челленджи
    complete_daily_quest: 'Дневное задание',
    complete_weekly_challenge: 'Недельный челлендж',
    complete_monthly_challenge: 'Месячный челлендж',

    // Покупки
    extra_room: 'Покупка комнаты',
    upgrade_to_rare: 'Улучшение до Rare',
    upgrade_to_epic: 'Улучшение до Epic',
    upgrade_to_legendary: 'Улучшение до Legendary',
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
  const { recentTransactions, loadTransactions, isLoading } = useCurrencyStore()

  useEffect(() => {
    void loadTransactions(telegramId, 5)
  }, [telegramId, loadTransactions])

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
      {recentTransactions.slice(0, 5).map((tx, index) => (
        <TransactionItem key={tx.id} transaction={tx} index={index} />
      ))}

      {recentTransactions.length > 5 && onSeeAll && (
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

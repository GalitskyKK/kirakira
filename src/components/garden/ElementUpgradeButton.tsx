/**
 * ⬆️ КОМПОНЕНТ: ElementUpgradeButton
 * Кнопка для улучшения элемента сада
 */

import { Button } from '@/components/ui'
import {
  type GardenElement,
  canUpgradeElement,
  getNextRarity,
  UPGRADE_COSTS,
  UPGRADE_SUCCESS_RATES,
} from '@/types/garden'
import { useCurrencyClientStore } from '@/stores/currencyStore.v2'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { TrendingUp, Sparkles } from 'lucide-react'

interface ElementUpgradeButtonProps {
  readonly element: GardenElement
  readonly progressBonus?: number
  readonly onUpgrade: () => void
  readonly disabled?: boolean
  readonly isLoading?: boolean
}

export function ElementUpgradeButton({
  element,
  progressBonus = 0,
  onUpgrade,
  disabled = false,
  isLoading = false,
}: ElementUpgradeButtonProps) {
  const { userCurrency } = useCurrencyClientStore()

  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  // Проверяем, можно ли улучшить элемент
  if (!canUpgradeElement(element)) {
    return null
  }

  const nextRarity = getNextRarity(element.rarity)
  if (nextRarity === null) {
    return null
  }

  const cost = UPGRADE_COSTS[element.rarity]
  const baseSuccessRate = UPGRADE_SUCCESS_RATES[element.rarity]
  const totalSuccessRate = Math.min(baseSuccessRate + progressBonus, 100)
  const hasFreeUpgrades = (currentUser?.stats?.freeUpgrades ?? 0) > 0
  const canAffordSprouts = (userCurrency?.sprouts ?? 0) >= cost

  // Проверяем возможность улучшения
  const canUpgrade = hasFreeUpgrades || canAffordSprouts
  const isDisabled = disabled || !canUpgrade || isLoading

  return (
    <Button
      variant={hasFreeUpgrades ? 'primary' : 'secondary'}
      size="md"
      onClick={onUpgrade}
      disabled={isDisabled}
      fullWidth
      leftIcon={
        hasFreeUpgrades ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <TrendingUp className="h-4 w-4" />
        )
      }
    >
      <span className="flex items-center gap-2">
        <span>
          {isLoading
            ? 'Улучшение...'
            : hasFreeUpgrades
              ? 'Улучшить бесплатно'
              : `Улучшить за ${cost}🌿`}
        </span>
        {!isLoading && (
          <>
            <span className="text-xs opacity-75">({totalSuccessRate}%)</span>
            {progressBonus > 0 && (
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold">
                +{progressBonus}%
              </span>
            )}
          </>
        )}
      </span>
    </Button>
  )
}

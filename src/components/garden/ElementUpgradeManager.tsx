/**
 * 🎛️ КОМПОНЕНТ: ElementUpgradeManager
 * Управляет процессом улучшения элемента (кнопка + модальные окна)
 */

import { useState } from 'react'
import type { GardenElement, RarityLevel } from '@/types/garden'
import { useCurrencyStore } from '@/stores'
import {
  useUserSync,
  useElementUpgradeInfo,
  useUpgradeElement,
} from '@/hooks/index.v2'
import { ElementUpgradeButton } from './ElementUpgradeButton'
import { UpgradeConfirmModal } from './UpgradeConfirmModal'
import { UpgradeResultModal } from './UpgradeResultModal'

interface ElementUpgradeManagerProps {
  readonly element: GardenElement
}

export function ElementUpgradeManager({ element }: ElementUpgradeManagerProps) {
  const { userCurrency } = useCurrencyStore()

  // Получаем данные пользователя через React Query
  const { data: userData } = useUserSync(undefined, false)
  const currentUser = userData?.user

  // React Query хуки для upgrade функций
  const { data: upgradeInfo } = useElementUpgradeInfo(
    currentUser?.telegramId,
    element.id,
    !!currentUser?.telegramId
  )
  const upgradeElementMutation = useUpgradeElement()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [upgradeResult, setUpgradeResult] = useState<{
    success: boolean
    newRarity?: RarityLevel
    xpReward?: number
    progressBonus?: number
    failedAttempts?: number
  } | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Получаем данные из React Query
  const progressBonus = upgradeInfo?.progressBonus ?? 0
  const failedAttempts = upgradeInfo?.failedAttempts ?? 0

  const handleOpenConfirm = () => {
    setShowConfirmModal(true)
  }

  const handleCloseConfirm = () => {
    setShowConfirmModal(false)
  }

  const handleConfirmUpgrade = async (useFree: boolean) => {
    if (!currentUser?.telegramId) return

    setShowConfirmModal(false)
    setIsUpgrading(true)

    try {
      // Выполняем улучшение через React Query
      const result = await upgradeElementMutation.mutateAsync({
        telegramId: currentUser.telegramId,
        elementId: element.id,
        useFree,
      })

      // 🔄 СИНХРОНИЗИРУЕМ ВАЛЮТУ ПОСЛЕ УЛУЧШЕНИЯ
      try {
        const { loadCurrency } = useCurrencyStore.getState()
        await loadCurrency(currentUser.telegramId)
        console.log('✅ Currency synced after element upgrade')
      } catch (error) {
        console.warn('⚠️ Failed to sync currency after upgrade:', error)
      }

      if (result) {
        setUpgradeResult({
          success: result.upgraded,
          ...(result.newRarity !== undefined && {
            newRarity: result.newRarity,
          }),
          ...(result.upgraded && { xpReward: result.xpReward }),
          progressBonus: result.progressBonus ?? 0,
          failedAttempts: result.failedAttempts ?? 0,
        })
        setShowResultModal(true)

        // 🎉 ИНФОРМАЦИЯ ОБНОВЛЯЕТСЯ ПРЯМО НА СТРАНИЦЕ ЭЛЕМЕНТА
        if (result.upgraded) {
          console.log('✅ Element details will be updated automatically')
        }
      }
    } catch (error) {
      console.error('Failed to upgrade element:', error)
      setUpgradeResult({
        success: false,
      })
      setShowResultModal(true)
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleCloseResult = () => {
    setShowResultModal(false)
    setUpgradeResult(null)
  }

  return (
    <>
      <ElementUpgradeButton
        element={element}
        progressBonus={progressBonus}
        onUpgrade={handleOpenConfirm}
        isLoading={isUpgrading}
      />

      <UpgradeConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmUpgrade}
        element={element}
        progressBonus={progressBonus}
        failedAttempts={failedAttempts}
        hasFreeUpgrades={(currentUser?.stats?.freeUpgrades ?? 0) > 0}
        currentSprouts={userCurrency?.sprouts ?? 0}
        isLoading={isUpgrading}
      />

      {upgradeResult !== null && upgradeResult !== undefined && (
        <UpgradeResultModal
          isOpen={showResultModal}
          onClose={handleCloseResult}
          success={upgradeResult.success}
          element={element}
          oldRarity={element.rarity}
          {...(upgradeResult.newRarity !== undefined && {
            newRarity: upgradeResult.newRarity,
          })}
          {...(upgradeResult.xpReward !== undefined && {
            xpReward: upgradeResult.xpReward,
          })}
          {...(upgradeResult.progressBonus !== undefined && {
            progressBonus: upgradeResult.progressBonus,
          })}
          {...(upgradeResult.failedAttempts !== undefined && {
            failedAttempts: upgradeResult.failedAttempts,
          })}
        />
      )}
    </>
  )
}

/**
 * 🎛️ КОМПОНЕНТ: ElementUpgradeManager
 * Управляет процессом улучшения элемента (кнопка + модальные окна)
 */

import { useState, useEffect } from 'react'
import type { GardenElement, RarityLevel } from '@/types/garden'
import { useGardenStore } from '@/stores'
import { useCurrencyStore } from '@/stores'
import { useUserStore } from '@/stores'
import { ElementUpgradeButton } from './ElementUpgradeButton'
import { UpgradeConfirmModal } from './UpgradeConfirmModal'
import { UpgradeResultModal } from './UpgradeResultModal'

interface ElementUpgradeManagerProps {
  readonly element: GardenElement
}

export function ElementUpgradeManager({ element }: ElementUpgradeManagerProps) {
  const { upgradeElement, getElementUpgradeInfo } = useGardenStore()
  const { userCurrency } = useCurrencyStore()
  const { currentUser } = useUserStore()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [upgradeResult, setUpgradeResult] = useState<{
    success: boolean
    newRarity?: RarityLevel
    xpReward?: number
    progressBonus?: number
    failedAttempts?: number
  } | null>(null)
  const [progressBonus, setProgressBonus] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Загружаем информацию об улучшении элемента
  useEffect(() => {
    async function loadUpgradeInfo() {
      const info = await getElementUpgradeInfo(element.id)
      if (info !== null && info !== undefined) {
        setProgressBonus(info.progressBonus)
        setFailedAttempts(info.failedAttempts)
      }
    }

    void loadUpgradeInfo()
  }, [element.id, getElementUpgradeInfo])

  const handleOpenConfirm = () => {
    setShowConfirmModal(true)
  }

  const handleCloseConfirm = () => {
    setShowConfirmModal(false)
  }

  const handleConfirmUpgrade = async (useFree: boolean) => {
    setShowConfirmModal(false)
    setIsUpgrading(true)

    try {
      // Выполняем улучшение
      const result = await upgradeElement(element.id, useFree)

      if (result.success) {
        // 🔄 СИНХРОНИЗИРУЕМ ВАЛЮТУ ПОСЛЕ УЛУЧШЕНИЯ
        // Это критично для предотвращения повторных улучшений с устаревшим балансом
        try {
          const { loadCurrency } = useCurrencyStore.getState()
          if (currentUser?.telegramId) {
            await loadCurrency(currentUser.telegramId)
            console.log('✅ Currency synced after element upgrade')
          }
        } catch (error) {
          console.warn('⚠️ Failed to sync currency after upgrade:', error)
        }

        // Обновляем прогресс бонус для следующей попытки
        const newInfo = await getElementUpgradeInfo(element.id)
        if (newInfo !== null && newInfo !== undefined) {
          setProgressBonus(newInfo.progressBonus)
          setFailedAttempts(newInfo.failedAttempts)
        }

        setUpgradeResult({
          success: result.upgraded,
          ...(result.newRarity !== undefined && {
            newRarity: result.newRarity,
          }),
          ...(result.upgraded && { xpReward: 20 }), // TODO: получать из API
          ...(newInfo !== null &&
            newInfo !== undefined && {
              progressBonus: newInfo.progressBonus,
              failedAttempts: newInfo.failedAttempts,
            }),
        })
        setShowResultModal(true)

        // 🎉 ИНФОРМАЦИЯ ОБНОВЛЯЕТСЯ ПРЯМО НА СТРАНИЦЕ ЭЛЕМЕНТА
        // Больше не закрываем модалку, так как ElementDetails автоматически обновляется
        if (result.upgraded) {
          console.log('✅ Element details will be updated automatically')
        }
      } else {
        // Ошибка API
        setUpgradeResult({
          success: false,
        })
        setShowResultModal(true)
      }
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

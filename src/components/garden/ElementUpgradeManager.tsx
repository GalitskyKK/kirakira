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

    // Выполняем улучшение
    const result = await upgradeElement(element.id, useFree)

    if (result.success) {
      // Обновляем прогресс бонус для следующей попытки
      const newInfo = await getElementUpgradeInfo(element.id)
      if (newInfo !== null && newInfo !== undefined) {
        setProgressBonus(newInfo.progressBonus)
        setFailedAttempts(newInfo.failedAttempts)
      }

      setUpgradeResult({
        success: result.upgraded,
        ...(result.newRarity !== undefined && { newRarity: result.newRarity }),
        ...(result.upgraded && { xpReward: 20 }), // TODO: получать из API
        ...(newInfo !== null &&
          newInfo !== undefined && {
            progressBonus: newInfo.progressBonus,
            failedAttempts: newInfo.failedAttempts,
          }),
      })
      setShowResultModal(true)
    } else {
      // Ошибка API
      setUpgradeResult({
        success: false,
      })
      setShowResultModal(true)
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

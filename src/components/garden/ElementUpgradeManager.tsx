/**
 * 🎛️ КОМПОНЕНТ: ElementUpgradeManager
 * Управляет процессом улучшения элемента (кнопка + модальные окна)
 */

import { useState, useCallback, useRef } from 'react'
import type { GardenElement, RarityLevel } from '@/types/garden'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import {
  useUserSync,
  useElementUpgradeInfo,
  useUpgradeElement,
} from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { ElementUpgradeButton } from './ElementUpgradeButton'
import { UpgradeConfirmModal } from './UpgradeConfirmModal'
import { UpgradeResultModal } from './UpgradeResultModal'

export interface ElementUpgradeManagerProps {
  readonly element: GardenElement
  readonly onUpgradeSuccess?: (newRarity: RarityLevel, xpReward: number) => void
  readonly onUpgradeComplete?: () => void
}

export function ElementUpgradeManager({
  element,
  onUpgradeSuccess,
  onUpgradeComplete,
}: ElementUpgradeManagerProps) {
  const { userCurrency } = useCurrencyClientStore()

  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
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

  // ✅ ИСПРАВЛЕНИЕ: Используем ref для предотвращения множественных вызовов
  const isProcessingRef = useRef(false)

  // 🔑 Уникальный ключ для модального окна результата
  const [resultModalKey, setResultModalKey] = useState(0)

  // 🔒 Сохраняем элемент в момент улучшения для предотвращения ререндеров модалки
  const upgradeElementRef = useRef<GardenElement>(element)

  // Получаем данные из React Query
  const progressBonus = upgradeInfo?.progressBonus ?? 0
  const failedAttempts = upgradeInfo?.failedAttempts ?? 0

  const handleOpenConfirm = useCallback(() => {
    setShowConfirmModal(true)
  }, [])

  const handleCloseConfirm = useCallback(() => {
    setShowConfirmModal(false)
  }, [])

  const handleConfirmUpgrade = useCallback(
    async (useFree: boolean) => {
      if (!currentUser?.telegramId || isProcessingRef.current) return

      // 🔒 Блокируем повторные вызовы
      isProcessingRef.current = true
      // 🔑 Сохраняем элемент для модального окна
      upgradeElementRef.current = element
      setShowConfirmModal(false)
      setIsUpgrading(true)

      try {
        // Выполняем улучшение через React Query
        const result = await upgradeElementMutation.mutateAsync({
          telegramId: currentUser.telegramId,
          elementId: element.id,
          useFree,
        })

        // 🔄 ВАЛЮТА АВТОМАТИЧЕСКИ СИНХРОНИЗИРУЕТСЯ ЧЕРЕЗ React Query
        // useCurrencySync() в MobileLayout автоматически обновит store

        if (result) {
          // 🎉 УСПЕХ - показываем оверлей на странице элемента
          if (result.upgraded && result.newRarity !== undefined) {
            // Вызываем callback для показа оверлея
            if (onUpgradeSuccess) {
              onUpgradeSuccess(result.newRarity, result.xpReward ?? 0)
            }
          } else {
            // ❌ НЕУДАЧА - показываем модальное окно
            setUpgradeResult({
              success: false,
              progressBonus: result.progressBonus ?? 0,
              failedAttempts: result.failedAttempts ?? 0,
            })
            // 🔑 Генерируем новый ключ для модального окна
            setResultModalKey(prev => prev + 1)
            setShowResultModal(true)
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
        // 🔓 Разблокируем через небольшую задержку для предотвращения двойных кликов
        setTimeout(() => {
          isProcessingRef.current = false
        }, 500)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.telegramId, element.id, upgradeElementMutation]
    // element намеренно используется без включения в deps для предотвращения ререндеров
  )

  const handleCloseResult = useCallback(() => {
    setShowResultModal(false)
    setUpgradeResult(null)

    if (onUpgradeComplete) {
      // Используем requestAnimationFrame для гарантии выполнения после анимации
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onUpgradeComplete()
        })
      })
    }
  }, [onUpgradeComplete])

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
        onConfirm={useFree => {
          void handleConfirmUpgrade(useFree)
        }}
        element={element}
        progressBonus={progressBonus}
        failedAttempts={failedAttempts}
        hasFreeUpgrades={(currentUser?.stats?.freeUpgrades ?? 0) > 0}
        currentSprouts={userCurrency?.sprouts ?? 0}
        isLoading={isUpgrading}
      />

      {/* Показываем модальное окно ТОЛЬКО для неудачи */}
      {upgradeResult !== null &&
        upgradeResult !== undefined &&
        !upgradeResult.success && (
          <UpgradeResultModal
            key={`upgrade-result-${resultModalKey}`}
            isOpen={showResultModal}
            onClose={handleCloseResult}
            success={false}
            element={upgradeElementRef.current}
            oldRarity={upgradeElementRef.current.rarity}
            progressBonus={upgradeResult.progressBonus ?? 0}
            failedAttempts={upgradeResult.failedAttempts ?? 0}
          />
        )}
    </>
  )
}

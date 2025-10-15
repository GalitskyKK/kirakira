import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Garden,
  GardenElement,
  GardenState,
  Position2D,
  MoodType,
} from '@/types'
import { ViewMode } from '@/types'
import { ElementType, RarityLevel, SeasonalVariant } from '@/types'
import type {
  DatabaseGardenElement,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
} from '@/types/api'
import { useUserStore } from './userStore'
import {
  generateDailyElement,
  canUnlockTodaysElement,
  getCurrentSeason,
} from '@/utils/elementGeneration'
import { saveGarden, loadGarden } from '@/utils/storage'
import {
  getElementName,
  getElementDescription,
  getElementEmoji as getElementEmojiFromUtils,
  getElementColor as getElementColorFromUtils,
  getElementScale,
} from '@/utils/elementNames'
import { authenticatedFetch } from '@/utils/apiClient'
import {
  upgradeElement as upgradeElementAPI,
  getElementUpgradeInfo as getElementUpgradeInfoAPI,
} from '@/api/gardenService'

interface GardenActions {
  // Garden management
  loadGarden: () => void
  createGarden: (userId: string) => void
  updateGarden: (updates: Partial<Garden>) => void

  // Element management
  unlockTodaysElement: (mood: MoodType) => Promise<GardenElement | null>
  syncGarden: (forceSync?: boolean) => Promise<void>
  moveElement: (elementId: string, newPosition: Position2D) => Promise<void>
  selectElement: (element: GardenElement | null) => void

  // Element upgrade management
  upgradeElement: (
    elementId: string,
    useFree?: boolean
  ) => Promise<{
    success: boolean
    upgraded: boolean
    newRarity?: RarityLevel
    error?: string
  }>
  getElementUpgradeInfo: (elementId: string) => Promise<{
    progressBonus: number
    failedAttempts: number
    upgradeCount: number
  } | null>

  // View management
  setViewMode: (mode: ViewMode) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Room navigation
  setCurrentRoomIndex: (roomIndex: number) => void

  // Utility actions
  canUnlockToday: () => boolean
  getElementsCount: () => number
  getLatestElement: () => GardenElement | null
  clearGarden: () => void
}

type GardenStore = GardenState & GardenActions

export const useGardenStore = create<GardenStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentGarden: null,
    isLoading: false,
    error: null,
    viewMode: ViewMode.OVERVIEW,
    selectedElement: null,
    lastSyncTime: 0,
    currentRoomIndex: 0, // Начинаем с первой комнаты

    // Actions
    loadGarden: () => {
      set({ isLoading: true, error: null })

      try {
        const storedGarden = loadGarden()

        if (storedGarden) {
          set({
            currentGarden: storedGarden,
            isLoading: false,
          })
        } else {
          set({
            currentGarden: null,
            isLoading: false,
          })
        }

        // 🔄 Автоматически синхронизируем с сервером
        void get().syncGarden()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load garden'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    // 🔄 СИНХРОНИЗАЦИЯ С SUPABASE
    syncGarden: async (forceSync = false) => {
      try {
        const userStore = useUserStore.getState()
        const currentUser = userStore.currentUser

        if (!currentUser?.telegramId) {
          console.log('📝 No Telegram user - skipping garden sync')
          return
        }

        // 🚫 ОГРАНИЧЕНИЕ: не синхронизируем чаще раз в 10 секунд
        const state = get()
        const now = Date.now()
        const lastSync = state.lastSyncTime

        if (!forceSync && now - lastSync < 10000) {
          // 10 секунд
          console.log('⏳ Skipping garden sync - too soon since last sync')
          return
        }

        console.log(
          `🔄 Syncing garden for user ${currentUser.telegramId}${forceSync ? ' (forced)' : ''}`
        )

        // Обновляем время последней синхронизации
        set({ lastSyncTime: now })

        // Получаем актуальные данные пользователя с сервера
        const response = await authenticatedFetch(
          `/api/profile?action=get_profile&telegramId=${currentUser.telegramId}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const result =
          (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

        console.log('🔍 Garden sync - User profile result:', result)

        // Проверяем наличие пользователя и его данных (приоритет БД над локальными данными)
        if (result.success && result.data?.user && result.data?.stats) {
          console.log('✅ Server has garden data - loading full history')

          // 🔄 ОБНОВЛЯЕМ STREAK В САДУ на основе данных с сервера (приоритет БД)
          const currentGarden = get().currentGarden
          const serverStreak = result.data.stats.currentStreak
          if (currentGarden && serverStreak !== undefined) {
            const updatedGarden = {
              ...currentGarden,
              streak: serverStreak || 0,
              lastVisited: new Date(),
            }
            set({ currentGarden: updatedGarden })
            saveGarden(updatedGarden)
            console.log(
              `🔄 Updated garden streak to: ${serverStreak} (from server)`
            )
          }

          // 🌱 Загружаем полную историю элементов сада с сервера
          const historyResponse = await authenticatedFetch(
            `/api/garden?action=history&telegramId=${currentUser.telegramId}`
          )

          console.log(
            '🔍 Garden history response status:',
            historyResponse.status
          )

          if (historyResponse.ok) {
            const historyResult =
              (await historyResponse.json()) as StandardApiResponse<{
                gardenElements: DatabaseGardenElement[]
              }>
            console.log('🔍 Garden history result:', historyResult)

            if (
              historyResult.success &&
              historyResult.data?.gardenElements &&
              historyResult.data.gardenElements.length > 0
            ) {
              const serverElements = historyResult.data.gardenElements

              // Конвертируем серверные данные в формат приложения с правильными цветами
              // 🔧 ИСПРАВЛЕНИЕ: используем element.id как единый seed для всех характеристик
              const convertedElements = serverElements.map(
                (serverElement: DatabaseGardenElement) => {
                  // Получаем правильные данные элемента на основе типа и настроения
                  const moodInfluence = (serverElement.mood_influence ??
                    'joy') as MoodType
                  const elementType = serverElement.element_type as ElementType
                  const rarity = serverElement.rarity as RarityLevel

                  // 🔑 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: используем serverElement.id как единый seed
                  // Это обеспечивает совпадение с локальной генерацией
                  const characteristicsSeed =
                    serverElement.id || `temp_${Date.now()}`

                  // 🎨 Генерируем все характеристики детерминированно на основе element.id
                  const name = getElementName(
                    elementType,
                    rarity,
                    characteristicsSeed
                  )
                  const description = getElementDescription(
                    elementType,
                    rarity,
                    name
                  )
                  const emoji = getElementEmojiFromUtils(elementType)
                  const color = getElementColorFromUtils(
                    elementType,
                    moodInfluence,
                    characteristicsSeed
                  )
                  const scale = getElementScale(characteristicsSeed)

                  console.log('🔄 Synced element from server:', {
                    id: characteristicsSeed,
                    seed: characteristicsSeed,
                    type: elementType,
                    rarity,
                    name,
                    color,
                    scale,
                    seasonalVariant: serverElement.seasonal_variant,
                  })

                  // 🍂 Используем сезон из БД или определяем по дате разблокировки
                  const seasonalVariant = serverElement.seasonal_variant
                    ? (serverElement.seasonal_variant as SeasonalVariant)
                    : getCurrentSeason(new Date(serverElement.unlock_date))

                  return {
                    id: characteristicsSeed, // UUID без префикса
                    type: elementType,
                    position: {
                      x: serverElement.position_x,
                      y: serverElement.position_y,
                    },
                    unlockDate: new Date(serverElement.unlock_date),
                    moodInfluence,
                    rarity,
                    seasonalVariant, // 🍂 Сохраняем сезон из БД или вычисляем
                    name,
                    description,
                    emoji,
                    color,
                    scale,
                  }
                }
              )

              // Обновляем сад если есть
              const { currentGarden } = get()
              if (currentGarden) {
                const updatedGarden = {
                  ...currentGarden,
                  elements: convertedElements,
                  lastVisited: new Date(),
                }

                set({ currentGarden: updatedGarden })
                saveGarden(updatedGarden)

                console.log(
                  `✅ Synced ${convertedElements.length} garden elements from server`
                )
              }
            }
          }
        } else {
          console.log('📝 No server garden data - local state is primary')

          // 🔄 ОБНОВЛЯЕМ STREAK В САДУ - если нет данных на сервере, streak = 0
          const currentGarden = get().currentGarden
          if (currentGarden && currentGarden.streak !== 0) {
            const updatedGarden = {
              ...currentGarden,
              streak: 0,
              lastVisited: new Date(),
            }
            set({ currentGarden: updatedGarden })
            saveGarden(updatedGarden)
            console.log(`🔄 Reset garden streak to 0 (no server data)`)
          }
        }
      } catch (error) {
        console.warn('⚠️ Garden sync failed:', error)
      }
    },

    createGarden: (userId: string) => {
      set({ isLoading: true, error: null })

      try {
        const newGarden: Garden = {
          id: `garden_${userId}_${Date.now()}`,
          userId,
          elements: [],
          createdAt: new Date(),
          lastVisited: new Date(),
          streak: 0,
          season: SeasonalVariant.SPRING, // Will be updated based on current date
        }

        const success = saveGarden(newGarden)

        if (success) {
          set({
            currentGarden: newGarden,
            isLoading: false,
          })
        } else {
          throw new Error('Failed to save garden')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create garden'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    updateGarden: (updates: Partial<Garden>) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        set({ error: 'No garden to update' })
        return
      }

      set({ isLoading: true, error: null })

      try {
        const updatedGarden: Garden = {
          ...currentGarden,
          ...updates,
          lastVisited: new Date(),
        }

        const success = saveGarden(updatedGarden)

        if (success) {
          set({
            currentGarden: updatedGarden,
            isLoading: false,
          })
        } else {
          throw new Error('Failed to save garden updates')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update garden'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    unlockTodaysElement: async (mood: MoodType) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        set({ error: 'No garden available' })
        return null
      }

      // Check if user can unlock today's element
      const lastElement = get().getLatestElement()
      const canUnlock = canUnlockTodaysElement(lastElement?.unlockDate ?? null)

      if (!canUnlock) {
        set({ error: "Already unlocked today's element" })
        return null
      }

      set({ isLoading: true, error: null })

      try {
        // Get existing positions to avoid overlap
        const existingPositions = currentGarden.elements.map(el => el.position)
        console.log('🔍 Existing positions in garden:', {
          count: existingPositions.length,
          positions: existingPositions.map(p => `(${p.x},${p.y})`).join(', '),
        })

        // ✨ НОВОЕ: Получаем опыт пользователя для rarityBonus
        const currentUser = useUserStore.getState().currentUser
        const userExperience = currentUser?.experience ?? 0

        // Generate new element
        const newElement = generateDailyElement(
          currentGarden.userId,
          new Date(currentGarden.createdAt), // Registration date approximation
          new Date(),
          mood,
          existingPositions,
          userExperience // НОВОЕ: передаём опыт для rarityBonus
        )

        console.log('🌱 Generated new element:', {
          id: newElement.id,
          position: `(${newElement.position.x},${newElement.position.y})`,
          name: newElement.name,
          type: newElement.type,
        })

        // Final collision check before adding to garden
        const finalCollisionCheck = currentGarden.elements.some(
          el =>
            el.position.x === newElement.position.x &&
            el.position.y === newElement.position.y
        )

        if (finalCollisionCheck) {
          console.error(
            '❌ COLLISION DETECTED! Generated element position conflicts with existing element'
          )
          console.error('New element position:', newElement.position)
          console.error('Existing positions:', existingPositions)
          set({
            error: 'Failed to generate element: position collision detected',
            isLoading: false,
          })
          return null
        }

        // 📡 ОТПРАВЛЯЕМ ЭЛЕМЕНТ НА СЕРВЕР СНАЧАЛА для получения серверного UUID
        let finalElement = newElement

        try {
          const userStore = useUserStore.getState()
          const currentUser = userStore.currentUser

          if (currentUser?.telegramId) {
            const response = await authenticatedFetch(
              '/api/garden?action=add-element',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  telegramId: currentUser.telegramId,
                  element: {
                    type: newElement.type,
                    position: newElement.position,
                    unlockDate: newElement.unlockDate.toISOString(),
                    moodInfluence: mood,
                    rarity: newElement.rarity,
                    seasonalVariant:
                      newElement.seasonalVariant ??
                      getCurrentSeason(newElement.unlockDate),
                  },
                  telegramUserData: {
                    userId: currentUser.id,
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    username: currentUser.username,
                    languageCode: currentUser.preferences.language || 'ru',
                    photoUrl: currentUser.photoUrl,
                  },
                }),
              }
            )

            if (response.ok) {
              const serverResult =
                (await response.json()) as StandardApiResponse<{
                  id: string
                  element_type: string
                  rarity: string
                  [key: string]: unknown
                }>

              // 🔑 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Используем серверный UUID для пересчета характеристик
              if (serverResult.success && serverResult.data?.id) {
                const serverUUID = serverResult.data.id

                console.log(
                  '🔄 Recalculating element characteristics with server UUID:',
                  serverUUID
                )

                // Пересчитываем характеристики на основе серверного UUID
                const name = getElementName(
                  newElement.type,
                  newElement.rarity,
                  serverUUID
                )
                const description = getElementDescription(
                  newElement.type,
                  newElement.rarity,
                  name
                )
                const emoji = getElementEmojiFromUtils(newElement.type)
                const color = getElementColorFromUtils(
                  newElement.type,
                  mood,
                  serverUUID
                )
                const scale = getElementScale(serverUUID)

                // Создаем финальный элемент с серверным UUID и пересчитанными характеристиками
                finalElement = {
                  ...newElement,
                  id: serverUUID,
                  name,
                  description,
                  emoji,
                  color,
                  scale,
                }

                console.log('✅ Garden element synced with server UUID:', {
                  serverUUID,
                  name,
                  color,
                  scale,
                })
              } else {
                console.warn(
                  '⚠️ Server response missing element ID, using local element'
                )
              }
            } else {
              console.warn(
                '⚠️ Failed to sync garden element to server:',
                response.status
              )
            }
          }
        } catch (serverError) {
          console.warn(
            '⚠️ Server sync failed, using local element:',
            serverError
          )
        }

        // Обновляем сад с финальным элементом (с серверным UUID если успешно)
        const finalGarden: Garden = {
          ...currentGarden,
          elements: [...currentGarden.elements, finalElement],
          lastVisited: new Date(),
        }

        const localSuccess = saveGarden(finalGarden)

        if (localSuccess) {
          set({
            currentGarden: finalGarden,
            isLoading: false,
            selectedElement: finalElement, // Auto-select new element
          })
          return finalElement
        } else {
          throw new Error('Failed to save new element locally')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to unlock element'
        set({
          error: errorMessage,
          isLoading: false,
        })
        return null
      }
    },

    moveElement: async (elementId: string, newPosition: Position2D) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        set({ error: 'No garden available' })
        return
      }

      set({ isLoading: true, error: null })

      try {
        // Check if position is already occupied
        const isOccupied = currentGarden.elements.some(
          el =>
            el.id !== elementId &&
            el.position.x === newPosition.x &&
            el.position.y === newPosition.y
        )

        if (isOccupied) {
          throw new Error('Position is already occupied')
        }

        // Update element position
        const updatedElements = currentGarden.elements.map(element =>
          element.id === elementId
            ? { ...element, position: newPosition }
            : element
        )

        const updatedGarden: Garden = {
          ...currentGarden,
          elements: updatedElements,
          lastVisited: new Date(),
        }

        const success = saveGarden(updatedGarden)

        if (success) {
          set({
            currentGarden: updatedGarden,
            isLoading: false,
          })

          // 📡 ОТПРАВЛЯЕМ ОБНОВЛЕНИЕ ПОЗИЦИИ НА СЕРВЕР для синхронизации между устройствами
          const userStore = useUserStore.getState()
          const currentUser = userStore.currentUser

          if (currentUser?.telegramId) {
            try {
              const response = await authenticatedFetch(
                '/api/garden?action=update-position',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    telegramId: currentUser.telegramId,
                    elementId,
                    position: newPosition,
                  }),
                }
              )

              if (!response.ok) {
                console.warn(
                  '⚠️ Failed to sync element position to server:',
                  response.status
                )
              } else {
                console.log('✅ Element position synced to server successfully')
              }
            } catch (serverError) {
              console.warn(
                '⚠️ Server position sync failed, but local save succeeded:',
                serverError
              )
            }
          }
        } else {
          throw new Error('Failed to save element position')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to move element'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    selectElement: (element: GardenElement | null) => {
      set({ selectedElement: element })
    },

    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setCurrentRoomIndex: (roomIndex: number) => {
      console.log('🏠 Switching to room:', roomIndex)
      set({ currentRoomIndex: roomIndex })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    // Utility functions
    canUnlockToday: () => {
      const latestElement = get().getLatestElement()
      return canUnlockTodaysElement(latestElement?.unlockDate ?? null)
    },

    getElementsCount: () => {
      const { currentGarden } = get()
      return currentGarden?.elements.length ?? 0
    },

    getLatestElement: () => {
      const { currentGarden } = get()

      if (!currentGarden || currentGarden.elements.length === 0) {
        return null
      }

      // Find element with latest unlock date
      return currentGarden.elements.reduce((latest, current) =>
        current.unlockDate > latest.unlockDate ? current : latest
      )
    },

    // ===============================================
    // ⬆️ UPGRADE ELEMENT ACTIONS
    // ===============================================

    upgradeElement: async (
      elementId: string,
      useFree: boolean = false
    ): Promise<{
      success: boolean
      upgraded: boolean
      newRarity?: RarityLevel
      error?: string
    }> => {
      const { currentGarden } = get()
      const currentUser = useUserStore.getState().currentUser

      if (!currentGarden || !currentUser?.telegramId) {
        return {
          success: false,
          upgraded: false,
          error: 'No garden or user found',
        }
      }

      try {
        set({ isLoading: true, error: null })

        console.log(
          `⬆️ Upgrading element ${elementId} (useFree: ${useFree}) for user ${currentUser.telegramId}`
        )

        // Вызываем API для улучшения
        const apiResult = await upgradeElementAPI(
          currentUser.telegramId,
          elementId,
          useFree
        )

        if (apiResult === null || apiResult === undefined) {
          throw new Error('No result from upgrade API')
        }

        // 💰 ОБНОВЛЯЕМ БАЛАНС ВАЛЮТЫ ПОСЛЕ УЛУЧШЕНИЯ
        // Это предотвращает race conditions и обеспечивает актуальный баланс
        try {
          const { useCurrencyStore } = await import('@/stores/currencyStore')
          const currencyStore = useCurrencyStore.getState()
          await currencyStore.loadCurrency(currentUser.telegramId)
          console.log('✅ Currency balance synced after upgrade')
        } catch (currencyError) {
          console.warn(
            '⚠️ Failed to sync currency after upgrade:',
            currencyError
          )
        }

        // Если улучшение успешно, обновляем элемент в store
        if (apiResult.upgraded === true && apiResult.newRarity !== undefined) {
          const newRarity: RarityLevel = apiResult.newRarity
          const updatedElements = currentGarden.elements.map(el =>
            el.id === elementId
              ? {
                  ...el,
                  rarity: newRarity,
                  // Обновляем имя и цвет для новой редкости
                  name: getElementName(el.type, newRarity, el.id),
                  description: getElementDescription(
                    el.type,
                    newRarity,
                    getElementName(el.type, newRarity, el.id)
                  ),
                  color: getElementColorFromUtils(
                    el.type,
                    el.moodInfluence,
                    el.id
                  ),
                }
              : el
          )

          set({
            currentGarden: {
              ...currentGarden,
              elements: updatedElements,
            },
            isLoading: false,
          })

          console.log(`✅ Element upgraded successfully to ${newRarity}`)
        } else {
          console.log(`⚠️ Upgrade failed, progress increased by 25%`)
          set({ isLoading: false })
        }

        const resultNewRarity: RarityLevel | undefined = apiResult.newRarity
        return {
          success: true,
          upgraded: apiResult.upgraded,
          ...(resultNewRarity !== undefined && { newRarity: resultNewRarity }),
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to upgrade element'
        console.error('❌ Upgrade element error:', errorMessage)
        set({ error: errorMessage, isLoading: false })

        return {
          success: false,
          upgraded: false,
          error: errorMessage,
        }
      }
    },

    getElementUpgradeInfo: async (
      elementId: string
    ): Promise<{
      progressBonus: number
      failedAttempts: number
      upgradeCount: number
    } | null> => {
      const currentUser = useUserStore.getState().currentUser

      if (!currentUser?.telegramId) {
        console.warn('No user found for upgrade info')
        return null
      }

      try {
        const apiInfo = await getElementUpgradeInfoAPI(
          currentUser.telegramId,
          elementId
        )

        if (apiInfo === null || apiInfo === undefined) {
          return {
            progressBonus: 0,
            failedAttempts: 0,
            upgradeCount: 0,
          }
        }

        return {
          progressBonus: apiInfo.progressBonus,
          failedAttempts: apiInfo.failedAttempts,
          upgradeCount: apiInfo.upgradeCount,
        }
      } catch (error) {
        console.error('Failed to get upgrade info:', error)
        return null
      }
    },

    clearGarden: () => {
      set({
        currentGarden: null,
        selectedElement: null,
        viewMode: ViewMode.OVERVIEW,
        error: null,
        isLoading: false,
      })
    },
  }))
)

// Subscribe to garden changes and auto-save
useGardenStore.subscribe(
  state => state.currentGarden,
  garden => {
    if (garden) {
      saveGarden(garden)
    }
  }
)

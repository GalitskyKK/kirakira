import { useCallback, useEffect, useState } from 'react'
import type { CloudStorage } from '@/types/telegram'
import type { User, Garden, MoodEntry } from '@/types'
import { useTelegram } from './useTelegram'

/**
 * Хук для работы с Telegram CloudStorage
 * Предоставляет методы для синхронизации данных приложения
 */
export function useTelegramStorage() {
  const { webApp, isTelegramEnv } = useTelegram()
  const [cloudStorage, setCloudStorage] = useState<CloudStorage | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (webApp?.CloudStorage) {
      setCloudStorage(webApp.CloudStorage)
    }
  }, [webApp])

  // Сохранение данных пользователя в CloudStorage
  const saveUserToCloud = useCallback(
    async (user: User): Promise<boolean> => {
      if (!cloudStorage) return false

      return new Promise(resolve => {
        setIsSyncing(true)
        setSyncError(null)

        const userData = JSON.stringify(user)

        cloudStorage.setItem('user', userData, (error, success) => {
          setIsSyncing(false)

          if (error) {
            setSyncError(`Ошибка сохранения пользователя: ${error}`)
            resolve(false)
          } else {
            setLastSyncTime(new Date())
            resolve(success)
          }
        })
      })
    },
    [cloudStorage]
  )

  // Загрузка данных пользователя из CloudStorage
  const loadUserFromCloud = useCallback(async (): Promise<User | null> => {
    if (!cloudStorage) return null

    return new Promise(resolve => {
      setIsSyncing(true)
      setSyncError(null)

      cloudStorage.getItem('user', (error, value) => {
        setIsSyncing(false)

        if (error) {
          setSyncError(`Ошибка загрузки пользователя: ${error}`)
          resolve(null)
        } else if (value) {
          try {
            const user = JSON.parse(value) as User
            // Восстанавливаем Date объекты
            const restoredUser: User = {
              ...user,
              registrationDate: new Date(user.registrationDate),
              stats: {
                ...user.stats,
                firstVisit: new Date(user.stats.firstVisit),
                lastVisit: new Date(user.stats.lastVisit),
              },
            }
            resolve(restoredUser)
          } catch (parseError) {
            setSyncError('Ошибка парсинга данных пользователя')
            resolve(null)
          }
        } else {
          resolve(null)
        }
      })
    })
  }, [cloudStorage])

  // Сохранение сада в CloudStorage
  const saveGardenToCloud = useCallback(
    async (garden: Garden): Promise<boolean> => {
      if (!cloudStorage) return false

      return new Promise(resolve => {
        setIsSyncing(true)
        setSyncError(null)

        const gardenData = JSON.stringify(garden)

        cloudStorage.setItem('garden', gardenData, (error, success) => {
          setIsSyncing(false)

          if (error) {
            setSyncError(`Ошибка сохранения сада: ${error}`)
            resolve(false)
          } else {
            setLastSyncTime(new Date())
            resolve(success)
          }
        })
      })
    },
    [cloudStorage]
  )

  // Загрузка сада из CloudStorage
  const loadGardenFromCloud = useCallback(async (): Promise<Garden | null> => {
    if (!cloudStorage) return null

    return new Promise(resolve => {
      setIsSyncing(true)
      setSyncError(null)

      cloudStorage.getItem('garden', (error, value) => {
        setIsSyncing(false)

        if (error) {
          setSyncError(`Ошибка загрузки сада: ${error}`)
          resolve(null)
        } else if (value) {
          try {
            const garden = JSON.parse(value) as Garden
            // Восстанавливаем Date объекты
            const restoredGarden: Garden = {
              ...garden,
              createdAt: new Date(garden.createdAt),
              lastVisited: new Date(garden.lastVisited),
              elements: garden.elements.map(element => ({
                ...element,
                unlockDate: new Date(element.unlockDate),
              })),
            }
            resolve(restoredGarden)
          } catch (parseError) {
            setSyncError('Ошибка парсинга данных сада')
            resolve(null)
          }
        } else {
          resolve(null)
        }
      })
    })
  }, [cloudStorage])

  // Сохранение истории настроений в CloudStorage
  const saveMoodHistoryToCloud = useCallback(
    async (moodHistory: readonly MoodEntry[]): Promise<boolean> => {
      if (!cloudStorage) return false

      return new Promise(resolve => {
        setIsSyncing(true)
        setSyncError(null)

        const moodData = JSON.stringify(moodHistory)

        cloudStorage.setItem('moodHistory', moodData, (error, success) => {
          setIsSyncing(false)

          if (error) {
            setSyncError(`Ошибка сохранения настроений: ${error}`)
            resolve(false)
          } else {
            setLastSyncTime(new Date())
            resolve(success)
          }
        })
      })
    },
    [cloudStorage]
  )

  // Загрузка истории настроений из CloudStorage
  const loadMoodHistoryFromCloud = useCallback(async (): Promise<
    readonly MoodEntry[]
  > => {
    if (!cloudStorage) return []

    return new Promise(resolve => {
      setIsSyncing(true)
      setSyncError(null)

      cloudStorage.getItem('moodHistory', (error, value) => {
        setIsSyncing(false)

        if (error) {
          setSyncError(`Ошибка загрузки настроений: ${error}`)
          resolve([])
        } else if (value) {
          try {
            const moodHistory = JSON.parse(value) as MoodEntry[]
            // Восстанавливаем Date объекты
            const restoredHistory = moodHistory.map(entry => ({
              ...entry,
              date: new Date(entry.date),
              createdAt: new Date(entry.createdAt),
            }))
            resolve(restoredHistory)
          } catch (parseError) {
            setSyncError('Ошибка парсинга истории настроений')
            resolve([])
          }
        } else {
          resolve([])
        }
      })
    })
  }, [cloudStorage])

  // Полная синхронизация всех данных
  const syncAllData = useCallback(
    async (
      user: User | null,
      garden: Garden | null,
      moodHistory: readonly MoodEntry[]
    ): Promise<boolean> => {
      if (!cloudStorage) return false

      setIsSyncing(true)
      setSyncError(null)

      try {
        const results = await Promise.all([
          user ? saveUserToCloud(user) : Promise.resolve(true),
          garden ? saveGardenToCloud(garden) : Promise.resolve(true),
          saveMoodHistoryToCloud(moodHistory),
        ])

        const allSuccessful = results.every(Boolean)

        if (allSuccessful) {
          setLastSyncTime(new Date())
        }

        return allSuccessful
      } catch (error) {
        setSyncError(
          `Ошибка синхронизации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        )
        return false
      } finally {
        setIsSyncing(false)
      }
    },
    [cloudStorage, saveUserToCloud, saveGardenToCloud, saveMoodHistoryToCloud]
  )

  // Полная загрузка всех данных
  const loadAllData = useCallback(async (): Promise<{
    user: User | null
    garden: Garden | null
    moodHistory: readonly MoodEntry[]
  }> => {
    if (!cloudStorage) {
      return { user: null, garden: null, moodHistory: [] }
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      const [user, garden, moodHistory] = await Promise.all([
        loadUserFromCloud(),
        loadGardenFromCloud(),
        loadMoodHistoryFromCloud(),
      ])

      return { user, garden, moodHistory }
    } catch (error) {
      setSyncError(
        `Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      )
      return { user: null, garden: null, moodHistory: [] }
    } finally {
      setIsSyncing(false)
    }
  }, [
    cloudStorage,
    loadUserFromCloud,
    loadGardenFromCloud,
    loadMoodHistoryFromCloud,
  ])

  // Очистка всех данных из CloudStorage
  const clearCloudData = useCallback(async (): Promise<boolean> => {
    if (!cloudStorage) return false

    return new Promise(resolve => {
      setIsSyncing(true)
      setSyncError(null)

      const keysToRemove = ['user', 'garden', 'moodHistory', 'lastSync']

      cloudStorage.removeItems(keysToRemove, (error, success) => {
        setIsSyncing(false)

        if (error) {
          setSyncError(`Ошибка очистки: ${error}`)
          resolve(false)
        } else {
          setLastSyncTime(null)
          resolve(success)
        }
      })
    })
  }, [cloudStorage])

  // Получение информации о хранилище
  const getStorageInfo = useCallback(async (): Promise<{
    keys: string[]
    totalSize: number
  }> => {
    if (!cloudStorage) {
      return { keys: [], totalSize: 0 }
    }

    return new Promise(resolve => {
      cloudStorage.getKeys((error, keys) => {
        if (error || !keys) {
          resolve({ keys: [], totalSize: 0 })
        } else {
          cloudStorage.getItems(keys, (error, values) => {
            if (error || !values) {
              resolve({ keys, totalSize: 0 })
            } else {
              const totalSize = Object.values(values).reduce(
                (sum, value) => sum + value.length,
                0
              )
              resolve({ keys, totalSize })
            }
          })
        }
      })
    })
  }, [cloudStorage])

  return {
    // Состояние
    cloudStorage,
    isSyncing,
    lastSyncTime,
    syncError,
    isAvailable: Boolean(cloudStorage),
    isTelegramEnv,

    // Методы для отдельных сущностей
    saveUserToCloud,
    loadUserFromCloud,
    saveGardenToCloud,
    loadGardenFromCloud,
    saveMoodHistoryToCloud,
    loadMoodHistoryFromCloud,

    // Методы для массовых операций
    syncAllData,
    loadAllData,
    clearCloudData,
    getStorageInfo,

    // Утилиты
    clearError: () => setSyncError(null),
  }
}

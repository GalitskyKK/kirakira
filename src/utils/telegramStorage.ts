/**
 * Адаптер хранилища для Telegram Mini Apps
 * Автоматически переключается между localStorage и Telegram CloudStorage
 */

import type { Garden, MoodEntry, User } from '@/types'
import type { CloudStorage } from '@/types/telegram'
import {
  saveUser as saveUserLocal,
  loadUser as loadUserLocal,
  saveGarden as saveGardenLocal,
  loadGarden as loadGardenLocal,
  saveMoodHistory as saveMoodHistoryLocal,
  loadMoodHistory as loadMoodHistoryLocal,
  saveOnboardingCompleted as saveOnboardingLocal,
  isOnboardingCompleted as isOnboardingCompletedLocal,
  clearAllData as clearAllDataLocal,
} from './storage'

// Singleton для работы с Telegram CloudStorage
class TelegramStorageAdapter {
  private cloudStorage: CloudStorage | null = null
  private isInitialized = false

  initialize() {
    if (
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp?.CloudStorage
    ) {
      this.cloudStorage = window.Telegram.WebApp.CloudStorage
      this.isInitialized = true
    }
  }

  get isAvailable(): boolean {
    return this.isInitialized && this.cloudStorage !== null
  }

  // Универсальные методы для работы с данными
  private async cloudGet<T>(key: string, defaultValue: T): Promise<T> {
    if (!this.cloudStorage) return defaultValue

    return new Promise(resolve => {
      this.cloudStorage!.getItem(key, (error, value) => {
        if (error || !value) {
          resolve(defaultValue)
        } else {
          try {
            resolve(JSON.parse(value) as T)
          } catch {
            resolve(defaultValue)
          }
        }
      })
    })
  }

  private async cloudSet(key: string, value: unknown): Promise<boolean> {
    if (!this.cloudStorage) return false

    return new Promise(resolve => {
      this.cloudStorage!.setItem(
        key,
        JSON.stringify(value),
        (error, success) => {
          resolve(!error && success)
        }
      )
    })
  }

  private async cloudRemove(key: string): Promise<boolean> {
    if (!this.cloudStorage) return false

    return new Promise(resolve => {
      this.cloudStorage!.removeItem(key, (error, success) => {
        resolve(!error && success)
      })
    })
  }

  // Методы для User
  async saveUser(user: User): Promise<boolean> {
    const localSuccess = saveUserLocal(user)

    if (this.isAvailable) {
      const cloudSuccess = await this.cloudSet('user', user)
      return localSuccess && cloudSuccess
    }

    return localSuccess
  }

  async loadUser(): Promise<User | null> {
    // Сначала пробуем загрузить из облака
    if (this.isAvailable) {
      const cloudUser = await this.cloudGet<User | null>('user', null)
      if (cloudUser) {
        // Восстанавливаем Date объекты
        const restoredUser: User = {
          ...cloudUser,
          registrationDate: new Date(cloudUser.registrationDate),
          stats: {
            ...cloudUser.stats,
            firstVisit: new Date(cloudUser.stats.firstVisit),
            lastVisit: new Date(cloudUser.stats.lastVisit),
          },
        }
        // Сохраняем в локальное хранилище для офлайн доступа
        saveUserLocal(restoredUser)
        return restoredUser
      }
    }

    // Если нет данных в облаке, загружаем из локального хранилища
    return loadUserLocal()
  }

  // Методы для Garden
  async saveGarden(garden: Garden): Promise<boolean> {
    const localSuccess = saveGardenLocal(garden)

    if (this.isAvailable) {
      const cloudSuccess = await this.cloudSet('garden', garden)
      return localSuccess && cloudSuccess
    }

    return localSuccess
  }

  async loadGarden(): Promise<Garden | null> {
    // Сначала пробуем загрузить из облака
    if (this.isAvailable) {
      const cloudGarden = await this.cloudGet<Garden | null>('garden', null)
      if (cloudGarden) {
        // Восстанавливаем Date объекты
        const restoredGarden: Garden = {
          ...cloudGarden,
          createdAt: new Date(cloudGarden.createdAt),
          lastVisited: new Date(cloudGarden.lastVisited),
          elements: cloudGarden.elements.map(element => ({
            ...element,
            unlockDate: new Date(element.unlockDate),
          })),
        }
        // Сохраняем в локальное хранилище
        saveGardenLocal(restoredGarden)
        return restoredGarden
      }
    }

    return loadGardenLocal()
  }

  // Методы для MoodHistory
  async saveMoodHistory(moodHistory: readonly MoodEntry[]): Promise<boolean> {
    const localSuccess = saveMoodHistoryLocal(moodHistory)

    if (this.isAvailable) {
      const cloudSuccess = await this.cloudSet('moodHistory', moodHistory)
      return localSuccess && cloudSuccess
    }

    return localSuccess
  }

  async loadMoodHistory(): Promise<readonly MoodEntry[]> {
    // Сначала пробуем загрузить из облака
    if (this.isAvailable) {
      const cloudHistory = await this.cloudGet<MoodEntry[]>('moodHistory', [])
      if (cloudHistory.length > 0) {
        // Восстанавливаем Date объекты
        const restoredHistory = cloudHistory.map(entry => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
        }))
        // Сохраняем в локальное хранилище
        saveMoodHistoryLocal(restoredHistory)
        return restoredHistory
      }
    }

    return loadMoodHistoryLocal()
  }

  // Методы для onboarding
  async saveOnboardingCompleted(completed: boolean): Promise<boolean> {
    saveOnboardingLocal(completed)

    if (this.isAvailable) {
      return await this.cloudSet('onboarding', completed)
    }

    return true
  }

  async isOnboardingCompleted(): Promise<boolean> {
    if (this.isAvailable) {
      const cloudValue = await this.cloudGet<boolean>('onboarding', false)
      if (cloudValue) {
        saveOnboardingLocal(cloudValue)
        return cloudValue
      }
    }

    return isOnboardingCompletedLocal()
  }

  // Очистка всех данных
  async clearAllData(): Promise<boolean> {
    clearAllDataLocal()

    if (this.isAvailable) {
      const keys = ['user', 'garden', 'moodHistory', 'onboarding']
      const promises = keys.map(key => this.cloudRemove(key))
      const results = await Promise.all(promises)
      return results.every(Boolean)
    }

    return true
  }

  // Синхронизация данных между локальным хранилищем и облаком
  async syncWithCloud(): Promise<{
    success: boolean
    synced: string[]
    errors: string[]
  }> {
    if (!this.isAvailable) {
      return {
        success: false,
        synced: [],
        errors: ['Telegram CloudStorage недоступен'],
      }
    }

    const synced: string[] = []
    const errors: string[] = []

    try {
      // Загружаем локальные данные
      const localUser = loadUserLocal()
      const localGarden = loadGardenLocal()
      const localMoodHistory = loadMoodHistoryLocal()
      const localOnboarding = isOnboardingCompletedLocal()

      // Синхронизируем с облаком
      if (localUser) {
        const success = await this.cloudSet('user', localUser)
        if (success) {
          synced.push('user')
        } else {
          errors.push('Ошибка синхронизации пользователя')
        }
      }

      if (localGarden) {
        const success = await this.cloudSet('garden', localGarden)
        if (success) {
          synced.push('garden')
        } else {
          errors.push('Ошибка синхронизации сада')
        }
      }

      if (localMoodHistory.length > 0) {
        const success = await this.cloudSet('moodHistory', localMoodHistory)
        if (success) {
          synced.push('moodHistory')
        } else {
          errors.push('Ошибка синхронизации настроений')
        }
      }

      if (localOnboarding) {
        const success = await this.cloudSet('onboarding', localOnboarding)
        if (success) {
          synced.push('onboarding')
        } else {
          errors.push('Ошибка синхронизации онбординга')
        }
      }

      return {
        success: errors.length === 0,
        synced,
        errors,
      }
    } catch (error) {
      return {
        success: false,
        synced,
        errors: [
          `Общая ошибка синхронизации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        ],
      }
    }
  }

  // Получение информации о размере данных
  async getStorageInfo(): Promise<{
    localSize: number
    cloudKeys: string[]
    estimatedCloudSize: number
  }> {
    let cloudKeys: string[] = []
    let estimatedCloudSize = 0

    if (this.isAvailable && this.cloudStorage) {
      try {
        cloudKeys = await new Promise(resolve => {
          this.cloudStorage!.getKeys((error, keys) => {
            resolve(error ? [] : keys || [])
          })
        })

        if (cloudKeys.length > 0) {
          const cloudData = await new Promise<Record<string, string>>(
            resolve => {
              this.cloudStorage!.getItems(cloudKeys, (error, values) => {
                resolve(error ? {} : values || {})
              })
            }
          )

          estimatedCloudSize = Object.values(cloudData).reduce(
            (sum, value) => sum + value.length,
            0
          )
        }
      } catch (error) {
        console.warn('Ошибка получения информации о CloudStorage:', error)
      }
    }

    // Подсчет размера локальных данных
    let localSize = 0
    try {
      const localUser = loadUserLocal()
      const localGarden = loadGardenLocal()
      const localMoodHistory = loadMoodHistoryLocal()

      if (localUser) localSize += JSON.stringify(localUser).length
      if (localGarden) localSize += JSON.stringify(localGarden).length
      if (localMoodHistory) localSize += JSON.stringify(localMoodHistory).length
    } catch (error) {
      console.warn('Ошибка подсчета размера локальных данных:', error)
    }

    return {
      localSize,
      cloudKeys,
      estimatedCloudSize,
    }
  }
}

// Экспортируем singleton
export const telegramStorage = new TelegramStorageAdapter()

// Инициализация при загрузке модуля
if (typeof window !== 'undefined') {
  // Инициализируем сразу, если доступно
  telegramStorage.initialize()

  // Или ждем готовности Telegram WebApp
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready()
    telegramStorage.initialize()
  }
}

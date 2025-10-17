import { useEffect, useState, useCallback } from 'react'
import type {
  TelegramWebApp,
  TelegramUserProfile,
  ThemeParams,
  TelegramEventType,
} from '@/types/telegram'
import { authenticatedFetch } from '@/utils/apiClient'
import { useUpdateQuestProgress } from '@/hooks/queries/useDailyQuestQueries'

/**
 * Хук для работы с Telegram Mini Apps API
 * Предоставляет доступ к WebApp и его возможностям
 */
export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUserProfile | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light')
  const [themeParams, setThemeParams] = useState<ThemeParams>({})
  const [isReady, setIsReady] = useState(false)
  const updateQuestProgress = useUpdateQuestProgress()

  // Инициализация Telegram WebApp
  useEffect(() => {
    const initTelegramWebApp = () => {
      console.log('🔍 TELEGRAM WEBAPP INIT ATTEMPT:', {
        windowDefined: typeof window !== 'undefined',
        windowTelegram: !!window.Telegram,
        windowTelegramWebApp: !!window.Telegram?.WebApp,
        userAgent: navigator.userAgent,
        telegramScript: !!document.querySelector(
          'script[src*="telegram-web-app.js"]'
        ),
      })

      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        console.log('✅ Telegram WebApp обнаружен:', {
          version: tg.version,
          platform: tg.platform,
          initData: !!tg.initData,
          initDataUnsafe: !!tg.initDataUnsafe,
          user: !!tg.initDataUnsafe?.user,
        })

        setWebApp(tg)

        // Извлекаем данные пользователя
        if (tg.initDataUnsafe.user) {
          const telegramUser = tg.initDataUnsafe.user
          const userProfile: TelegramUserProfile = {
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name,
          }

          // Добавляем опциональные поля только если они есть
          if (telegramUser.username)
            userProfile.username = telegramUser.username
          if (telegramUser.last_name)
            userProfile.lastName = telegramUser.last_name
          if (telegramUser.language_code)
            userProfile.languageCode = telegramUser.language_code
          if (telegramUser.is_premium !== undefined)
            userProfile.isPremium = telegramUser.is_premium
          if (telegramUser.photo_url)
            userProfile.photoUrl = telegramUser.photo_url

          setUser(userProfile)
        }

        // Устанавливаем начальные значения
        setIsExpanded(tg.isExpanded)
        setColorScheme(tg.colorScheme)
        setThemeParams(tg.themeParams)

        // Готовность к работе
        console.log('📱 Calling tg.ready() and tg.expand()')
        tg.ready()
        setIsReady(true)

        // Расширяем приложение на весь экран
        tg.expand()

        console.log('✅ Telegram WebApp инициализирован успешно!')
        return true // Успешная инициализация
      }

      console.log('❌ Telegram WebApp НЕ НАЙДЕН или недоступен')
      return false // Не инициализирован
    }

    // Пытаемся инициализировать сразу
    if (!initTelegramWebApp()) {
      // Если не получилось, ждем загрузки скрипта
      const checkTelegram = setInterval(() => {
        if (initTelegramWebApp()) {
          clearInterval(checkTelegram)
        }
      }, 100) // Проверяем каждые 100мс

      // Очистка при размонтировании
      return () => {
        clearInterval(checkTelegram)
        setWebApp(null)
        setIsReady(false)
      }
    }

    // Очистка при размонтировании (если инициализация прошла сразу)
    return () => {
      setWebApp(null)
      setIsReady(false)
    }
  }, [])

  // Подписка на события
  const onEvent = useCallback(
    (eventType: TelegramEventType, handler: () => void) => {
      if (webApp) {
        webApp.onEvent(eventType, handler)
      }
    },
    [webApp]
  )

  const offEvent = useCallback(
    (eventType: TelegramEventType, handler: () => void) => {
      if (webApp) {
        webApp.offEvent(eventType, handler)
      }
    },
    [webApp]
  )

  // Утилиты для работы с интерфейсом
  const showAlert = useCallback(
    (message: string) => {
      if (webApp) {
        webApp.showAlert(message)
      }
    },
    [webApp]
  )

  const showConfirm = useCallback(
    (message: string): Promise<boolean> => {
      return new Promise(resolve => {
        if (webApp) {
          webApp.showConfirm(message, confirmed => {
            resolve(confirmed)
          })
        } else {
          resolve(window.confirm(message))
        }
      })
    },
    [webApp]
  )

  const hapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
      if (webApp?.HapticFeedback) {
        if (type === 'success' || type === 'error' || type === 'warning') {
          webApp.HapticFeedback.notificationOccurred(type)
        } else {
          webApp.HapticFeedback.impactOccurred(type)
        }
      }
    },
    [webApp]
  )

  const shareGarden = useCallback(
    async (gardenImageUrl: string, description: string) => {
      if (webApp) {
        webApp.shareMessage({
          text: `🌸 Посмотрите на мой эмоциональный сад в KiraKira!\n\n${description}\n\n${gardenImageUrl}`,
          parse_mode: 'Markdown',
        })

        // 🏆 НАЧИСЛЯЕМ ОПЫТ ЗА ШЕРИНГ САДА
        if (user?.telegramId) {
          try {
            const response = await authenticatedFetch(
              '/api/profile?action=add_experience',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  telegramId: user.telegramId,
                  experiencePoints: 25, // EXPERIENCE_REWARDS.SHARE_GARDEN
                  reason: 'share_garden: garden screenshot shared',
                }),
              }
            )

            if (response.ok) {
              console.log('🏆 Added XP for sharing garden')

              // Показываем уведомление о получении XP
              if (showAlert) {
                showAlert('🏆 +25 XP за шеринг сада!')
              }

              // 🎯 Обновляем прогресс daily quest для поделиться садом
              try {
                await updateQuestProgress.mutateAsync({
                  telegramId: user.telegramId,
                  questType: 'share_garden',
                  increment: 1,
                })
                console.log('✅ Share garden quest updated')
              } catch (error) {
                console.warn('⚠️ Failed to update share_garden quest:', error)
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to add XP for garden share:', error)
          }
        }
      }
    },
    [webApp, user?.telegramId, showAlert, updateQuestProgress]
  )

  // Закрытие приложения
  const close = useCallback(() => {
    if (webApp) {
      webApp.close()
    }
  }, [webApp])

  // Проверка доступности Telegram среды
  const isTelegramEnv = Boolean(webApp)

  return {
    webApp,
    user,
    isExpanded,
    colorScheme,
    themeParams,
    isReady,
    isTelegramEnv,

    // Методы
    onEvent,
    offEvent,
    showAlert,
    showConfirm,
    hapticFeedback,
    shareGarden,
    close,
  }
}

/**
 * Хук для работы с кнопками Telegram
 */
export function useTelegramButtons() {
  const { webApp } = useTelegram()

  const mainButton = webApp?.MainButton
  const secondaryButton = webApp?.SecondaryButton
  const settingsButton = webApp?.SettingsButton

  const setMainButton = useCallback(
    (params: {
      text: string
      onClick: () => void
      color?: string
      textColor?: string
      isActive?: boolean
    }) => {
      if (mainButton) {
        mainButton.setText(params.text)
        mainButton.onClick(params.onClick)
        if (params.color) mainButton.color = params.color
        if (params.textColor) mainButton.textColor = params.textColor
        if (params.isActive !== undefined) {
          params.isActive ? mainButton.enable() : mainButton.disable()
        }
        mainButton.show()
      }
    },
    [mainButton]
  )

  const hideMainButton = useCallback(() => {
    if (mainButton) {
      mainButton.hide()
    }
  }, [mainButton])

  const showMainButtonProgress = useCallback(() => {
    if (mainButton) {
      mainButton.showProgress()
    }
  }, [mainButton])

  const hideMainButtonProgress = useCallback(() => {
    if (mainButton) {
      mainButton.hideProgress()
    }
  }, [mainButton])

  const setSecondaryButton = useCallback(
    (params: {
      text: string
      onClick: () => void
      color?: string
      textColor?: string
      isActive?: boolean
    }) => {
      if (secondaryButton) {
        secondaryButton.setText(params.text)
        secondaryButton.onClick(params.onClick)
        if (params.color) secondaryButton.color = params.color
        if (params.textColor) secondaryButton.textColor = params.textColor
        if (params.isActive !== undefined) {
          params.isActive ? secondaryButton.enable() : secondaryButton.disable()
        }
        secondaryButton.show()
      }
    },
    [secondaryButton]
  )

  const hideSecondaryButton = useCallback(() => {
    if (secondaryButton) {
      secondaryButton.hide()
    }
  }, [secondaryButton])

  const setSettingsButton = useCallback(
    (onClick: () => void) => {
      if (settingsButton) {
        settingsButton.onClick(onClick)
        settingsButton.show()
      }
    },
    [settingsButton]
  )

  return {
    mainButton,
    secondaryButton,
    settingsButton,
    setMainButton,
    hideMainButton,
    showMainButtonProgress,
    hideMainButtonProgress,
    setSecondaryButton,
    hideSecondaryButton,
    setSettingsButton,
  }
}

/**
 * Хук для адаптации темы Telegram
 */
export function useTelegramTheme() {
  const { themeParams, colorScheme } = useTelegram()

  // Генерируем CSS переменные на основе темы Telegram
  const cssVariables = {
    '--tg-bg-color':
      themeParams.bg_color || (colorScheme === 'dark' ? '#1a1a1a' : '#ffffff'),
    '--tg-text-color':
      themeParams.text_color ||
      (colorScheme === 'dark' ? '#ffffff' : '#000000'),
    '--tg-hint-color':
      themeParams.hint_color ||
      (colorScheme === 'dark' ? '#707579' : '#999999'),
    '--tg-link-color': themeParams.link_color || '#2481cc',
    '--tg-button-color': themeParams.button_color || '#2481cc',
    '--tg-button-text-color': themeParams.button_text_color || '#ffffff',
    '--tg-secondary-bg-color':
      themeParams.secondary_bg_color ||
      (colorScheme === 'dark' ? '#232328' : '#f1f1f1'),
    '--tg-header-bg-color':
      themeParams.header_bg_color ||
      (colorScheme === 'dark' ? '#17212b' : '#ffffff'),
    '--tg-accent-text-color': themeParams.accent_text_color || '#2481cc',
  }

  // Применяем переменные к корню документа
  useEffect(() => {
    const root = document.documentElement
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }, [themeParams, colorScheme])

  return {
    colorScheme,
    themeParams,
    cssVariables,
    isDark: colorScheme === 'dark',
  }
}

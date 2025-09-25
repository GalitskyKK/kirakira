import { useEffect, useCallback, useRef } from 'react'
import { useTelegram } from './useTelegram'

export interface DeepLinkData {
  type: 'friend_invite' | 'challenge' | 'garden_share' | 'unknown'
  payload?: string
  originalParam?: string
}

/**
 * Хук для обработки глубоких ссылок из Telegram
 * Обрабатывает start параметры и определяет действия
 */
export function useDeepLink() {
  const { webApp, isReady } = useTelegram()
  const processedParam = useRef<string | null>(null)

  const parseStartParam = useCallback((startParam: string): DeepLinkData => {
    console.log('🔗 Parsing start param:', startParam)

    // Формат: friend_CODE123, challenge_ID456, garden_USER123, etc.
    const parts = startParam.split('_')

    if (parts.length < 2) {
      return {
        type: 'unknown',
        originalParam: startParam,
      }
    }

    const [type, ...payloadParts] = parts
    const payload = payloadParts.join('_') // Объединяем обратно если было несколько _

    if (!type || !payload) {
      return {
        type: 'unknown',
        originalParam: startParam,
      }
    }

    switch (type.toLowerCase()) {
      case 'friend':
        return {
          type: 'friend_invite',
          payload: payload.toUpperCase(), // Реферальные коды всегда в верхнем регистре
          originalParam: startParam,
        }

      case 'challenge':
        return {
          type: 'challenge',
          payload,
          originalParam: startParam,
        }

      case 'garden':
        return {
          type: 'garden_share',
          payload,
          originalParam: startParam,
        }

      default:
        return {
          type: 'unknown',
          payload,
          originalParam: startParam,
        }
    }
  }, [])

  const getStartParam = useCallback((): string | null => {
    if (!webApp?.initDataUnsafe) {
      console.log('🔗 No initDataUnsafe available')
      return null
    }

    // Получаем start_param из initDataUnsafe
    const startParam = webApp.initDataUnsafe.start_param

    if (!startParam) {
      console.log('🔗 No start_param in initDataUnsafe')
      return null
    }

    // Проверяем, что мы еще не обработали этот параметр
    if (processedParam.current === startParam) {
      console.log('🔗 Start param already processed:', startParam)
      return null
    }

    console.log('🔗 Found new start param:', startParam)
    return startParam
  }, [webApp])

  const processDeepLink = useCallback((): DeepLinkData | null => {
    const startParam = getStartParam()

    if (!startParam) {
      return null
    }

    // Помечаем как обработанный
    processedParam.current = startParam

    const deepLinkData = parseStartParam(startParam)
    console.log('🔗 Processed deep link:', deepLinkData)

    return deepLinkData
  }, [getStartParam, parseStartParam])

  const handleFriendInvite = useCallback((referralCode: string): boolean => {
    console.log('🤝 Handling friend invite with code:', referralCode)

    // Сохраняем код в localStorage для обработки компонентом FriendsList
    try {
      localStorage.setItem('pending_friend_invite', referralCode)
      console.log('✅ Friend invite code saved to localStorage')
      return true
    } catch (error) {
      console.error('❌ Failed to save friend invite code:', error)
      return false
    }
  }, [])

  const checkPendingInvite = useCallback((): string | null => {
    try {
      const pendingCode = localStorage.getItem('pending_friend_invite')
      if (pendingCode) {
        console.log('📥 Found pending friend invite:', pendingCode)
        return pendingCode
      }
    } catch (error) {
      console.error('❌ Failed to check pending invite:', error)
    }
    return null
  }, [])

  const clearPendingInvite = useCallback((): void => {
    try {
      localStorage.removeItem('pending_friend_invite')
      console.log('🧹 Cleared pending friend invite')
    } catch (error) {
      console.error('❌ Failed to clear pending invite:', error)
    }
  }, [])

  // Автоматическая обработка при готовности Telegram WebApp
  useEffect(() => {
    if (!isReady) {
      return
    }

    const deepLinkData = processDeepLink()

    if (!deepLinkData) {
      return
    }

    console.log('🔗 Processing deep link on app ready:', deepLinkData)

    switch (deepLinkData.type) {
      case 'friend_invite':
        if (deepLinkData.payload) {
          handleFriendInvite(deepLinkData.payload)
        }
        break

      case 'challenge':
        console.log('🏆 Challenge deep link detected:', deepLinkData.payload)
        // TODO: Реализовать обработку челленджей
        break

      case 'garden_share':
        console.log('🌸 Garden share deep link detected:', deepLinkData.payload)
        // TODO: Реализовать обработку поделиться садом
        break

      default:
        console.log('❓ Unknown deep link type:', deepLinkData)
        break
    }
  }, [isReady, processDeepLink, handleFriendInvite])

  return {
    processDeepLink,
    parseStartParam,
    handleFriendInvite,
    checkPendingInvite,
    clearPendingInvite,
  }
}

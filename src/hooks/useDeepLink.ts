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
      return null
    }

    // Получаем start_param из initDataUnsafe
    const startParam = webApp.initDataUnsafe.start_param

    if (!startParam) {
      return null
    }

    // Проверяем, что мы еще не обработали этот параметр
    if (processedParam.current === startParam) {
      return null
    }

    return startParam
  }, [webApp])

  const processDeepLink = useCallback((): DeepLinkData | null => {
    const startParam = getStartParam()

    if (!startParam) {
      return null
    }

    // Помечаем как обработанный
    processedParam.current = startParam

    return parseStartParam(startParam)
  }, [getStartParam, parseStartParam])

  const handleFriendInvite = useCallback((referralCode: string): boolean => {
    // Сохраняем код в localStorage для обработки компонентом FriendsList
    try {
      localStorage.setItem('pending_friend_invite', referralCode)
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

    switch (deepLinkData.type) {
      case 'friend_invite':
        if (deepLinkData.payload) {
          handleFriendInvite(deepLinkData.payload)
        }
        break

      case 'challenge':
        // TODO: Реализовать обработку челленджей
        break

      case 'garden_share':
        // TODO: Реализовать обработку поделиться садом
        break

      default:
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

import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Toast } from './Toast'

export function UpdatePrompt() {
  const [showToast, setShowToast] = useState(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Проверяем обновления каждые 30 минут
      if (registration) {
        setInterval(
          () => {
            void registration.update()
          },
          30 * 60 * 1000
        ) // 30 минут

        // Также проверяем при фокусе окна
        const handleFocus = () => {
          void registration.update()
        }

        window.addEventListener('focus', handleFocus)

        // Очистка слушателя при размонтировании
        return () => {
          window.removeEventListener('focus', handleFocus)
        }
      }

      return undefined
    },
    onRegisterError(error) {
      console.error('Ошибка регистрации Service Worker:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      setShowToast(true)

      // Автоматически показываем уведомление через 2 секунды
      const timer = setTimeout(() => {
        if (!showToast) {
          setShowToast(true)
        }
      }, 2000)

      return () => clearTimeout(timer)
    }

    return undefined
  }, [needRefresh, showToast])

  useEffect(() => {
    if (offlineReady) {
      // Можно показать toast или другой индикатор при желании
    }
  }, [offlineReady])

  // Дополнительная проверка обновлений при загрузке страницы
  useEffect(() => {
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            void registration.update()
          }
        })
      }
    }

    // Проверяем сразу при загрузке
    checkForUpdates()

    // Также проверяем через 5 секунд после загрузки
    const timer = setTimeout(checkForUpdates, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleUpdate = () => {
    setShowToast(false)
    void updateServiceWorker(true)
  }

  const handleClose = () => {
    setShowToast(false)
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  // Toast для обновления
  if (needRefresh) {
    return (
      <Toast
        message="Доступна новая версия приложения!"
        type="update"
        action={{
          label: 'Обновить',
          onClick: handleUpdate,
        }}
        onClose={handleClose}
        isVisible={showToast}
      />
    )
  }

  // Toast для offline ready (необязательно, можно убрать)
  if (offlineReady) {
    return (
      <Toast
        message="Приложение готово к работе оффлайн"
        type="success"
        duration={3000}
        onClose={handleClose}
        isVisible={showToast}
      />
    )
  }

  return null
}

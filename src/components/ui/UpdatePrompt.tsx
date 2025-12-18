import { useState, useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Toast } from './Toast'

export function UpdatePrompt() {
  const [showToast, setShowToast] = useState(false)
  const intervalRef = useRef<number | undefined>(undefined)
  const focusHandlerRef = useRef<(() => void) | undefined>(undefined)

  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Проверяем обновления каждые 30 минут
      if (registration) {
        intervalRef.current = window.setInterval(
          () => {
            void registration.update()
          },
          30 * 60 * 1000
        ) // 30 минут

        // Также проверяем при фокусе окна
        focusHandlerRef.current = () => {
          void registration.update()
        }

        window.addEventListener('focus', focusHandlerRef.current)

        // Очистка слушателя и интервала при размонтировании
        return () => {
          if (intervalRef.current !== undefined) {
            clearInterval(intervalRef.current)
          }
          if (focusHandlerRef.current) {
            window.removeEventListener('focus', focusHandlerRef.current)
          }
        }
      }

      return undefined
    },
    onRegisterError(error) {
      console.error('Ошибка регистрации Service Worker:', error)
    },
  })

  // Показываем тост сразу при появлении needRefresh
  useEffect(() => {
    if (needRefresh) {
      setShowToast(true)
    } else {
      setShowToast(false)
    }
  }, [needRefresh])

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
    // Не сбрасываем needRefresh через сеттер, чтобы не конфликтовать с useRegisterSW
    // Пользователь может закрыть тост, но обновление все равно будет доступно
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

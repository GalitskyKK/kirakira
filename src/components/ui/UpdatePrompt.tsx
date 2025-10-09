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
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker зарегистрирован:', swUrl)

      // Проверяем обновления каждый час
      if (registration) {
        setInterval(
          () => {
            console.log('Проверяем обновления Service Worker...')
            void registration.update()
          },
          60 * 60 * 1000
        ) // 1 час
      }
    },
    onRegisterError(error) {
      console.error('Ошибка регистрации Service Worker:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      console.log('Доступно обновление приложения!')
      setShowToast(true)
    }
  }, [needRefresh])

  useEffect(() => {
    if (offlineReady) {
      console.log('Приложение готово к работе оффлайн')
    }
  }, [offlineReady])

  const handleUpdate = () => {
    console.log('Обновляем приложение...')
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

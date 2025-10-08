import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Share2, Camera, Heart, Copy, MessageCircle } from 'lucide-react'
import { useTelegram } from '@/hooks'
import { Button, Card } from '@/components/ui'
import type { Garden, MoodEntry } from '@/types'
import { authenticatedFetch } from '@/utils/apiClient'

interface TelegramShareProps {
  garden: Garden | null
  recentMoods: readonly MoodEntry[]
  onCapture?: () => Promise<string> // Функция для создания скриншота сада
}

export function TelegramShare({
  garden,
  recentMoods,
  onCapture,
}: TelegramShareProps) {
  const { webApp, shareGarden, hapticFeedback, isTelegramEnv, showAlert } =
    useTelegram()
  const [isCapturing, setIsCapturing] = useState(false)
  const [lastSharedImage, setLastSharedImage] = useState<string | null>(null)

  // Генерация описания сада на основе настроений
  const generateGardenDescription = useCallback(() => {
    if (!garden || recentMoods.length === 0) {
      return 'Мой эмоциональный сад в KiraKira 🌸'
    }

    const totalElements = garden.elements.length
    const recentMoodTypes = recentMoods.slice(0, 7).map(mood => mood.mood)
    const dominantMood = recentMoodTypes.reduce(
      (acc, mood) => {
        acc[mood] = (acc[mood] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const topMood = Object.entries(dominantMood).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0]

    const moodEmojis = {
      joy: '😊',
      calm: '😌',
      stress: '😰',
      sadness: '😢',
      anger: '😠',
      anxiety: '😰',
    }

    const moodNames = {
      joy: 'радостное',
      calm: 'спокойное',
      stress: 'напряженное',
      sadness: 'грустное',
      anger: 'сердитое',
      anxiety: 'тревожное',
    }

    const emoji = moodEmojis[topMood as keyof typeof moodEmojis] || '🌸'
    const moodName =
      moodNames[topMood as keyof typeof moodNames] || 'разнообразное'

    return `${emoji} За последнюю неделю мой сад отражает ${moodName} настроение.\n\nВырастил ${totalElements} элементов, каждый из которых — отражение моих эмоций. Присоединяйся к путешествию осознанности!`
  }, [garden, recentMoods])

  // Шаринг сада с текстом
  const handleShareText = useCallback(async () => {
    if (!webApp) return

    hapticFeedback('light')
    const description = generateGardenDescription()

    try {
      webApp.shareMessage({
        text: `🌸 Посмотрите на мой эмоциональный сад в KiraKira!\n\n${description}\n\n🔗 Начните свое путешествие: https://t.me/KiraKiraGardenBot?startapp`,
        parse_mode: 'Markdown',
      })

      // 🏆 НАЧИСЛЯЕМ ОПЫТ ЗА ШЕРИНГ САДА (text version)
      // Получаем текущего пользователя
      const { useUserStore } = await import('@/stores/userStore')
      const currentUser = useUserStore.getState().currentUser

      if (currentUser?.telegramId) {
        try {
          const response = await authenticatedFetch(
            '/api/profile?action=add_experience',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                telegramId: currentUser.telegramId,
                experiencePoints: 25, // EXPERIENCE_REWARDS.SHARE_GARDEN
                reason: 'share_garden: text description shared',
              }),
            }
          )

          if (response.ok) {
            console.log('🏆 Added XP for sharing garden text')
            showAlert('🏆 +25 XP за шеринг сада!')
          }
        } catch (error) {
          console.warn('⚠️ Failed to add XP for garden text share:', error)
        }
      }
    } catch {
      showAlert('Ошибка при отправке сообщения')
    }
  }, [webApp, hapticFeedback, generateGardenDescription, showAlert])

  // Шаринг скриншота сада
  const handleShareImage = useCallback(async () => {
    if (!onCapture) {
      showAlert('Функция скриншота недоступна')
      return
    }

    setIsCapturing(true)
    hapticFeedback('medium')

    try {
      const imageUrl = await onCapture()
      setLastSharedImage(imageUrl)

      const description = generateGardenDescription()
      shareGarden(imageUrl, description)

      hapticFeedback('success')
    } catch {
      hapticFeedback('error')
      showAlert('Ошибка при создании скриншота')
    } finally {
      setIsCapturing(false)
    }
  }, [
    onCapture,
    hapticFeedback,
    generateGardenDescription,
    shareGarden,
    showAlert,
  ])

  // Копирование ссылки на бота
  const handleCopyLink = useCallback(async () => {
    const botLink = 'https://t.me/KiraKiraGardenBot?startapp'

    try {
      await navigator.clipboard.writeText(botLink)
      hapticFeedback('success')
      showAlert('Ссылка скопирована!')
    } catch (error) {
      // Fallback для старых браузеров
      if (webApp) {
        webApp.showPopup(
          {
            title: 'Ссылка на бота',
            message: botLink,
            buttons: [
              { id: 'copy', type: 'default', text: 'Скопировать' },
              { id: 'close', type: 'close', text: 'Закрыть' },
            ],
          },
          buttonId => {
            if (buttonId === 'copy') {
              showAlert('Скопируйте ссылку вручную')
            }
          }
        )
      }
    }
  }, [hapticFeedback, showAlert, webApp])

  // Шаринг в Stories
  const handleShareToStory = useCallback(() => {
    if (!webApp || !lastSharedImage) {
      showAlert('Сначала создайте скриншот сада')
      return
    }

    try {
      hapticFeedback('light')
      // Проверяем наличие метода shareToStory
      if (
        'shareToStory' in webApp &&
        typeof webApp.shareToStory === 'function'
      ) {
        ;(webApp as any).shareToStory(lastSharedImage)
      } else {
        showAlert('Stories не поддерживаются в данной версии Telegram')
      }
    } catch {
      showAlert('Ошибка при публикации в Stories')
    }
  }, [webApp, lastSharedImage, hapticFeedback, showAlert])

  // Invite друзей через inline query
  const handleInviteFriends = useCallback(() => {
    if (!webApp) return

    hapticFeedback('light')
    const inviteText = `🌸 Попробуй KiraKira — создай свой эмоциональный сад!`

    webApp.switchInlineQuery(inviteText, ['users', 'groups'])
  }, [webApp, hapticFeedback])

  if (!isTelegramEnv) {
    return (
      <Card className="p-6 text-center">
        <Share2 className="mx-auto mb-4 h-12 w-12 text-blue-500" />
        <h3 className="mb-2 text-lg font-semibold">Поделиться садом</h3>
        <p className="text-gray-600">
          Функции шаринга доступны только в Telegram Mini App
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <Share2 className="mx-auto h-16 w-16 text-blue-500" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-bold">Поделиться садом</h2>
        <p className="text-gray-600">
          Покажите свой эмоциональный сад друзьям и семье
        </p>
      </div>

      <div className="grid gap-4">
        {/* Шаринг текстом */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Поделиться описанием</h3>
              <p className="text-sm text-gray-600">
                Отправьте текстовое описание вашего сада
              </p>
            </div>
            <Button
              onClick={handleShareText}
              size="sm"
              variant="outline"
              className="flex-shrink-0"
            >
              Отправить
            </Button>
          </div>
        </Card>

        {/* Шаринг скриншотом */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <Camera className="h-6 w-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Скриншот сада</h3>
              <p className="text-sm text-gray-600">
                Сделайте красивый снимок вашего сада
              </p>
            </div>
            <Button
              onClick={handleShareImage}
              size="sm"
              disabled={isCapturing || !onCapture}
              className="flex-shrink-0"
            >
              {isCapturing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Camera className="h-4 w-4" />
                </motion.div>
              ) : (
                'Снимок'
              )}
            </Button>
          </div>
        </Card>

        {/* Stories */}
        {lastSharedImage && (
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">Stories</h3>
                <p className="text-sm text-gray-600">
                  Поделитесь в Telegram Stories
                </p>
              </div>
              <Button
                onClick={handleShareToStory}
                size="sm"
                variant="outline"
                className="flex-shrink-0 bg-purple-50 hover:bg-purple-100"
              >
                В Stories
              </Button>
            </div>
          </Card>
        )}

        {/* Пригласить друзей */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
              <Share2 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Пригласить друзей</h3>
              <p className="text-sm text-gray-600">
                Поделитесь KiraKira с друзьями
              </p>
            </div>
            <Button
              onClick={handleInviteFriends}
              size="sm"
              variant="outline"
              className="flex-shrink-0"
            >
              Пригласить
            </Button>
          </div>
        </Card>

        {/* Копировать ссылку */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
              <Copy className="h-6 w-6 text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Ссылка на бота</h3>
              <p className="text-sm text-gray-600">
                Скопируйте ссылку для отправки
              </p>
            </div>
            <Button
              onClick={handleCopyLink}
              size="sm"
              variant="outline"
              className="flex-shrink-0"
            >
              Копировать
            </Button>
          </div>
        </Card>
      </div>

      {/* Предпросмотр описания */}
      <Card className="border-dashed p-4">
        <h4 className="mb-2 font-medium text-gray-700">
          Предпросмотр сообщения:
        </h4>
        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
          <p className="whitespace-pre-line">{generateGardenDescription()}</p>
        </div>
      </Card>
    </div>
  )
}

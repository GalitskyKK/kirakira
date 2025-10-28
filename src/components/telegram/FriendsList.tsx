import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  MessageCircle,
  Trophy,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  TreePine,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react'
import { useTelegram, useDeepLink, useUserPhotos } from '@/hooks'
import { Button, Card, UserAvatar } from '@/components/ui'
import { FriendGardenView } from '@/components/garden'
import type { User } from '@/types'
import type {
  FriendApiSearchUser,
  FriendApiSearchUsersResponse,
} from '@/types/api'
import { authenticatedFetch } from '@/utils/apiClient'

// API response types
interface FriendsListResponse {
  success: boolean
  data?: {
    friends?: Friend[]
    incomingRequests?: FriendRequest[]
    outgoingRequests?: FriendRequest[]
    referralCode?: string
  }
  error?: string
}

interface SearchResponse {
  success: boolean
  data?: SearchResult
  error?: string
}

interface FriendActionResponse {
  success: boolean
  data?: {
    message: string
  }
  error?: string
}

interface Friend {
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  gardenElements: number
  currentStreak: number
  friendshipDate?: Date
  isOnline: boolean
  // Для совместимости со старым кодом
  id?: string
  lastSeen?: Date
  joinedChallenges?: string[]
}

interface FriendRequest {
  requestId: string
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  gardenElements: number
  currentStreak: number
  requestDate: Date
}

interface SearchResult {
  user: {
    telegramId: number
    firstName: string
    lastName?: string
    username?: string
    photoUrl?: string
    gardenElements: number
    currentStreak: number
  }
  relationshipStatus: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked'
  canSendRequest: boolean
}

interface FriendsListProps {
  currentUser: User | null
}

export function FriendsList({ currentUser }: FriendsListProps) {
  const navigate = useNavigate()
  const { webApp, hapticFeedback, showAlert, isTelegramEnv } = useTelegram()
  const { checkPendingInvite, clearPendingInvite } = useDeepLink()
  const { updateFriendsPhotosWithAlert } = useUserPhotos()
  const [friends, setFriends] = useState<Friend[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])
  const [referralCode, setReferralCode] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [referralSearchQuery, setReferralSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Глобальный поиск пользователей
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [globalSearchResults, setGlobalSearchResults] = useState<
    FriendApiSearchUser[]
  >([])
  const [searchPage, setSearchPage] = useState(1)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [activeView, setActiveView] = useState<
    'friends' | 'find' | 'invites' | 'requests'
  >('friends')
  const [hasAutoUpdatedPhotos, setHasAutoUpdatedPhotos] = useState(false)

  // Состояние для просмотра сада друга
  const [viewingFriendGarden, setViewingFriendGarden] = useState<number | null>(
    null
  )

  // Загружаем данные о друзьях
  const loadFriendsData = useCallback(async () => {
    if (!currentUser?.telegramId || currentUser.telegramId === 0) return

    try {
      const response = await authenticatedFetch(
        `/api/friends?action=list&telegramId=${currentUser.telegramId}&type=all`
      )
      const result = (await response.json()) as FriendsListResponse

      if (result.success && result.data) {
        const friends = result.data.friends ?? []
        setFriends(friends)
        setIncomingRequests(result.data.incomingRequests ?? [])
        setOutgoingRequests(result.data.outgoingRequests ?? [])
        setReferralCode(result.data.referralCode ?? '')

        // 📸 Автоматически обновляем аватарки друзей без фото (в фоне, один раз за сессию)
        const friendsWithoutPhotos = friends.filter(friend => !friend.photoUrl)
        if (friendsWithoutPhotos.length > 0 && !hasAutoUpdatedPhotos) {
          console.log(
            `🔄 Auto-updating photos for ${friendsWithoutPhotos.length} friends without avatars...`
          )
          setHasAutoUpdatedPhotos(true) // Помечаем что уже обновляли

          // Запускаем в фоне, не ждем результата
          void updateFriendsPhotosWithAlert().then(() => {
            // Перезагружаем список друзей после обновления аватарок
            void loadFriendsData()
          })
        }
      } else {
        showAlert(result.error ?? 'Ошибка загрузки данных о друзьях')
      }
    } catch (error) {
      console.error('Failed to load friends data:', error)
      showAlert('Ошибка подключения к серверу')
    }
  }, [
    currentUser?.telegramId,
    showAlert,
    hasAutoUpdatedPhotos,
    updateFriendsPhotosWithAlert,
  ])

  // Загружаем данные при монтировании
  useEffect(() => {
    void loadFriendsData()
  }, [loadFriendsData])

  // Фильтруем друзей по поиску
  const filteredFriends = friends.filter(
    friend =>
      friend.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false)
  )

  // Поиск пользователя по реферальному коду
  const handleSearchByReferralCode = useCallback(
    async (customQuery?: string) => {
      const searchQuery = customQuery ?? referralSearchQuery.trim()
      if (!searchQuery || !currentUser?.telegramId) {
        showAlert('Введите реферальный код!')
        return
      }

      try {
        setIsSearching(true)
        const response = await authenticatedFetch(
          `/api/friends?action=search&referralCode=${searchQuery}&searcherTelegramId=${currentUser.telegramId}`
        )
        const result = (await response.json()) as SearchResponse

        if (result.success && result.data) {
          setSearchResult(result.data)
          hapticFeedback('success')
        } else {
          showAlert(result.error ?? 'Пользователь не найден')
          setSearchResult(null)
        }
      } catch (error) {
        console.error('Search error:', error)
        showAlert('Ошибка поиска')
        setSearchResult(null)
      } finally {
        setIsSearching(false)
      }
    },
    [referralSearchQuery, currentUser?.telegramId, showAlert, hapticFeedback]
  )

  // Глобальный поиск пользователей
  const handleGlobalUserSearch = useCallback(
    async (query: string, page = 1) => {
      if (!query.trim() || query.length < 2) {
        showAlert('Введите минимум 2 символа для поиска')
        return
      }

      if (!currentUser?.telegramId) {
        showAlert('Необходима авторизация')
        return
      }

      try {
        setIsSearching(true)
        const response = await authenticatedFetch(
          `/api/friends?action=search&query=${encodeURIComponent(query)}&searcherTelegramId=${currentUser.telegramId}&page=${page}&limit=10`
        )
        const result = (await response.json()) as {
          success: boolean
          data?: FriendApiSearchUsersResponse
          error?: string
        }

        if (result.success && result.data) {
          if (page === 1) {
            setGlobalSearchResults(result.data.users as FriendApiSearchUser[])
          } else {
            setGlobalSearchResults(prev => [
              ...prev,
              ...((result.data?.users as FriendApiSearchUser[]) || []),
            ])
          }
          setHasMoreResults(result.data.hasMore)
          setSearchPage(page)
          hapticFeedback('light')
        } else {
          if (page === 1) {
            setGlobalSearchResults([])
          }
          showAlert(result.error ?? 'Пользователи не найдены')
        }
      } catch (error) {
        console.error('Global search error:', error)
        showAlert('Ошибка поиска пользователей')
        if (page === 1) {
          setGlobalSearchResults([])
        }
      } finally {
        setIsSearching(false)
        setIsLoadingMore(false)
      }
    },
    [currentUser?.telegramId, showAlert, hapticFeedback]
  )

  // Загрузить еще результатов
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreResults) {
      setIsLoadingMore(true)
      void handleGlobalUserSearch(globalSearchQuery, searchPage + 1)
    }
  }, [
    isLoadingMore,
    hasMoreResults,
    globalSearchQuery,
    searchPage,
    handleGlobalUserSearch,
  ])

  // Отправить запрос дружбы
  const handleSendFriendRequest = useCallback(
    async (targetTelegramId: number) => {
      if (!currentUser?.telegramId || currentUser.telegramId === 0) return

      try {
        hapticFeedback('medium')
        const response = await authenticatedFetch(
          '/api/friends?action=send-request',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requesterTelegramId: currentUser.telegramId,
              addresseeTelegramId: targetTelegramId,
            }),
          }
        )

        const result = (await response.json()) as FriendActionResponse

        if (result.success && result.data) {
          showAlert(result.data.message)
          setSearchResult(null)
          setReferralSearchQuery('')
          // Обновляем данные
          await loadFriendsData()
        } else {
          showAlert(result.error ?? 'Ошибка отправки запроса')
        }
      } catch (error) {
        console.error('Send request error:', error)
        showAlert('Ошибка подключения')
      }
    },
    [currentUser?.telegramId, hapticFeedback, showAlert, loadFriendsData]
  )

  // Ответить на запрос дружбы
  const handleRespondToRequest = useCallback(
    async (requesterTelegramId: number, action: 'accept' | 'decline') => {
      if (!currentUser?.telegramId || currentUser.telegramId === 0) return

      try {
        hapticFeedback('medium')
        const response = await authenticatedFetch(
          '/api/friends?action=respond-request',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: currentUser.telegramId,
              requesterTelegramId,
              action,
            }),
          }
        )

        const result = (await response.json()) as FriendActionResponse

        if (result.success && result.data) {
          showAlert(result.data.message)
          // Обновляем данные
          await loadFriendsData()
        } else {
          showAlert(result.error ?? 'Ошибка обработки запроса')
        }
      } catch (error) {
        console.error('Respond to request error:', error)
        showAlert('Ошибка подключения')
      }
    },
    [currentUser?.telegramId, hapticFeedback, showAlert, loadFriendsData]
  )

  // Пригласить друзей через Telegram
  const handleInviteSpecificFriend = useCallback(() => {
    if (!webApp) return

    hapticFeedback('light')

    const inviteText = `🌸 Попробуй KiraKira!\n\nЯ уже ${currentUser?.stats?.totalDays ?? 0} дней отслеживаю свое настроение и это помогает! 💚\n\n✨ Создай свой эмоциональный сад\n🤝 Участвуй в челленджах со мной\n📊 Анализируй свои эмоции`

    webApp.switchInlineQuery(inviteText, ['users'])
  }, [webApp, hapticFeedback, currentUser])

  // Отправить сообщение другу
  const handleMessageFriend = useCallback(
    (friend: Friend) => {
      if (!webApp) return

      hapticFeedback('light')

      // Используем deep link для отправки сообщения конкретному пользователю
      webApp.switchInlineQuery(`personal_${friend.telegramId}`, ['users'])
    },
    [webApp, hapticFeedback]
  )

  // Вызвать друга на челлендж
  const handleChallengeFriend = useCallback(
    (friend: Friend) => {
      if (!webApp) return

      hapticFeedback('medium')

      webApp.switchInlineQuery(`challenge_friend_${friend.telegramId}`, [
        'users',
      ])
    },
    [webApp, hapticFeedback]
  )

  // Посмотреть сад друга
  const handleViewFriendGarden = useCallback(
    (friend: Friend) => {
      hapticFeedback('light')
      setViewingFriendGarden(friend.telegramId)
    },
    [hapticFeedback]
  )

  // Посмотреть профиль друга
  const handleViewFriendProfile = useCallback(
    (friend: Friend) => {
      hapticFeedback('light')
      navigate(`/friend/${friend.telegramId}`)
    },
    [hapticFeedback, navigate]
  )

  // Вернуться из просмотра сада
  const handleBackFromGarden = useCallback(() => {
    hapticFeedback('light')
    setViewingFriendGarden(null)
  }, [hapticFeedback])

  // Поделиться QR кодом
  const handleShareQR = useCallback(() => {
    if (!webApp || !referralCode) return

    hapticFeedback('light')

    const qrText = `🌸 Мой реферальный код в KiraKira: ${referralCode}\n\nИспользуй этот код для добавления в друзья!\n\nhttps://t.me/KiraKiraBot?start=friend_${referralCode}`

    webApp.shareMessage({
      text: qrText,
      parse_mode: 'Markdown',
    })
  }, [webApp, hapticFeedback, referralCode])

  // Обрабатываем pending friend invites из deep links
  useEffect(() => {
    const pendingInvite = checkPendingInvite()
    if (pendingInvite) {
      console.log('🔗 Processing pending friend invite:', pendingInvite)

      // Переключаемся на вкладку поиска
      setActiveView('find')

      // Автоматически заполняем поле поиска
      setReferralSearchQuery(pendingInvite)

      // Выполняем поиск
      setTimeout(() => {
        void handleSearchByReferralCode(pendingInvite)
      }, 500)

      // Очищаем pending invite после обработки
      clearPendingInvite()

      // Показываем уведомление пользователю
      showAlert?.(`🔍 Поиск друга по коду: ${pendingInvite}`)
    }
  }, [
    checkPendingInvite,
    clearPendingInvite,
    showAlert,
    handleSearchByReferralCode,
  ])

  // Если просматриваем сад друга, показываем FriendGardenView
  if (viewingFriendGarden) {
    return (
      <FriendGardenView
        friendTelegramId={viewingFriendGarden}
        currentUser={currentUser}
        onBack={handleBackFromGarden}
      />
    )
  }

  if (!isTelegramEnv) {
    return (
      <Card className="p-6 text-center">
        <Users className="mx-auto mb-4 h-12 w-12 text-blue-500" />
        <h3 className="mb-2 text-lg font-semibold">Друзья</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Функции друзей доступны только в Telegram Mini App
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          {/* <Users className="mx-auto h-16 w-16 text-blue-500" /> */}
        </motion.div>
        <h2 className="text-lg font-semibold">Друзья</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Добавляйте друзей и поддерживайте друг друга
        </p>
      </div>

      {/* Табы */}
      <div className="glass-card flex space-x-1.5 rounded-2xl p-1.5">
        {[
          {
            id: 'friends',
            label: 'Друзья',
            icon: Users,
            count: friends.length,
          },
          {
            id: 'requests',
            label: 'Запросы',
            icon: Clock,
            count: incomingRequests.length,
          },
          { id: 'find', label: 'Найти', icon: Search },
          { id: 'invites', label: 'Пригласить', icon: UserPlus },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveView(
                  tab.id as 'friends' | 'find' | 'invites' | 'requests'
                )
              }
              className={`relative flex flex-1 items-center justify-center space-x-1 rounded-xl px-1 py-2 text-xs font-medium transition-all sm:px-2 sm:text-sm ${
                activeView === tab.id
                  ? 'bg-white text-kira-600 shadow-md dark:bg-neutral-800 dark:text-kira-400'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden truncate xs:inline sm:inline">
                {tab.label}
              </span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white sm:h-5 sm:w-5">
                  {tab.count > 9 ? '9+' : tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Контент табов */}
      <AnimatePresence mode="wait">
        {activeView === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Поиск среди друзей */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск среди друзей..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Список друзей */}
            <div className="space-y-3">
              {filteredFriends.length === 0 ? (
                <Card className="p-6 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                  <h4 className="mb-2 font-medium">Пока нет друзей</h4>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Пригласите друзей присоединиться к KiraKira!
                  </p>
                  <Button
                    onClick={handleInviteSpecificFriend}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    📤 Отправить приглашение
                  </Button>
                </Card>
              ) : (
                filteredFriends.map((friend, index) => (
                  <motion.div
                    key={friend.telegramId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-3">
                      <div className="space-y-3">
                        {/* Верхняя часть: аватар и информация */}
                        <div className="flex items-center space-x-3">
                          {/* Аватар */}
                          <UserAvatar
                            photoUrl={friend.photoUrl}
                            name={`${friend.firstName} ${friend.lastName ?? ''}`.trim()}
                            username={friend.username}
                            size="md"
                            isOnline={friend.isOnline}
                          />

                          {/* Информация о друге */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                {(friend.username ?? '').length > 0
                                  ? `@${friend.username}`
                                  : `${friend.firstName} ${friend.lastName ?? ''}`}
                              </h4>
                              {!(friend.username ?? '').length &&
                                (friend.firstName ?? '').length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {friend.firstName} {friend.lastName ?? ''}
                                  </span>
                                )}
                            </div>

                            <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span>🌱</span>
                                <span>{friend.gardenElements}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>🔥</span>
                                <span>{friend.currentStreak}</span>
                              </span>
                              <span className="truncate">
                                {friend.isOnline ? 'онлайн' : 'был недавно'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Общие челленджи (если есть) */}
                        {friend.joinedChallenges &&
                          friend.joinedChallenges.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {friend.joinedChallenges
                                .slice(0, 2)
                                .map((challengeId: string) => (
                                  <span
                                    key={challengeId}
                                    className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                                  >
                                    🎯 Челлендж
                                  </span>
                                ))}
                            </div>
                          )}

                        {/* Действия внизу */}
                        <div className="flex justify-between space-x-1 border-t border-gray-100 pt-2 sm:space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewFriendProfile(friend)}
                            className="min-w-0 flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            title="Просмотр профиля"
                          >
                            <UserIcon className="h-3 w-3" />
                            <span className="ml-1 hidden truncate text-xs sm:inline">
                              Профиль
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewFriendGarden(friend)}
                            className="min-w-0 flex-1 bg-green-50 text-green-700 hover:bg-green-100"
                            title="Просмотр сада"
                          >
                            <TreePine className="h-3 w-3" />
                            <span className="ml-1 hidden truncate text-xs sm:inline">
                              Сад
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMessageFriend(friend)}
                            className="min-w-0 flex-1 hover:bg-gray-100"
                            title="Отправить сообщение"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span className="ml-1 hidden truncate text-xs sm:inline">
                              Сообщ.
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChallengeFriend(friend)}
                            className="min-w-0 flex-1 bg-orange-50 text-orange-700 hover:bg-orange-100"
                            title="Вызвать на челлендж"
                          >
                            <Trophy className="h-3 w-3" />
                            <span className="ml-1 hidden truncate text-xs sm:inline">
                              Челл.
                            </span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeView === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold">Запросы дружбы</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Управляйте входящими и исходящими запросами
              </p>
            </div>

            {/* Входящие запросы */}
            {incomingRequests.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-700">
                  Входящие запросы ({incomingRequests.length})
                </h4>
                <div className="space-y-3">
                  {incomingRequests.map((request, index) => (
                    <motion.div
                      key={request.requestId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-center space-x-4">
                          {/* Аватар */}
                          <UserAvatar
                            photoUrl={request.photoUrl}
                            name={`${request.firstName} ${request.lastName ?? ''}`.trim()}
                            username={request.username}
                            size="md"
                          />

                          {/* Информация */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="truncate font-semibold">
                                {(request.username ?? '').length > 0
                                  ? `@${request.username}`
                                  : `${request.firstName} ${request.lastName ?? ''}`}
                              </h4>
                              {!(request.username ?? '').length &&
                                (request.firstName ?? '').length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {request.firstName} {request.lastName ?? ''}
                                  </span>
                                )}
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span>🌱</span>
                                <span>{request.gardenElements}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>🔥</span>
                                <span>{request.currentStreak}</span>
                              </span>
                              <span>
                                {new Date(
                                  request.requestDate
                                ).toLocaleDateString('ru')}
                              </span>
                            </div>
                          </div>

                          {/* Действия */}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                void handleRespondToRequest(
                                  request.telegramId,
                                  'accept'
                                )
                              }}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                void handleRespondToRequest(
                                  request.telegramId,
                                  'decline'
                                )
                              }}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Исходящие запросы */}
            {outgoingRequests.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-700">
                  Исходящие запросы ({outgoingRequests.length})
                </h4>
                <div className="space-y-3">
                  {outgoingRequests.map((request, index) => (
                    <motion.div
                      key={request.requestId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-gray-50 p-4">
                        <div className="flex items-center space-x-4">
                          <UserAvatar
                            photoUrl={request.photoUrl}
                            name={`${request.firstName} ${request.lastName ?? ''}`.trim()}
                            username={request.username}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="truncate font-semibold">
                                {(request.username ?? '').length > 0
                                  ? `@${request.username}`
                                  : `${request.firstName} ${request.lastName ?? ''}`}
                              </h4>
                              {!(request.username ?? '').length &&
                                (request.firstName ?? '').length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {request.firstName} {request.lastName ?? ''}
                                  </span>
                                )}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Запрос отправлен{' '}
                              {new Date(request.requestDate).toLocaleDateString(
                                'ru'
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-orange-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Ожидание</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Пустое состояние */}
            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <Card className="p-6 text-center">
                <Clock className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <h4 className="mb-2 font-medium">Нет запросов</h4>
                <p className="text-sm text-gray-600">
                  Используйте реферальные коды, чтобы найти друзей
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {activeView === 'find' && (
          <motion.div
            key="find"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold">Найти друзей</h3>
              <p className="text-sm text-gray-600">
                Добавляйте друзей разными способами
              </p>
            </div>

            {/* Глобальный поиск пользователей */}
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium">Поиск пользователей</h4>
                    <p className="text-sm text-gray-600">
                      Найдите друзей по имени или @username
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Введите имя или @username..."
                    value={globalSearchQuery}
                    onChange={e => setGlobalSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        void handleGlobalUserSearch(globalSearchQuery, 1)
                      }
                    }}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <Button
                    onClick={() => {
                      void handleGlobalUserSearch(globalSearchQuery, 1)
                    }}
                    disabled={
                      isSearching || globalSearchQuery.trim().length < 2
                    }
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {isSearching ? 'Поиск...' : 'Найти'}
                  </Button>
                </div>

                {/* Результаты глобального поиска */}
                {globalSearchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 border-t pt-4"
                  >
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Найдено: {globalSearchResults.length}
                      {hasMoreResults && '+'}
                    </div>

                    {globalSearchResults.map((user, index) => {
                      const displayName = user.username
                        ? `@${user.username}`
                        : `${user.first_name} ${user.last_name ?? ''}`.trim()
                      const canAddFriend = user.relationshipStatus === 'none'
                      const isPending = user.relationshipStatus === 'pending'
                      const isFriend = user.relationshipStatus === 'accepted'

                      return (
                        <motion.div
                          key={user.telegram_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                        >
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              photoUrl={user.photo_url}
                              name={displayName}
                              username={user.username}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                  {displayName}
                                </h4>
                                {user.username && user.first_name && (
                                  <span className="truncate text-xs text-gray-500">
                                    {user.first_name}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <span>🌱</span>
                                  <span>{user.total_elements}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span>🔥</span>
                                  <span>{user.current_streak}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span>⭐</span>
                                  <span>Ур. {user.level}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewFriendProfile({
                                    telegramId: user.telegram_id,
                                  } as Friend)
                                }
                                className="text-xs"
                              >
                                <UserIcon className="mr-1 h-3 w-3" />
                                Профиль
                              </Button>
                              {canAddFriend && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    void handleSendFriendRequest(
                                      user.telegram_id
                                    )
                                  }}
                                  className="bg-green-500 text-xs hover:bg-green-600"
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Добавить
                                </Button>
                              )}
                              {isPending && (
                                <span className="text-xs text-orange-600">
                                  Запрос отправлен
                                </span>
                              )}
                              {isFriend && (
                                <span className="text-xs text-green-600">
                                  ✓ Уже друзья
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Кнопка загрузить еще */}
                    {hasMoreResults && (
                      <Button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="w-full"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Загрузить еще
                          </>
                        )}
                      </Button>
                    )}
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Поиск по реферальному коду */}
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium">Поиск по реферальному коду</h4>
                    <p className="text-sm text-gray-600">
                      Введите 8-значный код друга
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Например: ABC12345"
                    value={referralSearchQuery}
                    onChange={e =>
                      setReferralSearchQuery(e.target.value.toUpperCase())
                    }
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    maxLength={8}
                  />
                  <Button
                    onClick={() => {
                      void handleSearchByReferralCode()
                    }}
                    disabled={isSearching || !referralSearchQuery.trim()}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isSearching ? 'Поиск...' : 'Найти'}
                  </Button>
                </div>

                {/* Результат поиска */}
                {searchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t pt-4"
                  >
                    <div className="flex items-center space-x-4">
                      <UserAvatar
                        photoUrl={searchResult.user.photoUrl}
                        name={`${searchResult.user.firstName} ${searchResult.user.lastName ?? ''}`.trim()}
                        username={searchResult.user.username}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">
                            {(searchResult.user.username ?? '').length > 0
                              ? `@${searchResult.user.username}`
                              : `${searchResult.user.firstName ?? ''} ${searchResult.user.lastName ?? ''}`.trim() ||
                                'Пользователь'}
                          </h4>
                          {(searchResult.user.username ?? '').length > 0 &&
                            (searchResult.user.firstName ?? '').length > 0 && (
                              <span className="text-xs text-gray-500">
                                {searchResult.user.firstName}{' '}
                                {searchResult.user.lastName ?? ''}
                              </span>
                            )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <span>🌱</span>
                            <span>{searchResult.user.gardenElements}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>🔥</span>
                            <span>{searchResult.user.currentStreak}</span>
                          </span>
                        </div>
                      </div>
                      <div>
                        {searchResult.canSendRequest ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              void handleSendFriendRequest(
                                searchResult.user.telegramId
                              )
                            }}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Добавить
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {searchResult.relationshipStatus === 'accepted' &&
                              'Уже друзья'}
                            {searchResult.relationshipStatus === 'pending' &&
                              'Запрос отправлен'}
                            {searchResult.relationshipStatus === 'declined' &&
                              'Запрос отклонен'}
                            {searchResult.relationshipStatus === 'blocked' &&
                              'Заблокирован'}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* QR код */}
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                  <QrCode className="h-6 w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium">Мой QR код</h4>
                  <p className="text-sm text-gray-600">
                    {referralCode
                      ? `Поделитесь кодом ${referralCode} для быстрого добавления`
                      : 'Реферальный код создается...'}
                  </p>
                </div>
                <Button
                  onClick={
                    referralCode
                      ? handleShareQR
                      : () => {
                          void loadFriendsData()
                        }
                  }
                  variant="outline"
                  className="flex-shrink-0"
                  disabled={!referralCode}
                >
                  {referralCode ? 'Поделиться' : '🔄 Обновить'}
                </Button>
              </div>
            </Card>

            {/* Из групп */}
            <Card className="p-4">
              <div className="text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <h4 className="mb-2 font-medium">Из общих групп</h4>
                <p className="text-sm text-gray-600">
                  Скоро: автоматический поиск друзей из общих Telegram групп
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {activeView === 'invites' && (
          <motion.div
            key="invites"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold">Пригласить друзей</h3>
              <p className="text-sm text-gray-600">
                Поделитесь KiraKira с друзьями
              </p>
            </div>

            {/* Прямое приглашение */}
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium">Отправить приглашение</h4>
                  <p className="text-sm text-gray-600">
                    Откроется список контактов Telegram для отправки приглашения
                  </p>
                </div>
                <Button
                  onClick={handleInviteSpecificFriend}
                  className="flex-shrink-0 bg-green-500 hover:bg-green-600"
                >
                  📤 Отправить
                </Button>
              </div>
            </Card>

            {/* Реферальная ссылка */}
            <Card className="p-4">
              <h4 className="mb-3 font-medium">Ваш реферальный код</h4>
              {referralCode ? (
                <>
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <p className="mb-2 text-2xl font-bold text-blue-600">
                      {referralCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      https://t.me/KiraKiraBot?start=friend_{referralCode}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Поделитесь этим кодом, чтобы друзья могли легко найти вас
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <p className="mb-2 text-sm text-gray-500">
                      Создание реферального кода...
                    </p>
                    <div className="flex justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      void loadFriendsData()
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    🔄 Обновить данные
                  </Button>
                  <p className="text-center text-xs text-gray-500">
                    Если код не появился, нажмите "Обновить данные"
                  </p>
                </div>
              )}
            </Card>

            {/* Статистика приглашений */}
            <Card className="p-4">
              <h4 className="mb-3 font-medium">Статистика приглашений</h4>
              <div className="mb-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {friends.length}
                  </div>
                  <div className="text-xs text-gray-600">Друзей</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <div className="text-xs text-gray-600">Приглашено</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

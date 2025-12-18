import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Users, UserPlus, Search, Clock } from 'lucide-react'
import {
  useTelegram,
  useDeepLink,
  useUserPhotos,
  useFriendsData,
} from '@/hooks'
import { FriendGardenView } from '@/components/garden'
import { Card } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import type { User } from '@/types'
import type { FriendApiSearchUser } from '@/types/api'
import type { Friend, SearchResult } from '@/hooks'
import { FriendsTab } from './friends/FriendsTab'
import { RequestsTab } from './friends/RequestsTab'
import { FindTab } from './friends/FindTab'
import { InvitesTab } from './friends/InvitesTab'

interface FriendsListProps {
  currentUser: User | null
}

export function FriendsList({ currentUser }: FriendsListProps) {
  const t = useTranslation()
  const navigate = useNavigate()
  const { webApp, hapticFeedback, showAlert, isTelegramEnv } = useTelegram()
  const { checkPendingInvite, clearPendingInvite } = useDeepLink()
  const { updateFriendsPhotosWithAlert } = useUserPhotos()
  const {
    friendsQuery,
    searchByReferral,
    searchGlobal,
    sendFriendRequest,
    respondRequest,
  } = useFriendsData(currentUser?.telegramId)
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

  const friends = friendsQuery.data?.friends ?? []
  const incomingRequests = friendsQuery.data?.incomingRequests ?? []
  const outgoingRequests = friendsQuery.data?.outgoingRequests ?? []
  const referralCode = friendsQuery.data?.referralCode ?? ''

  useEffect(() => {
    if (friendsQuery.error) {
      showAlert(
        friendsQuery.error instanceof Error
          ? friendsQuery.error.message
          : t.friends.loadError
      )
    }
  }, [friendsQuery.error, showAlert])

  useEffect(() => {
    const friendsWithoutPhotos = friends.filter(friend => !friend.photoUrl)
    if (
      friendsWithoutPhotos.length > 0 &&
      !hasAutoUpdatedPhotos &&
      friendsQuery.isSuccess
    ) {
      setHasAutoUpdatedPhotos(true)
      void updateFriendsPhotosWithAlert().then(() => {
        void friendsQuery.refetch()
      })
    }
  }, [
    friends,
    hasAutoUpdatedPhotos,
    updateFriendsPhotosWithAlert,
    friendsQuery.isSuccess,
    friendsQuery.refetch,
  ])

  // Фильтруем друзей по поиску
  const filteredFriends = useMemo(
    () =>
      friends.filter(friend => {
        const query = searchQuery.toLowerCase()
        return (
          friend.firstName.toLowerCase().includes(query) ||
          (friend.lastName?.toLowerCase().includes(query) ?? false) ||
          (friend.username?.toLowerCase().includes(query) ?? false)
        )
      }),
    [friends, searchQuery]
  )

  // Поиск пользователя по реферальному коду
  const handleSearchByReferralCode = useCallback(
    async (customQuery?: string) => {
      const searchQuery = customQuery ?? referralSearchQuery.trim()
      if (!searchQuery || !currentUser?.telegramId) {
        showAlert(t.friends.enterReferralCode)
        return
      }

      try {
        setIsSearching(true)
        const result = await searchByReferral.mutateAsync(searchQuery)
        setSearchResult(result)
        hapticFeedback('success')
      } catch (error) {
        console.error('Search error:', error)
        showAlert(
          error instanceof Error ? error.message : t.friends.userNotFound
        )
        setSearchResult(null)
      } finally {
        setIsSearching(false)
      }
    },
    [
      referralSearchQuery,
      currentUser?.telegramId,
      showAlert,
      hapticFeedback,
      searchByReferral,
      t,
    ]
  )

  // Глобальный поиск пользователей
  const handleGlobalUserSearch = useCallback(
    async (query: string, page = 1) => {
      if (!query.trim() || query.length < 2) {
        showAlert(t.friends.minSearchLength)
        return
      }

      if (!currentUser?.telegramId) {
        showAlert(t.friends.authRequired)
        return
      }

      try {
        setIsSearching(true)
        const result = await searchGlobal.mutateAsync({ query, page })
        if (page === 1) {
          setGlobalSearchResults(result.users as FriendApiSearchUser[])
        } else {
          setGlobalSearchResults(prev => [
            ...prev,
            ...((result.users as FriendApiSearchUser[]) || []),
          ])
        }
        setHasMoreResults(result.hasMore)
        setSearchPage(page)
        hapticFeedback('light')
      } catch (error) {
        console.error('Global search error:', error)
        showAlert(
          error instanceof Error ? error.message : t.friends.searchError
        )
        if (page === 1) {
          setGlobalSearchResults([])
        }
      } finally {
        setIsSearching(false)
        setIsLoadingMore(false)
      }
    },
    [currentUser?.telegramId, showAlert, hapticFeedback, searchGlobal, t]
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
        const message = await sendFriendRequest.mutateAsync(targetTelegramId)
        showAlert(message)
        setSearchResult(null)
        setReferralSearchQuery('')
      } catch (error) {
        console.error('Send request error:', error)
        showAlert(
          error instanceof Error ? error.message : t.friends.connectionError
        )
      }
    },
    [currentUser?.telegramId, hapticFeedback, showAlert, sendFriendRequest, t]
  )

  // Ответить на запрос дружбы
  const handleRespondToRequest = useCallback(
    async (requesterTelegramId: number, action: 'accept' | 'decline') => {
      if (!currentUser?.telegramId || currentUser.telegramId === 0) return

      try {
        hapticFeedback('medium')
        const message = await respondRequest.mutateAsync({
          requesterTelegramId,
          action,
        })
        showAlert(message)
      } catch (error) {
        console.error('Respond to request error:', error)
        showAlert(
          error instanceof Error ? error.message : t.friends.connectionError
        )
      }
    },
    [currentUser?.telegramId, hapticFeedback, showAlert, respondRequest, t]
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
      showAlert?.(`${t.friends.searchByCode} ${pendingInvite}`)
    }
  }, [
    checkPendingInvite,
    clearPendingInvite,
    showAlert,
    handleSearchByReferralCode,
    t,
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
        <h3 className="mb-2 text-lg font-semibold">{t.friends.title}</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t.friends.telegramOnly}
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
        <h2 className="text-lg font-semibold">{t.friends.title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t.friends.subtitle}</p>
      </div>

      {/* Табы */}
      <div className="glass-card flex space-x-1.5 rounded-2xl p-1.5">
        {[
          {
            id: 'friends',
            label: t.friends.friendsTab,
            icon: Users,
            count: friends.length,
          },
          {
            id: 'requests',
            label: t.friends.requestsTab,
            icon: Clock,
            count: incomingRequests.length,
          },
          { id: 'find', label: t.friends.findTab, icon: Search },
          { id: 'invites', label: t.friends.invitesTab, icon: UserPlus },
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
          <FriendsTab
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filteredFriends={filteredFriends}
            isLoading={friendsQuery.isLoading}
            onInvite={handleInviteSpecificFriend}
            onViewGarden={handleViewFriendGarden}
            onViewProfile={handleViewFriendProfile}
            onMessageFriend={handleMessageFriend}
            onChallengeFriend={handleChallengeFriend}
          />
        )}

        {activeView === 'requests' && (
          <RequestsTab
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            onRespond={handleRespondToRequest}
          />
        )}

        {activeView === 'find' && (
          <FindTab
            referralSearchQuery={referralSearchQuery}
            onReferralSearchChange={setReferralSearchQuery}
            onSearchByReferral={() => void handleSearchByReferralCode()}
            searchResult={searchResult}
            isSearching={isSearching}
            globalSearchQuery={globalSearchQuery}
            onGlobalSearchChange={setGlobalSearchQuery}
            onGlobalSearch={() =>
              void handleGlobalUserSearch(globalSearchQuery)
            }
            globalSearchResults={globalSearchResults}
            hasMoreResults={hasMoreResults}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            onSendFriendRequest={telegramId => {
              void handleSendFriendRequest(telegramId)
            }}
          />
        )}

        {activeView === 'invites' && (
          <InvitesTab
            referralCode={referralCode}
            friendsCount={friends.length}
            onInvite={handleInviteSpecificFriend}
            onShareQR={handleShareQR}
            onRefetchReferral={() => {
              void friendsQuery.refetch()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

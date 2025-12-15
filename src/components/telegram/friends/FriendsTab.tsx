import { motion } from 'framer-motion'
import { MessageCircle, TreePine, Trophy, User } from 'lucide-react'
import type { Friend } from '@/hooks'
import { Button, Card, UserAvatar } from '@/components/ui'

interface FriendsTabProps {
  readonly searchQuery: string
  readonly onSearchChange: (value: string) => void
  readonly filteredFriends: readonly Friend[]
  readonly onInvite: () => void
  readonly onViewGarden: (friend: Friend) => void
  readonly onViewProfile: (friend: Friend) => void
  readonly onMessageFriend: (friend: Friend) => void
  readonly onChallengeFriend: (friend: Friend) => void
}

export function FriendsTab({
  searchQuery,
  onSearchChange,
  filteredFriends,
  onInvite,
  onViewGarden,
  onViewProfile,
  onMessageFriend,
  onChallengeFriend,
}: FriendsTabProps) {
  return (
    <motion.div
      key="friends"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="relative">
        <input
          type="text"
          placeholder="Поиск среди друзей..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      <div className="space-y-3">
        {filteredFriends.length === 0 ? (
          <Card className="p-6 text-center">
            <h4 className="mb-2 font-medium">Пока нет друзей</h4>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Пригласите друзей присоединиться к KiraKira!
            </p>
            <Button
              onClick={onInvite}
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
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      photoUrl={friend.photoUrl}
                      name={`${friend.firstName} ${friend.lastName ?? ''}`.trim()}
                      username={friend.username}
                      size="md"
                      isOnline={friend.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="truncate font-semibold">
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
                            {friend.lastSeen && (
                              <span>Был(а) {friend.lastSeen}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewProfile(friend)}
                      className="min-w-0 flex-1"
                      title="Профиль"
                    >
                      <User className="h-3 w-3" />
                      <span className="ml-1 hidden truncate text-xs sm:inline">
                        Профиль
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewGarden(friend)}
                      className="min-w-0 flex-1"
                      title="Просмотр сада"
                    >
                      <TreePine className="h-3 w-3" />
                      <span className="ml-1 hidden truncate text-xs sm:inline">
                        Сад
                      </span>
                    </Button>
                    {/* <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMessageFriend(friend)}
                      className="min-w-0 flex-1 hover:bg-gray-100"
                      title="Отправить сообщение"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span className="ml-1 hidden truncate text-xs sm:inline">
                        Сообщ.
                      </span>
                    </Button> */}
                    {/* <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onChallengeFriend(friend)}
                      className="min-w-0 flex-1 bg-orange-50 text-orange-700 hover:bg-orange-100"
                      title="Вызвать на челлендж"
                    >
                      <Trophy className="h-3 w-3" />
                      <span className="ml-1 hidden truncate text-xs sm:inline">
                        Челл.
                      </span>
                    </Button> */}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

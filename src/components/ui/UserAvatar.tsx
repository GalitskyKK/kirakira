import { useState } from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'

interface UserAvatarProps {
  /** URL аватарки пользователя */
  photoUrl?: string | undefined
  /** Имя пользователя для fallback */
  name?: string | undefined
  /** Username для fallback */
  username?: string | undefined
  /** Размер аватарки */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Показывать ли статус онлайн */
  isOnline?: boolean
  /** Дополнительные CSS классы */
  className?: string
  /** Обработчик клика */
  onClick?: () => void
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-xl',
}

const onlineIndicatorSizes = {
  xs: 'h-2 w-2 -bottom-0.5 -right-0.5',
  sm: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
  md: 'h-4 w-4 -bottom-1 -right-1',
  lg: 'h-5 w-5 -bottom-1 -right-1',
  xl: 'h-6 w-6 -bottom-1.5 -right-1.5',
}

/**
 * Генерирует цвет на основе строки
 */
const generateColorFromString = (str: string | undefined): string => {
  const safeStr = str ?? 'user'
  let hash = 0
  for (let i = 0; i < safeStr.length; i++) {
    hash = safeStr.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    'from-blue-400 to-purple-500',
    'from-green-400 to-blue-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-yellow-500',
    'from-red-400 to-pink-500',
    'from-indigo-400 to-blue-500',
    'from-teal-400 to-green-500',
    'from-pink-400 to-purple-500',
  ]

  return colors[Math.abs(hash) % colors.length] ?? 'from-blue-400 to-purple-500'
}

/**
 * Получает первую букву для fallback аватарки
 */
const getInitials = (name?: string, username?: string): string => {
  if (username && username.length > 0) {
    return username.charAt(0).toUpperCase()
  }
  if (name && name.length > 0) {
    const words = name
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
    if (words.length >= 2 && words[0] && words[1]) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
    }
    if (words.length > 0 && words[0]) {
      return words[0].charAt(0).toUpperCase()
    }
  }
  return 'U'
}

export function UserAvatar({
  photoUrl,
  name,
  username,
  size = 'md',
  isOnline = false,
  className = '',
  onClick,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const initials = getInitials(name, username)
  const gradientColor = generateColorFromString(username ?? name ?? 'user')
  const sizeClass = sizeClasses[size]
  const onlineIndicatorSize = onlineIndicatorSizes[size]

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const showFallback = !photoUrl || imageError

  return (
    <motion.div
      className={`relative flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
    >
      <div className={`relative ${sizeClass} overflow-hidden rounded-full`}>
        {!showFallback && (
          <>
            {imageLoading && (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradientColor} flex items-center justify-center ${sizeClass} rounded-full`}
              >
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            )}
            <img
              src={photoUrl}
              alt={`Аватар ${name || username || 'пользователя'}`}
              className={`${sizeClass} rounded-full object-cover transition-opacity duration-200 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        )}

        {showFallback && (
          <div
            className={`bg-gradient-to-br ${gradientColor} flex items-center justify-center ${sizeClass} rounded-full font-semibold text-white`}
          >
            {initials || <User className="h-1/2 w-1/2" />}
          </div>
        )}
      </div>

      {/* Индикатор онлайн статуса */}
      {isOnline && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute ${onlineIndicatorSize} rounded-full border-2 border-white bg-green-500 dark:border-gray-800`}
        />
      )}
    </motion.div>
  )
}

/**
 * Компонент группы аватарок (для отображения нескольких пользователей)
 */
interface UserAvatarGroupProps {
  users: Array<{
    photoUrl?: string | undefined
    name?: string | undefined
    username?: string | undefined
    isOnline?: boolean | undefined
  }>
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  maxVisible?: number
  className?: string
}

export function UserAvatarGroup({
  users,
  size = 'sm',
  maxVisible = 3,
  className = '',
}: UserAvatarGroupProps) {
  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = users.length - maxVisible

  return (
    <div className={`flex ${className}`}>
      {visibleUsers.map((user, index) => (
        <div
          key={index}
          className={`${index > 0 ? '-ml-2' : ''} relative z-${10 - index}`}
        >
          <UserAvatar
            photoUrl={user.photoUrl}
            name={user.name}
            username={user.username}
            isOnline={user.isOnline ?? false}
            size={size}
            className="ring-2 ring-white dark:ring-gray-800"
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div className={`relative z-0 -ml-2`}>
          <div
            className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${sizeClasses[size]} rounded-full font-medium text-gray-600 ring-2 ring-white dark:text-gray-300 dark:ring-gray-800`}
          >
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ===========================================
 * PROFILE API - Управление профилями пользователей
 * ===========================================
 * Обрабатывает запросы для:
 * - Получения профиля пользователя
 * - Обновления настроек приватности
 * - Управления достижениями
 * - Работы с системой уровней
 */

import { createClient } from '@supabase/supabase-js'

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Validates Telegram WebApp init data
 */
function validateTelegramWebAppData(initData) {
  // Простая проверка - в продакшене нужна полная валидация
  try {
    const urlParams = new URLSearchParams(initData)
    const user = urlParams.get('user')
    if (!user) return null

    return JSON.parse(user)
  } catch (error) {
    console.error('Invalid Telegram data:', error)
    return null
  }
}

/**
 * Получает или создает пользователя в БД
 */
async function ensureUser(telegramId, userData = {}) {
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Database error: ${fetchError.message}`)
  }

  if (existingUser) {
    return existingUser
  }

  // Создаем нового пользователя
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
      photo_url: userData.photo_url || '',
      registration_date: new Date().toISOString(),
      experience: 0,
      level: 1,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`)
  }

  return newUser
}

/**
 * Вычисляет статистику пользователя
 */
async function calculateUserStats(user) {
  try {
    // Параллельные запросы для оптимизации
    const [
      { data: moodEntries, error: moodError },
      { data: gardenElements, error: gardenError },
    ] = await Promise.all([
      supabase
        .from('mood_entries')
        .select('mood_date, mood')
        .eq('telegram_id', user.telegram_id)
        .order('mood_date', { ascending: false }),

      supabase
        .from('garden_elements')
        .select('rarity, unlock_date')
        .eq('telegram_id', user.telegram_id),
    ])

    const userStats = user

    if (moodError || gardenError) {
      console.error('Stats calculation error:', {
        moodError,
        gardenError,
      })
      return null
    }

    // Вычисляем стрик
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    if (moodEntries && moodEntries.length > 0) {
      const sortedDates = moodEntries
        .map(entry => new Date(entry.mood_date).toDateString())
        .filter((date, index, arr) => arr.indexOf(date) === index) // уникальные даты
        .sort((a, b) => new Date(b) - new Date(a))

      const today = new Date().toDateString()
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toDateString()

      // Проверяем текущий стрик
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        let checkDate = new Date()
        for (const dateStr of sortedDates) {
          if (dateStr === checkDate.toDateString()) {
            currentStreak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
      }

      // Вычисляем самый длинный стрик
      tempStreak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i])
        const prevDate = new Date(sortedDates[i - 1])

        // Проверяем, что даты идут подряд (разница 1 день)
        if (Math.abs(prevDate - currentDate) === 24 * 60 * 60 * 1000) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // Подсчет редких элементов
    const rareElementsCount = gardenElements
      ? gardenElements.filter(el =>
          ['rare', 'epic', 'legendary'].includes(el.rarity)
        ).length
      : 0

    // Дни с регистрации
    const daysSinceRegistration = userStats?.registration_date
      ? Math.floor(
          (Date.now() - new Date(userStats.registration_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    return {
      totalMoodEntries: moodEntries?.length || 0,
      currentStreak,
      longestStreak,
      totalElements: gardenElements?.length || 0,
      rareElementsFound: rareElementsCount,
      totalDays: daysSinceRegistration,
      gardensShared: userStats?.gardens_shared || 0,
      experience: userStats?.experience || 0,
      level: userStats?.level || 1,
    }
  } catch (error) {
    console.error('Error calculating user stats:', error)
    return null
  }
}

/**
 * Проверяет и обновляет достижения пользователя
 */
async function checkAndUpdateAchievements(telegramId) {
  try {
    const { data, error } = await supabase.rpc(
      'check_and_unlock_achievements',
      { p_telegram_id: telegramId }
    )

    if (error) {
      console.error('Error checking achievements:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Achievement check failed:', error)
    return []
  }
}

/**
 * Обновляет опыт пользователя
 */
async function addExperience(telegramId, experiencePoints) {
  try {
    const { data, error } = await supabase.rpc('add_user_experience', {
      p_telegram_id: telegramId,
      p_experience_points: experiencePoints,
    })

    if (error) {
      console.error('Error adding experience:', error)
      return null
    }

    return data[0] || null
  } catch (error) {
    console.error('Experience update failed:', error)
    return null
  }
}

/**
 * Главная функция обработки API запросов
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action } = req.query

    switch (action) {
      case 'get_profile': {
        if (req.method !== 'GET') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId } = req.query
        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        // Получаем пользователя
        const user = await ensureUser(parseInt(telegramId))

        // Вычисляем статистику
        const stats = await calculateUserStats(user)

        // Проверяем достижения
        const achievementUpdates = await checkAndUpdateAchievements(
          user.telegram_id
        )

        // Получаем актуальные достижения пользователя
        const { data: userAchievements, error: achievementsError } =
          await supabase
            .from('user_achievements')
            .select(
              `
            achievement_id,
            is_unlocked,
            progress,
            unlocked_at,
            achievements!inner (
              name,
              description,
              emoji,
              category,
              rarity
            )
          `
            )
            .eq('telegram_id', user.telegram_id)

        if (achievementsError) {
          console.error('Error fetching achievements:', achievementsError)
        }

        return res.status(200).json({
          success: true,
          data: {
            user,
            stats,
            achievements: userAchievements || [],
            newlyUnlocked: achievementUpdates.filter(a => a.newly_unlocked),
          },
        })
      }

      case 'update_privacy': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, privacySettings } = req.body
        if (!telegramId || !privacySettings) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing required fields' })
        }

        const user = await ensureUser(parseInt(telegramId))

        const { data, error } = await supabase
          .from('users')
          .update({ privacy_settings: privacySettings })
          .eq('id', user.id)
          .select()
          .single()

        if (error) {
          console.error('Privacy update error:', error)
          return res
            .status(500)
            .json({ success: false, error: 'Database error' })
        }

        return res.status(200).json({
          success: true,
          data: { privacy_settings: data.privacy_settings },
        })
      }

      case 'add_experience': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, experiencePoints, reason } = req.body
        if (!telegramId || !experiencePoints) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing required fields' })
        }

        const user = await ensureUser(parseInt(telegramId))

        // Добавляем опыт
        const experienceResult = await addExperience(
          user.telegram_id,
          experiencePoints
        )

        // Проверяем новые достижения
        const achievementUpdates = await checkAndUpdateAchievements(
          user.telegram_id
        )

        return res.status(200).json({
          success: true,
          data: {
            experience: experienceResult,
            newAchievements: achievementUpdates.filter(a => a.newly_unlocked),
            reason: reason || 'Unknown',
          },
        })
      }

      case 'get_friend_profile': {
        if (req.method !== 'GET') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, friendTelegramId } = req.query
        if (!telegramId || !friendTelegramId) {
          return res.status(400).json({
            success: false,
            error: 'Missing telegramId or friendTelegramId',
          })
        }

        // Проверяем, что пользователи - друзья
        const { data: friendship, error: friendshipError } = await supabase
          .from('friendships')
          .select('*')
          .or(
            `and(requester_telegram_id.eq.${telegramId},addressee_telegram_id.eq.${friendTelegramId}),and(requester_telegram_id.eq.${friendTelegramId},addressee_telegram_id.eq.${telegramId})`
          )
          .eq('status', 'accepted')
          .single()

        if (friendshipError || !friendship) {
          return res.status(403).json({
            success: false,
            error: 'Not friends or friendship not found',
          })
        }

        // Получаем данные друга
        const friend = await ensureUser(parseInt(friendTelegramId))

        // Проверяем настройки приватности друга
        const privacySettings = friend.privacy_settings || {}
        if (!privacySettings.showProfile) {
          return res
            .status(403)
            .json({ success: false, error: 'Profile is private' })
        }

        // Получаем публичную статистику
        const stats = await calculateUserStats(friend)

        // Достижения (если разрешены)
        let achievements = []
        if (privacySettings.shareAchievements) {
          const { data: userAchievements, error: friendAchievementsError } =
            await supabase
              .from('user_achievements')
              .select(
                `
              achievement_id,
              is_unlocked,
              unlocked_at,
              achievements!inner (
                name,
                description,
                emoji,
                category
              )
            `
              )
              .eq('telegram_id', friend.telegram_id)
              .eq('is_unlocked', true)

          if (friendAchievementsError) {
            console.error(
              'Error fetching friend achievements:',
              friendAchievementsError
            )
          }

          achievements = userAchievements || []
        }

        return res.status(200).json({
          success: true,
          data: {
            user: {
              id: friend.id,
              telegram_id: friend.telegram_id,
              first_name: friend.first_name,
              last_name: friend.last_name,
              username: friend.username,
              photo_url: friend.photo_url,
              level: friend.level,
              registration_date: friend.registration_date,
            },
            stats: privacySettings.shareGarden ? stats : null,
            achievements: privacySettings.shareAchievements ? achievements : [],
            privacy: {
              showProfile: privacySettings.showProfile,
              shareGarden: privacySettings.shareGarden,
              shareAchievements: privacySettings.shareAchievements,
            },
          },
        })
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Profile API Error:', error)
    console.error('Stack trace:', error.stack)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

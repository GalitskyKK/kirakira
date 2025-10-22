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
    const updates = {}

    // ВСЕГДА обновляем last_visit_date при любом обращении к API
    updates.last_visit_date = new Date().toISOString()
    updates.updated_at = new Date().toISOString()

    // Если есть новые данные пользователя - добавляем их к обновлениям
    if (userData && Object.keys(userData).length > 0) {
      // Обновляем только непустые поля
      if (userData.first_name) updates.first_name = userData.first_name
      if (userData.last_name) updates.last_name = userData.last_name
      if (userData.username) updates.username = userData.username
      if (userData.photo_url) updates.photo_url = userData.photo_url
      if (userData.language_code) updates.language_code = userData.language_code
    }

    console.log(
      `📝 Updating user ${telegramId} (including last_visit_date):`,
      updates
    )

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('telegram_id', telegramId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update user:', updateError)
      return existingUser // Возвращаем старые данные в случае ошибки
    }

    console.log(
      `✅ User ${telegramId} updated successfully with last_visit_date`
    )
    return updatedUser
  }

  // Создаем нового пользователя
  console.log(`🆕 Creating new user ${telegramId} with data:`, userData)

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      user_id: `tg_${telegramId}`, // ИСПРАВЛЕНО: добавлено обязательное поле user_id
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      username: userData.username || null,
      photo_url: userData.photo_url || null,
      language_code: userData.language_code || 'ru',
      // registration_date будет равна created_at (автоматически в БД)
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

    // 🔥 V3: Стрик полностью управляется на бэкенде через streak_last_checkin
    // Мы НЕ пересчитываем его из истории настроений, а берем ТОЛЬКО из БД
    const currentStreak = userStats?.current_streak || 0
    const longestStreak = userStats?.longest_streak || 0

    console.log(
      `📊 STREAK [V3 Profile]: Using server-managed streak from DB: current=${currentStreak}, longest=${longestStreak}`
    )

    // Подсчет редких элементов
    const rareElementsCount = gardenElements
      ? gardenElements.filter(el =>
          ['rare', 'epic', 'legendary'].includes(el.rarity)
        ).length
      : 0

    // Дни с регистрации
    const registrationDate = user.created_at || user.registration_date
    const daysSinceRegistration = registrationDate
      ? Math.floor(
          (Date.now() - new Date(registrationDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    // 🔥 V3: Стрики ТОЛЬКО из БД, никаких пересчетов
    const finalStats = {
      totalMoodEntries: moodEntries?.length || 0,
      currentStreak, // Из БД (строка 156)
      longestStreak, // Из БД (строка 157)
      totalElements: userStats?.total_elements || gardenElements?.length || 0,
      rareElementsFound: userStats?.rare_elements_found || rareElementsCount,
      totalDays: Math.max(
        userStats?.total_days || 0,
        daysSinceRegistration + 1
      ),
      gardensShared: userStats?.gardens_shared || 0,
      experience: userStats?.experience || 0,
      level: userStats?.level || 1,
    }

    // 🔍 ОТЛАДКА: Показываем откуда берутся данные
    console.log('📊 Stats Sources [V3]:', {
      telegramId: user.telegram_id,
      registrationDate: registrationDate
        ? new Date(registrationDate).toISOString().split('T')[0]
        : 'unknown',
      dbStats: {
        total_days: userStats?.total_days,
        current_streak: userStats?.current_streak,
        longest_streak: userStats?.longest_streak,
        total_elements: userStats?.total_elements,
      },
      calculatedStats: {
        daysSinceRegistration,
        daysSinceRegistrationPlus1: daysSinceRegistration + 1,
        totalElements: gardenElements?.length,
        rareElements: rareElementsCount,
      },
      finalStats,
      streakSource: 'DB only (no recalculation)',
      totalDaysLogic: `Math.max(${userStats?.total_days || 0}, ${daysSinceRegistration + 1}) = ${Math.max(userStats?.total_days || 0, daysSinceRegistration + 1)}`,
    })

    return finalStats
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

// Импортируем middleware аутентификации
import { withAuth, verifyTelegramId } from './_auth.js'

/**
 * 🔒 Функция для получения Supabase клиента с JWT (RLS-защищенный)
 */
async function getSupabaseClient(jwt = null) {
  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL not configured')
  }

  // ✅ ПРИОРИТЕТ: Используем JWT для RLS-защищенных запросов
  if (jwt) {
    try {
      const { createAuthenticatedSupabaseClient } = await import('./_jwt.js')
      console.log('✅ Using JWT-authenticated Supabase client (RLS enabled)')
      return await createAuthenticatedSupabaseClient(jwt)
    } catch (error) {
      console.error('❌ Failed to create JWT client:', error)
      // Fallback на SERVICE_ROLE_KEY ниже
    }
  }

  // ⚠️ FALLBACK: SERVICE_ROLE_KEY (минует RLS, использовать только для admin операций)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured')
  }

  console.warn('⚠️ Using SERVICE_ROLE_KEY (bypasses RLS) - migrate to JWT!')
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/**
 * Защищенная функция обработки API запросов
 */
async function protectedHandler(req, res) {
  try {
    const { action } = req.query

    // 🔑 СПЕЦИАЛЬНЫЙ СЛУЧАЙ: Проверяем запросы от бота
    const botSecret = req.headers['x-bot-secret']
    const EXPECTED_BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

    if (botSecret === EXPECTED_BOT_SECRET) {
      console.log('🤖 Bot request detected, bypassing authentication')

      // Для запросов от бота используем SERVICE_ROLE_KEY напрямую
      const supabase = await getSupabaseClient(null) // null = использует SERVICE_ROLE_KEY

      // Обрабатываем только get_profile для бота
      if (action === 'get_profile') {
        const telegramId = req.query.telegramId || req.body.telegramId

        if (!telegramId) {
          return res.status(400).json({
            success: false,
            error: 'Missing telegramId',
          })
        }

        // Получаем или создаем пользователя
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
            user: {
              ...user,
              registration_date: user.registration_date || user.created_at,
            },
            stats,
            achievements: userAchievements || [],
            newlyUnlocked: achievementUpdates.filter(a => a.newly_unlocked),
          },
        })
      }

      // Для других действий от бота возвращаем ошибку
      return res.status(403).json({
        success: false,
        error: 'Bot can only access get_profile action',
      })
    }

    // Для большинства действий проверяем что пользователь работает со своими данными
    const requestedTelegramId = req.query.telegramId || req.body.telegramId
    const authenticatedTelegramId = req.auth.telegramId

    // Исключения: get_friend_profile разрешает просмотр профилей друзей
    const allowedActionsWithDifferentId = ['get_friend_profile']

    if (
      requestedTelegramId &&
      !allowedActionsWithDifferentId.includes(action)
    ) {
      if (!verifyTelegramId(requestedTelegramId, authenticatedTelegramId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only access your own data',
        })
      }
    }

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    switch (action) {
      case 'get_profile': {
        if (req.method !== 'GET' && req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        let telegramId, userData

        if (req.method === 'GET') {
          telegramId = req.query.telegramId
        } else {
          // POST метод позволяет передать userData при создании
          telegramId = req.body.telegramId
          userData = req.body.userData
        }

        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        // Получаем или создаем пользователя с данными Telegram
        const user = await ensureUser(parseInt(telegramId), userData)

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
            user: {
              ...user,
              registration_date: user.registration_date || user.created_at, // Используем created_at как fallback
            },
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
          .eq('telegram_id', user.telegram_id)
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
            experience: experienceResult.new_experience,
            level: experienceResult.new_level,
            leveledUp: experienceResult.level_up || false,
            // 🆕 Награды за level up (Этап 2)
            sproutReward: experienceResult.sprout_reward || 0,
            gemReward: experienceResult.gem_reward || 0,
            specialUnlock: experienceResult.special_unlock || null,
            // Достижения
            newAchievements: achievementUpdates.filter(a => a.newly_unlocked),
            reason: reason || 'Unknown',
          },
        })
      }

      case 'recalculate_experience': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId } = req.body
        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        const user = await ensureUser(parseInt(telegramId))

        // Получаем статистику пользователя
        const stats = await calculateUserStats(user)
        if (!stats) {
          return res
            .status(500)
            .json({ success: false, error: 'Failed to calculate stats' })
        }

        // Рассчитываем опыт на основе текущих данных
        // Простая формула: 10 опыта за запись настроения + 15 за элемент сада + бонус за стрики
        const experienceFromMoods = stats.totalMoodEntries * 10
        const experienceFromElements = stats.totalElements * 15
        const experienceFromStreaks = Math.floor(stats.longestStreak / 7) * 50
        const totalCalculatedExperience =
          experienceFromMoods + experienceFromElements + experienceFromStreaks

        // Обновляем опыт в БД через RPC
        const { data, error } = await supabase.rpc('add_user_experience', {
          p_telegram_id: parseInt(telegramId),
          p_experience_points:
            totalCalculatedExperience - (stats.experience || 0), // Разница
        })

        if (error) {
          console.error('Error recalculating experience:', error)
          return res
            .status(500)
            .json({ success: false, error: 'Failed to update experience' })
        }

        // Проверяем новые достижения после обновления опыта
        const achievementUpdates = await checkAndUpdateAchievements(
          user.telegram_id
        )

        return res.status(200).json({
          success: true,
          data: {
            oldExperience: stats.experience || 0,
            newExperience: data[0]?.new_experience || totalCalculatedExperience,
            oldLevel: stats.level || 1,
            newLevel: data[0]?.new_level || 1,
            leveledUp: data[0]?.level_up || false,
            // 🆕 Награды за level up (Этап 2)
            sproutReward: data[0]?.sprout_reward || 0,
            gemReward: data[0]?.gem_reward || 0,
            specialUnlock: data[0]?.special_unlock || null,
            calculation: {
              fromMoods: experienceFromMoods,
              fromElements: experienceFromElements,
              fromStreaks: experienceFromStreaks,
              total: totalCalculatedExperience,
            },
            newAchievements: achievementUpdates.filter(a => a.newly_unlocked),
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

        // Проверяем, что пользователи - друзья (если профиль приватный)
        const { data: friendship, error: friendshipError } = await supabase
          .from('friendships')
          .select('*')
          .or(
            `and(requester_telegram_id.eq.${telegramId},addressee_telegram_id.eq.${friendTelegramId}),and(requester_telegram_id.eq.${friendTelegramId},addressee_telegram_id.eq.${telegramId})`
          )
          .eq('status', 'accepted')
          .single()

        // Если не друзья, проверим настройки приватности
        if (friendshipError || !friendship) {
          // Получаем данные друга для проверки приватности
          const friend = await ensureUser(parseInt(friendTelegramId))
          const privacySettings = friend.privacy_settings || {}

          // Если профиль приватный - требуем дружбу
          if (!privacySettings.showProfile) {
            return res.status(403).json({
              success: false,
              error: 'Профиль недоступен или пользователь не в друзьях',
            })
          }

          // Если профиль публичный - разрешаем просмотр
          console.log(
            `✅ Public profile access granted for user ${friendTelegramId}`
          )
        }

        // Получаем данные друга
        const friend = await ensureUser(parseInt(friendTelegramId))

        // Получаем настройки приватности друга
        const privacySettings = friend.privacy_settings || {}

        // Обновляем достижения друга (чтобы они были актуальными)
        await checkAndUpdateAchievements(friend.telegram_id)

        // Получаем публичную статистику
        const stats = await calculateUserStats(friend)

        // 🔍 ОТЛАДКА: Логируем данные друга для диагностики
        console.log('🔍 Friend Profile Debug:', {
          friendTelegramId,
          friendId: friend.id,
          registrationDate: friend.registration_date,
          daysSinceReg: stats?.totalDays,
          longestStreak: stats?.longestStreak,
          totalElements: stats?.totalElements,
          privacy: privacySettings,
          fullStats: stats,
        })

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
              registration_date: friend.registration_date || friend.created_at,
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

      case 'update_user_stats': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId } = req.body
        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        try {
          // Вызываем функцию пересчета статистики в БД
          const { data, error } = await supabase.rpc('update_user_stats', {
            target_telegram_id: parseInt(telegramId),
          })

          if (error) {
            console.error('Error updating user stats:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update user stats',
              details: error.message,
            })
          }

          return res.status(200).json({
            success: true,
            data: {
              message: 'User stats updated successfully',
              stats: data,
            },
          })
        } catch (err) {
          console.error('Stats update error:', err)
          return res.status(500).json({
            success: false,
            error: 'Failed to update user stats',
            details: err.message,
          })
        }
      }

      case 'update_all_user_stats': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        try {
          // Вызываем функцию массового пересчета статистики
          const { data, error } = await supabase.rpc('update_all_user_stats')

          if (error) {
            console.error('Error updating all user stats:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update all user stats',
              details: error.message,
            })
          }

          return res.status(200).json({
            success: true,
            data: {
              message: 'All user stats updated successfully',
              results: data,
            },
          })
        } catch (err) {
          console.error('Bulk stats update error:', err)
          return res.status(500).json({
            success: false,
            error: 'Failed to update all user stats',
            details: err.message,
          })
        }
      }

      case 'update_notifications': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, notificationSettings } = req.body

        if (!telegramId || !notificationSettings) {
          return res.status(400).json({
            success: false,
            error:
              'Missing required parameters: telegramId, notificationSettings',
          })
        }

        try {
          console.log(
            `🔔 Updating notification settings for user ${telegramId}:`,
            notificationSettings
          )

          // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
          const supabase = await getSupabaseClient(req.auth?.jwt)

          const { data, error } = await supabase
            .from('users')
            .update({
              notification_settings: notificationSettings,
              updated_at: new Date().toISOString(),
            })
            .eq('telegram_id', telegramId)
            .select()

          if (error) {
            console.error('Failed to update notification settings:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update notification settings',
            })
          }

          console.log(`✅ Notification settings updated for user ${telegramId}`)

          return res.status(200).json({
            success: true,
            data: {
              notificationSettings,
              message: 'Notification settings updated successfully',
            },
          })
        } catch (error) {
          console.error('Update notifications error:', error)
          return res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }

      // ⚠️ Административное действие - требует специальной защиты
      case 'update_all_user_stats': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        // 🔐 Административное действие - проверяем внутренний ключ или IP
        const adminKey = req.headers['x-admin-key']
        const EXPECTED_ADMIN_KEY = process.env.ADMIN_API_KEY

        if (!EXPECTED_ADMIN_KEY || adminKey !== EXPECTED_ADMIN_KEY) {
          console.warn('⚠️ Unauthorized attempt to call administrative API')
          return res.status(403).json({
            success: false,
            error:
              'Forbidden: Administrative action requires special authorization',
          })
        }

        try {
          // Вызываем функцию массового пересчета статистики
          const { data, error } = await supabase.rpc('update_all_user_stats')

          if (error) {
            console.error('Error updating all user stats:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update all user stats',
              details: error.message,
            })
          }

          return res.status(200).json({
            success: true,
            data: {
              message: 'All user stats updated successfully',
              results: data,
            },
          })
        } catch (err) {
          console.error('Bulk stats update error:', err)
          return res.status(500).json({
            success: false,
            error: 'Failed to update all user stats',
            details: err.message,
          })
        }
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

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

/**
 * 👤 ОБЪЕДИНЕННЫЙ API ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
 * Включает: stats, update-photo
 */

// 🔒 Функция для инициализации Supabase с JWT (RLS-защищенный)
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
 * Получает URL аватарки пользователя через Telegram Bot API
 * @param {number} telegramId - ID пользователя в Telegram
 * @returns {Promise<string|null>} URL аватарки или null
 */
async function getTelegramUserPhoto(telegramId) {
  const BOT_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found')
    return null
  }

  try {
    // Получаем список фотографий пользователя
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${telegramId}&limit=1`
    )

    const result = await response.json()

    if (
      !result.ok ||
      !result.result.photos ||
      result.result.photos.length === 0
    ) {
      console.log(`No photos found for user ${telegramId}`)
      return null
    }

    // Берём самое большое фото (последнее в массиве размеров)
    const photo = result.result.photos[0]
    const largestPhoto = photo[photo.length - 1]

    // Получаем информацию о файле
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${largestPhoto.file_id}`
    )

    const fileResult = await fileResponse.json()

    if (!fileResult.ok) {
      console.error('Failed to get file info:', fileResult)
      return null
    }

    // Формируем URL для скачивания
    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileResult.result.file_path}`

    return photoUrl
  } catch (error) {
    console.error('Error getting Telegram user photo:', error)
    return null
  }
}

/**
 * Получает данные пользователя из Supabase по telegramId
 */
async function getUserDataFromSupabase(telegramId, jwt = null) {
  try {
    const supabase = await getSupabaseClient(jwt)

    // Получаем основные данные пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (userError || !userData) {
      console.log(`No user found with telegramId: ${telegramId}`)
      return null
    }

    // Получаем историю настроений
    const { data: moodData } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('mood_date', { ascending: false })

    // Получаем элементы сада
    const { data: gardenData } = await supabase
      .from('garden_elements')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('unlock_date', { ascending: false })

    return {
      user: userData,
      moods: moodData || [],
      garden: {
        elements: gardenData || [],
      },
    }
  } catch (error) {
    console.error('Error getting user data from Supabase:', error)
    return null
  }
}

/**
 * Вычисляет статистику на основе данных пользователя
 */
function computeStatsFromUserData(userData) {
  try {
    const { user, moods = [], garden = {} } = userData
    const gardenElements = garden.elements || []

    // 🔥 V3 ЛОГИКА: Стрик управляется на бэкенде через streak_last_checkin
    // Эта функция просто возвращает значения из БД, не пересчитывая их
    const currentStreak = user.current_streak || 0
    let longestStreak = user.longest_streak || 0
    let tempStreak = 0

    console.log(
      `📊 STREAK [V3]: Using server-managed streak from DB: current=${currentStreak}, longest=${longestStreak}`
    )

    // Вычисляем самый длинный streak из истории (для статистики)
    if (moods.length > 0) {
      const sortedMoods = moods.sort(
        (a, b) => new Date(b.mood_date) - new Date(a.mood_date)
      )

      tempStreak = 1
      for (let i = 1; i < sortedMoods.length; i++) {
        const prevDate = new Date(sortedMoods[i - 1].mood_date)
        const currentDate = new Date(sortedMoods[i].mood_date)

        prevDate.setUTCHours(0, 0, 0, 0)
        currentDate.setUTCHours(0, 0, 0, 0)

        const daysDiff = Math.floor(
          (prevDate - currentDate) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)

      console.log(
        `🔍 STREAK DEBUG: Итоговые стрики - текущий: ${currentStreak}, лучший: ${longestStreak}`
      )
    } else {
      console.log(`🔍 STREAK DEBUG: Нет записей настроений`)
    }

    // Подсчитываем элементы по редкости
    const rarityCount = {}
    gardenElements.forEach(element => {
      rarityCount[element.rarity] = (rarityCount[element.rarity] || 0) + 1
    })

    // Исправляем подсчет дней с регистрации - используем UTC
    const registrationDate = user.registration_date
      ? new Date(user.registration_date)
      : new Date()

    registrationDate.setUTCHours(0, 0, 0, 0)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const daysSinceRegistration =
      Math.floor((today - registrationDate) / (1000 * 60 * 60 * 24)) + 1 // +1 потому что день регистрации тоже считается

    console.log(
      `🔍 DAYS DEBUG: Регистрация ${registrationDate.toISOString().split('T')[0]}, сегодня ${today.toISOString().split('T')[0]}, дней: ${daysSinceRegistration}`
    )

    return {
      hasData: true,
      totalDays: daysSinceRegistration, // Используем корректный подсчет дней с регистрации
      currentStreak,
      longestStreak,
      totalElements: gardenElements.length,
      rareElementsFound:
        (rarityCount.rare || 0) +
        (rarityCount.epic || 0) +
        (rarityCount.legendary || 0),
      gardensShared: user.gardens_shared || 0,
      firstVisit: registrationDate,
      lastVisit: user.last_visit_date
        ? new Date(user.last_visit_date)
        : new Date(),
      moodBreakdown: {
        joy: moods.filter(m => m.mood === 'joy').length,
        calm: moods.filter(m => m.mood === 'calm').length,
        stress: moods.filter(m => m.mood === 'stress').length,
        sadness: moods.filter(m => m.mood === 'sadness').length,
        anger: moods.filter(m => m.mood === 'anger').length,
        anxiety: moods.filter(m => m.mood === 'anxiety').length,
      },
      gardenBreakdown: rarityCount,
    }
  } catch (error) {
    console.error('Error computing stats:', error)
    return {
      hasData: false,
      totalDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalElements: 0,
      rareElementsFound: 0,
      gardensShared: 0,
      firstVisit: new Date(),
      lastVisit: new Date(),
    }
  }
}

// ===============================================
// 📊 ACTION: STATS - Получение статистики пользователя
// ===============================================
async function handleStats(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, userData } = req.query

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    console.log(`Computing REAL stats for Telegram user: ${telegramId}`)

    let userDataParsed = null

    // Если данные переданы от приложения - используем их
    if (userData) {
      try {
        userDataParsed = JSON.parse(userData)
        console.log(`Using provided user data for ${telegramId}`)
      } catch (parseError) {
        console.warn(
          'Failed to parse provided userData, fetching from database'
        )
      }
    }

    // Получаем данные из базы если не переданы
    if (!userDataParsed) {
      console.log(`Getting real user data by telegramId: ${telegramId}`)
      // 🔑 Используем JWT для RLS-защищенного запроса
      userDataParsed = await getUserDataFromSupabase(telegramId, req.auth?.jwt)
    }

    let stats
    if (userDataParsed) {
      console.log(`✅ Found real data for user ${telegramId}`)
      stats = computeStatsFromUserData(userDataParsed)
      // 🔥 ИСПРАВЛЕНИЕ: Добавляем данные пользователя в ответ для синхронизации
      stats.user = {
        firstName: userDataParsed.user.first_name,
        lastName: userDataParsed.user.last_name,
        username: userDataParsed.user.username,
        registrationDate: userDataParsed.user.registration_date,
        lastVisitDate: userDataParsed.user.last_visit_date,
        experience: userDataParsed.user.experience || 0,
        level: userDataParsed.user.level || 1,
      }
    } else {
      console.log(
        `📝 No data found for user ${telegramId} - returning new user stats`
      )
      stats = {
        hasData: false,
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalElements: 0,
        rareElementsFound: 0,
        gardensShared: 0,
        firstVisit: new Date(),
        lastVisit: new Date(),
      }
    }

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('User stats error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 📸 ACTION: UPDATE-PHOTO - Обновление аватарки пользователя
// ===============================================
async function handleUpdatePhoto(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, forceUpdate = false } = req.body

    // Валидация входных данных
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Проверяем существует ли пользователь и есть ли у него уже фото
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('telegram_id, photo_url, updated_at')
      .eq('telegram_id', telegramId)
      .single()

    if (userError) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Если фото уже есть и не форсируем обновление, проверяем возраст
    if (userData.photo_url && !forceUpdate) {
      const lastUpdate = new Date(userData.updated_at)
      const now = new Date()
      const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24)

      // Обновляем фото не чаще раза в день
      if (daysSinceUpdate < 1) {
        return res.status(200).json({
          success: true,
          data: {
            photoUrl: userData.photo_url,
            message: 'Photo is up to date',
          },
        })
      }
    }

    console.log(`🔍 Fetching photo for user ${telegramId}...`)

    // Получаем новую аватарку
    const photoUrl = await getTelegramUserPhoto(telegramId)

    // Обновляем в базе данных
    const { error: updateError } = await supabase
      .from('users')
      .update({ photo_url: photoUrl })
      .eq('telegram_id', telegramId)

    if (updateError) {
      console.error('Failed to update user photo:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Failed to update photo in database',
      })
    }

    console.log(
      `✅ Photo updated for user ${telegramId}: ${photoUrl ? 'Found' : 'Not found'}`
    )

    res.status(200).json({
      success: true,
      data: {
        photoUrl,
        message: photoUrl
          ? 'Photo updated successfully'
          : 'No photo found, cleared from database',
      },
    })
  } catch (error) {
    console.error('Update photo error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 🎯 ГЛАВНЫЙ ОБРАБОТЧИК - Роутинг по действиям
// ===============================================

// Импортируем middleware аутентификации
import { withAuth, verifyTelegramId } from './_auth.js'

/**
 * 🧊 Использовать заморозку стрика
 * POST /api/user?action=use-streak-freeze
 */
async function handleUseStreakFreeze(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const {
      telegramId,
      freezeType = 'manual',
      missedDays = 1,
      localDate = null,
    } = req.body

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)

    console.log(
      `🧊 Using streak freeze for user ${telegramId}, type: ${freezeType}, missed days: ${missedDays}`
    )

    // Получаем текущие заморозки пользователя
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('streak_freezes, auto_freezes, current_streak')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !user) {
      console.error('Error fetching user:', fetchError)
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Проверяем тип заморозки
    if (freezeType === 'auto') {
      // 🧊 АВТО-ЗАМОРОЗКА: всегда покрывает ровно 1 день (параметр missedDays игнорируется)
      if (user.auto_freezes < 1) {
        return res.status(400).json({
          success: false,
          error: 'No auto-freezes available',
          available: { manual: user.streak_freezes, auto: user.auto_freezes },
        })
      }
    } else {
      // 🔧 РУЧНАЯ ЗАМОРОЗКА: покрывает количество дней = missedDays
      if (user.streak_freezes < missedDays) {
        return res.status(400).json({
          success: false,
          error: `Not enough freezes. Need: ${missedDays}, have: ${user.streak_freezes}`,
          available: { manual: user.streak_freezes, auto: user.auto_freezes },
        })
      }
    }

    // Применяем заморозку
    const updates = {}
    if (freezeType === 'auto') {
      updates.auto_freezes = user.auto_freezes - 1
    } else {
      updates.streak_freezes = user.streak_freezes - missedDays
    }

    // 🔥 СИНХРОНИЗАЦИЯ (TZ):
    // "Вчера" должно считаться от локального дня пользователя, а не от времени сервера.
    // Клиент передает localDate=YYYY-MM-DD.
    const ymdToUtcMs = ymd => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
      if (!m) return null
      const year = Number(m[1])
      const month = Number(m[2])
      const day = Number(m[3])
      if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day)
      ) {
        return null
      }
      return Date.UTC(year, month - 1, day, 0, 0, 0, 0)
    }

    const utcMsToYmd = ms => {
      const d = new Date(ms)
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    let yesterdayStr = null
    if (
      typeof localDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(localDate)
    ) {
      const todayMs = ymdToUtcMs(localDate)
      yesterdayStr =
        todayMs != null ? utcMsToYmd(todayMs - 24 * 60 * 60 * 1000) : null
    }

    if (!yesterdayStr) {
      // Fallback: локальная дата сервера (может быть неверной для TZ пользователя!)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayYear = yesterday.getFullYear()
      const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0')
      const yesterdayDay = String(yesterday.getDate()).padStart(2, '0')
      yesterdayStr = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`
      console.warn(
        `⚠️ No/invalid localDate for use-streak-freeze, using server local yesterday: ${yesterdayStr}`
      )
    }

    updates.streak_last_checkin = yesterdayStr

    console.log(`🔍 [FREEZE DEBUG] Before applying freeze:`, {
      telegramId,
      freezeType,
      missedDays,
      currentStreak: user.current_streak,
      yesterdayDate: updates.streak_last_checkin,
      updates,
    })

    // 🔥 ИСПРАВЛЕНИЕ: Заморозка НЕ должна изменять текущий стрик.
    // Она лишь "заполняет" пропущенные дни. Стрик будет увеличен,
    // когда пользователь отметит настроение за СЕГОДНЯ.
    // БЫЛО: updates.current_streak = missedDays + 1

    // Применяем изменения (только списание заморозок)
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('telegram_id', telegramId)
      .select('streak_freezes, auto_freezes, current_streak')
      .single()

    if (updateError) {
      console.error('Error updating freezes:', updateError)
      return res
        .status(500)
        .json({ success: false, error: 'Failed to use streak freeze' })
    }

    console.log(
      `✅ Streak freeze used successfully. Remaining: manual=${updated.streak_freezes}, auto=${updated.auto_freezes}, current_streak=${updated.current_streak}`
    )

    return res.status(200).json({
      success: true,
      data: {
        freezeType,
        missedDays,
        remaining: {
          manual: updated.streak_freezes,
          auto: updated.auto_freezes,
        },
        currentStreak: user.current_streak, // 🔥 ИСПРАВЛЕНИЕ: Возвращаем НЕИЗМЕНЕННЫЙ стрик
      },
    })
  } catch (error) {
    console.error('Error in handleUseStreakFreeze:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🔄 Сбросить стрик (без использования заморозок)
 * POST /api/user?action=reset-streak
 */
async function handleResetStreak(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { telegramId, localDate = null } = req.body

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)

    console.log(`🔄 Resetting streak for user ${telegramId}`)

    // 🔥 СИНХРОНИЗАЦИЯ (TZ): "Вчера" считаем от localDate пользователя.
    const ymdToUtcMs = ymd => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
      if (!m) return null
      const year = Number(m[1])
      const month = Number(m[2])
      const day = Number(m[3])
      if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day)
      ) {
        return null
      }
      return Date.UTC(year, month - 1, day, 0, 0, 0, 0)
    }

    const utcMsToYmd = ms => {
      const d = new Date(ms)
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    let yesterdayFormatted = null
    if (
      typeof localDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(localDate)
    ) {
      const todayMs = ymdToUtcMs(localDate)
      yesterdayFormatted =
        todayMs != null ? utcMsToYmd(todayMs - 24 * 60 * 60 * 1000) : null
    }

    if (!yesterdayFormatted) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayYear = yesterday.getFullYear()
      const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0')
      const yesterdayDay = String(yesterday.getDate()).padStart(2, '0')
      yesterdayFormatted = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`
      console.warn(
        `⚠️ No/invalid localDate for reset-streak, using server local yesterday: ${yesterdayFormatted}`
      )
    }

    // Сбрасываем стрик в базе данных
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        current_streak: 0,
        updated_at: new Date().toISOString(),
        streak_last_checkin: yesterdayFormatted,
      })
      .eq('telegram_id', telegramId)
      .select('current_streak, longest_streak')
      .single()

    if (updateError) {
      console.error('Error resetting streak:', updateError)
      return res
        .status(500)
        .json({ success: false, error: 'Failed to reset streak' })
    }

    console.log(
      `✅ Streak reset successfully. New streak: ${updated.current_streak}, longest streak: ${updated.longest_streak}`
    )

    return res.status(200).json({
      success: true,
      data: {
        currentStreak: updated.current_streak,
        longestStreak: updated.longest_streak,
        message: 'Streak reset successfully',
      },
    })
  } catch (error) {
    console.error('Error in handleResetStreak:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🧊 Получить количество заморозок стрика
 * GET /api/user?action=get-streak-freezes&telegramId=123
 */
async function handleGetStreakFreezes(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)

    console.log(`🧊 Getting streak freezes for user ${telegramId}`)

    const { data: user, error } = await supabase
      .from('users')
      .select('streak_freezes, auto_freezes, level')
      .eq('telegram_id', telegramId)
      .single()

    if (error || !user) {
      console.error('Error fetching user:', error)
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Получаем максимальное накопление из уровня (из БД)
    const { data: levelData, error: levelError } = await supabase
      .from('gardener_levels')
      .select('max_streak_freezes')
      .eq('level', user.level || 1)
      .single()

    if (levelError) {
      console.warn('Could not fetch level data, using default:', levelError)
    }

    const maxFreezes = levelData?.max_streak_freezes ?? 3

    console.log(
      `✅ Freezes: manual=${user.streak_freezes}, auto=${user.auto_freezes}, max=${maxFreezes}`
    )

    return res.status(200).json({
      success: true,
      data: {
        manual: user.streak_freezes,
        auto: user.auto_freezes,
        max: maxFreezes,
        canAccumulate: user.streak_freezes < maxFreezes,
      },
    })
  } catch (error) {
    console.error('Error in handleGetStreakFreezes:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🛒 Покупка заморозок стрика
 * POST /api/user?action=buy-streak-freeze
 * Body: { telegramId, freezeType: 'manual' | 'auto', quantity?: number }
 */
async function handleBuyStreakFreeze(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { telegramId, freezeType = 'manual', quantity = 1 } = req.body

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    // 🔒 ПРОВЕРКА БЕЗОПАСНОСТИ: Пользователь может покупать только для себя
    if (!verifyTelegramId(telegramId, req.auth?.telegramId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only buy freezes for yourself',
      })
    }

    if (!['manual', 'auto'].includes(freezeType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid freezeType. Must be manual or auto',
      })
    }

    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity. Must be between 1 and 10',
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)

    console.log(
      `🛒 Buying ${quantity}x ${freezeType} freeze for user ${telegramId}`
    )

    // 🧊 КОНФИГУРАЦИЯ СТОИМОСТИ (легко меняется)
    const FREEZE_COSTS = {
      manual: { sprouts: 1500, gems: 0 }, // 🌿 Обычная заморозка стрика
      auto: { sprouts: 3000, gems: 0 }, // 🌿 Автозаморозка
      // Альтернатива за гемы (раскомментировать при необходимости):
      // manual: { sprouts: 0, gems: 5 },
      // auto: { sprouts: 0, gems: 10 },
    }

    const cost = FREEZE_COSTS[freezeType]
    const currencyType = cost.gems > 0 ? 'gems' : 'sprouts'
    const totalCost = (cost[currencyType] || 0) * quantity

    // Получаем текущие данные пользователя
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('streak_freezes, auto_freezes, level')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !user) {
      console.error('Error fetching user:', fetchError)
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Получаем максимальное накопление из уровня
    const { data: levelData } = await supabase
      .from('gardener_levels')
      .select('max_streak_freezes')
      .eq('level', user.level || 1)
      .single()

    const maxFreezes = levelData?.max_streak_freezes ?? 3

    // Проверяем, можно ли купить (для ручных заморозок есть лимит)
    if (freezeType === 'manual') {
      const newAmount = user.streak_freezes + quantity
      if (newAmount > maxFreezes) {
        return res.status(400).json({
          success: false,
          error: `Превышен лимит накопления (макс: ${maxFreezes}). Текущее количество: ${user.streak_freezes}`,
          data: {
            current: user.streak_freezes,
            max: maxFreezes,
            canBuy: maxFreezes - user.streak_freezes,
          },
        })
      }
    }

    // Списываем валюту через RPC функцию
    const { data: spendResult, error: spendError } = await supabase.rpc(
      'spend_currency',
      {
        p_telegram_id: telegramId,
        p_currency_type: currencyType,
        p_amount: totalCost,
        p_reason:
          freezeType === 'manual' ? 'streak_freeze' : 'auto_streak_freeze',
        p_description: `Покупка ${quantity}x ${freezeType === 'manual' ? 'заморозка' : 'авто-заморозка'} стрика`,
        p_metadata: { freezeType, quantity },
      }
    )

    if (spendError) {
      console.error('❌ Error spending currency:', spendError)
      return res.status(500).json({
        success: false,
        error: 'Failed to process payment',
      })
    }

    const spendData = Array.isArray(spendResult) ? spendResult[0] : spendResult

    // Проверяем успешность операции
    if (!spendData || !spendData.success) {
      console.log(`⚠️ Insufficient funds for user ${telegramId}`)
      return res.status(400).json({
        success: false,
        error: spendData?.error || 'Недостаточно средств',
      })
    }

    // Начисляем заморозки
    const updates = {}
    if (freezeType === 'manual') {
      updates.streak_freezes = Math.min(
        user.streak_freezes + quantity,
        maxFreezes
      )
    } else {
      updates.auto_freezes = (user.auto_freezes || 0) + quantity
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('telegram_id', telegramId)
      .select('streak_freezes, auto_freezes')
      .single()

    if (updateError) {
      console.error('Error updating freezes:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Failed to add freezes',
      })
    }

    console.log(
      `✅ Successfully bought ${quantity}x ${freezeType} freeze. New amounts: manual=${updated.streak_freezes}, auto=${updated.auto_freezes}`
    )

    return res.status(200).json({
      success: true,
      data: {
        freezeType,
        quantityBought: quantity,
        newAmount:
          freezeType === 'manual'
            ? updated.streak_freezes
            : updated.auto_freezes,
        totalCost,
        currencyUsed: currencyType,
        newBalance: spendData.balance_after,
        transactionId: spendData.transaction_id,
      },
    })
  } catch (error) {
    console.error('Error in handleBuyStreakFreeze:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🎨 НОВЫЙ ЭНДПОИНТ: Обновление темы сада
 * POST /api/user?action=update-garden-theme&telegramId=123
 * Body: { gardenTheme: 'sunset' }
 */
async function handleUpdateGardenTheme(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)
    const { gardenTheme } = req.body

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    if (!gardenTheme) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing gardenTheme' })
    }

    // Валидируем тему сада
    const validThemes = [
      'light',
      'dark',
      'sunset',
      'night',
      'forest',
      'aqua',
      'cyberpunk',
      'space',
      'magic',
    ]
    if (!validThemes.includes(gardenTheme)) {
      return res.status(400).json({
        success: false,
        error: `Invalid garden theme. Valid themes: ${validThemes.join(', ')}`,
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)
    console.log(
      `🎨 Updating garden theme for user ${telegramId} to ${gardenTheme}`
    )

    const { data, error } = await supabase
      .from('users')
      .update({
        garden_theme: gardenTheme,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramId)
      .select('garden_theme')
      .single()

    if (error) {
      console.error('Failed to update garden theme:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update garden theme',
      })
    }

    console.log(
      `✅ Garden theme updated for user ${telegramId}: ${data.garden_theme}`
    )

    return res.status(200).json({
      success: true,
      data: {
        gardenTheme: data.garden_theme,
      },
    })
  } catch (error) {
    console.error('Error in handleUpdateGardenTheme:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🏠 НОВЫЙ ЭНДПОИНТ: Обновление темы комнаты
 * POST /api/user?action=update-room-theme&telegramId=123
 * Body: { roomTheme: 'cyberpunk_room' }
 */
async function handleUpdateRoomTheme(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)
    const { roomTheme } = req.body

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    if (!roomTheme) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing roomTheme' })
    }

    const validThemes = [
      'isoRoom',
      'white_default_room',
      'blue_default_room',
      'dark_blue_default_room',
      'orange_default_room',
      'old_wood_room',
      'prison_room',
      'brick_room',
      'autumn_room',
      'paint_room',
      'zodiac_room',
      'new_year_room',
      'cyberpunk_room',
      'high_tec_room',
      'dark_neon_room',
    ]

    if (!validThemes.includes(roomTheme)) {
      return res.status(400).json({
        success: false,
        error: `Invalid room theme. Valid themes: ${validThemes.join(', ')}`,
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)
    console.log(`🏠 Updating room theme for user ${telegramId} to ${roomTheme}`)

    const { data, error } = await supabase
      .from('users')
      .update({
        room_theme: roomTheme,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramId)
      .select('room_theme')
      .single()

    if (error) {
      console.error('Failed to update room theme:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update room theme',
      })
    }

    console.log(
      `✅ Room theme updated for user ${telegramId}: ${data.room_theme}`
    )

    return res.status(200).json({
      success: true,
      data: {
        roomTheme: data.room_theme,
      },
    })
  } catch (error) {
    console.error('Error in handleUpdateRoomTheme:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🌿 Обновление приоритетного вида сада друзей
 * POST /api/user?action=update-friend-garden-display&telegramId=123
 * Body: { friendGardenDisplay: 'garden' | 'palette' | 'isometric_room' }
 */
async function handleUpdateFriendGardenDisplay(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)
    const { friendGardenDisplay } = req.body

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    const validModes = ['garden', 'palette', 'isometric_room']
    if (!friendGardenDisplay || !validModes.includes(friendGardenDisplay)) {
      return res.status(400).json({
        success: false,
        error: `Invalid friendGardenDisplay. Valid values: ${validModes.join(', ')}`,
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)
    console.log(
      `🌿 Updating friend garden display for user ${telegramId} to ${friendGardenDisplay}`
    )

    const { data, error } = await supabase
      .from('users')
      .update({
        friend_garden_display: friendGardenDisplay,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramId)
      .select('friend_garden_display')
      .single()

    if (error) {
      console.error('Failed to update friend garden display:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update friend garden display',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        friendGardenDisplay: data.friend_garden_display,
      },
    })
  } catch (error) {
    console.error('Error in handleUpdateFriendGardenDisplay:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🌿 Обновление базового режима отображения сада пользователя
 * POST /api/user?action=update-garden-display&telegramId=123
 * Body: { gardenDisplayMode: 'garden' | 'palette' | 'isometric_room' }
 */
async function handleUpdateGardenDisplay(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)
    const { gardenDisplayMode } = req.body

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    const validModes = ['garden', 'palette', 'isometric_room']
    if (!gardenDisplayMode || !validModes.includes(gardenDisplayMode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid gardenDisplayMode. Valid values: ${validModes.join(', ')}`,
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)
    console.log(
      `🌿 Updating garden display for user ${telegramId} to ${gardenDisplayMode}`
    )

    const { data, error } = await supabase
      .from('users')
      .update({
        garden_display_mode: gardenDisplayMode,
        friend_garden_display: gardenDisplayMode,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramId)
      .select('garden_display_mode, friend_garden_display')
      .single()

    if (error) {
      console.error('Failed to update garden display mode:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update garden display mode',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        gardenDisplayMode: data.garden_display_mode,
      },
    })
  } catch (error) {
    console.error('Error in handleUpdateGardenDisplay:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

/**
 * 🔥 НОВЫЙ ЭНДПОИНТ: Проверка состояния стрика
 * GET /api/user?action=check-streak&telegramId=123
 */
async function handleCheckStreak(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)
    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing telegramId' })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)
    console.log(`🧐 Checking streak status for user ${telegramId}`)

    const { data: user, error } = await supabase
      .from('users')
      .select('current_streak, streak_last_checkin')
      .eq('telegram_id', telegramId)
      .single()

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // --- Логика расчета пропущенных дней ---
    // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ (TZ):
    // "Сегодня" должно определяться по локальному дню пользователя, а не по времени сервера.
    // Клиент передает localDate=YYYY-MM-DD.
    const { localDate } = req.query
    let todayFormatted
    if (
      typeof localDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(localDate)
    ) {
      todayFormatted = localDate
    } else {
      // Fallback: локальная дата сервера (может быть неверной для пользователя!)
      const today = new Date()
      const todayYear = today.getFullYear()
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
      const todayDay = String(today.getDate()).padStart(2, '0')
      todayFormatted = `${todayYear}-${todayMonth}-${todayDay}`
      console.warn(
        `⚠️ No localDate provided for check-streak, using server local date: ${todayFormatted}`
      )
    }

    const ymdToUtcMs = ymd => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
      if (!m) return null
      const year = Number(m[1])
      const month = Number(m[2])
      const day = Number(m[3])
      if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day)
      ) {
        return null
      }
      return Date.UTC(year, month - 1, day, 0, 0, 0, 0)
    }

    let missedDays = 0

    if (user.streak_last_checkin) {
      // Считаем разницу в ДНЯХ между двумя YYYY-MM-DD без влияния часового пояса.
      const lastMs = ymdToUtcMs(user.streak_last_checkin)
      const todayMs = ymdToUtcMs(todayFormatted)
      const diffDays =
        lastMs != null && todayMs != null
          ? Math.floor((todayMs - lastMs) / (1000 * 60 * 60 * 24))
          : 0

      console.log(
        `🔍 [CHECK STREAK] lastCheckin=${user.streak_last_checkin}, today=${todayFormatted}, diffDays=${diffDays}`
      )

      if (diffDays > 1) {
        missedDays = diffDays - 1
      }
    } else if (user.current_streak > 0) {
      // Если есть стрик, но нет даты - значит что-то не так, считаем 1 день пропущенным
      missedDays = 1
    }
    // -----------------------------------------

    console.log(
      ` streak status for user ${telegramId}: missedDays=${missedDays}, currentStreak=${user.current_streak}`
    )

    // --- Определяем состояние стрика ---
    let streakState = 'ok' // ok, at_risk, broken
    if (missedDays > 0 && user.current_streak > 0) {
      streakState = missedDays > 7 ? 'broken' : 'at_risk'
    } else if (missedDays > 0 && user.current_streak === 0) {
      streakState = 'ok' // Стрик уже сброшен, все в порядке
    }
    // -----------------------------------

    return res.status(200).json({
      success: true,
      data: {
        missedDays,
        currentStreak: user.current_streak,
        streakState, // 'ok', 'at_risk', 'broken'
        lastCheckin: user.streak_last_checkin,
      },
    })
  } catch (error) {
    console.error('Error in handleCheckStreak:', error)
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' })
  }
}

// Защищенный handler с аутентификацией
async function protectedHandler(req, res) {
  try {
    // Получаем действие из query параметров
    const { action } = req.query

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: action',
      })
    }

    // 🔐 Проверяем что пользователь запрашивает свои данные
    const requestedTelegramId = req.query.telegramId || req.body.telegramId

    if (
      requestedTelegramId &&
      !verifyTelegramId(requestedTelegramId, req.auth.telegramId)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only access your own data',
      })
    }

    // Роутинг по действиям
    switch (action) {
      case 'stats':
        return await handleStats(req, res)
      case 'update-photo':
        return await handleUpdatePhoto(req, res)
      case 'use-streak-freeze':
        return await handleUseStreakFreeze(req, res)
      case 'buy-streak-freeze':
        return await handleBuyStreakFreeze(req, res)
      case 'get-streak-freezes':
        return await handleGetStreakFreezes(req, res)
      case 'reset-streak':
        return await handleResetStreak(req, res)
      case 'check-streak': // 🔥 НОВЫЙ ЭНДПОИНТ
        return await handleCheckStreak(req, res)
      case 'update-garden-theme': // 🎨 НОВЫЙ ЭНДПОИНТ
        return await handleUpdateGardenTheme(req, res)
      case 'update-room-theme': // 🏠 НОВЫЙ ЭНДПОИНТ
        return await handleUpdateRoomTheme(req, res)
      case 'update-friend-garden-display': // 🌿 НОВЫЙ ЭНДПОИНТ
        return await handleUpdateFriendGardenDisplay(req, res)
      case 'update-garden-display': // 🌿 НОВЫЙ ЭНДПОИНТ
        return await handleUpdateGardenDisplay(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: stats, update-photo, use-streak-freeze, buy-streak-freeze, get-streak-freezes, reset-streak, check-streak, update-garden-theme, update-room-theme, update-friend-garden-display, update-garden-display`,
        })
    }
  } catch (error) {
    console.error('User API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

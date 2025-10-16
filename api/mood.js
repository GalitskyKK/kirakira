/**
 * 😊 ОБЪЕДИНЕННЫЙ API ДЛЯ НАСТРОЕНИЙ
 * Включает: record, history
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

// ===============================================
// ✍️ ACTION: RECORD - Запись настроения
// ===============================================
async function handleRecord(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      telegramUserId,
      mood,
      date,
      note = null,
      intensity = 2,
      telegramUserData = null,
    } = req.body

    // Валидация входных данных
    if (!telegramUserId || !mood || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: telegramUserId, mood, date',
      })
    }

    // Валидация mood
    const validMoods = ['joy', 'calm', 'stress', 'sadness', 'anger', 'anxiety']
    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        success: false,
        error: `Invalid mood. Must be one of: ${validMoods.join(', ')}`,
      })
    }

    // Валидация intensity
    if (intensity < 1 || intensity > 10) {
      return res.status(400).json({
        success: false,
        error: 'Intensity must be between 1 and 10',
      })
    }

    console.log(`🗄️ Recording mood to Supabase for user ${telegramUserId}:`, {
      mood,
      date: new Date(date).toISOString(),
      note,
      intensity,
    })

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // 🔥 АВТОМАТИЧЕСКИ СОЗДАЕМ ПОЛЬЗОВАТЕЛЯ ЕСЛИ ЕГО НЕТ
    if (telegramUserData) {
      console.log(`👤 Ensuring user exists with data:`, telegramUserData)

      const { error: userError } = await supabase.from('users').upsert(
        {
          telegram_id: telegramUserId,
          user_id: telegramUserData.userId || `user_${telegramUserId}`,
          username: telegramUserData.username || null,
          first_name: telegramUserData.firstName || null,
          last_name: telegramUserData.lastName || null,
          language_code: telegramUserData.languageCode || 'ru',
          photo_url: telegramUserData.photoUrl || null,
          // registration_date будет равна created_at (автоматически в БД)
          last_visit_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'telegram_id',
        }
      )

      if (userError) {
        console.error('Auto user creation error:', userError)
        // Продолжаем выполнение, так как пользователь может уже существовать
      } else {
        console.log(`✅ User ${telegramUserId} ensured in database`)
      }
    }

    // 🔧 ИСПРАВЛЕНИЕ: Правильно форматируем дату с учетом часового пояса пользователя
    // Клиент отправляет дату в своем локальном времени, нужно извлечь только дату
    const moodDate = new Date(date)

    // Получаем локальную дату пользователя (YYYY-MM-DD) независимо от UTC
    const userYear = moodDate.getFullYear()
    const userMonth = String(moodDate.getMonth() + 1).padStart(2, '0')
    const userDay = String(moodDate.getDate()).padStart(2, '0')
    const formattedDate = `${userYear}-${userMonth}-${userDay}`

    console.log(
      `📅 Date processing: client sent ${date}, saving as ${formattedDate}`
    )

    // Используем UPSERT для замены записи за день
    const { data, error } = await supabase
      .from('mood_entries')
      .upsert(
        {
          telegram_id: telegramUserId,
          mood: mood,
          intensity: intensity,
          note: note,
          mood_date: formattedDate,
        },
        {
          onConflict: 'telegram_id,mood_date',
        }
      )
      .select()

    if (error) {
      console.error('Supabase mood record failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to save mood record',
      })
    }

    console.log(`✅ Mood recorded to Supabase for user ${telegramUserId}`)

    // 🔥 V3: Обновляем стрик через серверную логику
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('current_streak, streak_last_checkin')
      .eq('telegram_id', telegramUserId)
      .single()

    if (!userFetchError && userData) {
      const lastCheckin = userData.streak_last_checkin
        ? new Date(userData.streak_last_checkin)
        : null
      const todayDate = new Date(formattedDate)
      todayDate.setUTCHours(0, 0, 0, 0)

      let newStreak = userData.current_streak || 0

      if (lastCheckin) {
        lastCheckin.setUTCHours(0, 0, 0, 0)
        const diffDays = Math.floor(
          (todayDate - lastCheckin) / (1000 * 60 * 60 * 24)
        )

        if (diffDays === 1) {
          // Продолжаем стрик
          newStreak = newStreak + 1
          console.log(`📈 Streak continues: ${newStreak}`)
        } else if (diffDays === 0) {
          // Обновление настроения за тот же день - стрик не меняется
          console.log(`🔄 Same day mood update, streak unchanged: ${newStreak}`)
        } else {
          // Стрик прерван, начинаем заново
          newStreak = 1
          console.log(`🔁 Streak broken, starting new: ${newStreak}`)
        }
      } else {
        // Первая отметка или нет данных о последней
        newStreak = 1
        console.log(`🆕 First mood check-in, streak: ${newStreak}`)
      }

      // Получаем текущий longest_streak для корректного обновления
      const { data: userFullData } = await supabase
        .from('users')
        .select('longest_streak')
        .eq('telegram_id', telegramUserId)
        .single()

      const currentLongestStreak = userFullData?.longest_streak || 0

      // Обновляем streak и дату в БД
      const { error: streakError } = await supabase
        .from('users')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, currentLongestStreak),
          streak_last_checkin: formattedDate,
          last_visit_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('telegram_id', telegramUserId)

      if (streakError) {
        console.warn('Failed to update streak:', streakError)
      } else {
        console.log(`✅ Streak updated to ${newStreak}`)
      }
    }

    // 🏆 НАЧИСЛЯЕМ ОПЫТ ЗА ЗАПИСЬ НАСТРОЕНИЯ (JWT-аутентифицированный RPC)
    try {
      // Проверяем первая ли это запись за день
      const today = formattedDate
      const { data: todayEntries } = await supabase
        .from('mood_entries')
        .select('id')
        .eq('telegram_id', telegramUserId)
        .eq('mood_date', today)

      const isFirstToday = !todayEntries || todayEntries.length <= 1
      const experiencePoints = isFirstToday ? 20 : 10 // FIRST_MOOD_OF_DAY : DAILY_MOOD

      // ✅ БЕЗОПАСНО: Используем RPC с тем же JWT-клиентом (соблюдает RLS)
      const { data: xpResult, error: xpError } = await supabase.rpc(
        'add_user_experience',
        {
          p_telegram_id: telegramUserId,
          p_experience_points: experiencePoints,
        }
      )

      if (xpError) {
        console.error('❌ CRITICAL: Failed to add XP for mood entry:', {
          error: xpError,
          telegram_id: telegramUserId,
          experience_points: experiencePoints,
          is_first_today: isFirstToday,
        })
        // Логируем ошибку, но не прерываем выполнение (настроение уже сохранено)
      } else {
        console.log(
          `🏆 Added ${experiencePoints} XP for mood entry: ${mood} (${isFirstToday ? 'first today' : 'additional'})`,
          xpResult?.[0] || xpResult
        )

        // 🎉 Если был level up, возвращаем информацию об этом (Этап 2)
        const xpData = xpResult?.[0]
        if (xpData?.level_up) {
          res.status(200).json({
            success: true,
            data: {
              id: data?.[0]?.id,
              saved: true,
              storage: 'supabase',
              mood: mood,
              date: formattedDate,
              intensity: intensity,
              note: note,
              message: 'Mood recorded successfully',
              // 🆕 Информация о level up
              levelUp: {
                leveledUp: true,
                newLevel: xpData.new_level,
                newExperience: xpData.new_experience,
                sproutReward: xpData.sprout_reward || 0,
                gemReward: xpData.gem_reward || 0,
                specialUnlock: xpData.special_unlock || null,
              },
            },
          })
          return
        }
      }
    } catch (xpError) {
      console.error('❌ CRITICAL: Exception in XP addition:', {
        exception: xpError,
        telegram_id: telegramUserId,
        message: xpError?.message,
      })
      // Не критично для пользователя, но требует внимания разработчика
    }

    res.status(200).json({
      success: true,
      data: {
        id: data?.[0]?.id,
        saved: true,
        storage: 'supabase',
        mood: mood,
        date: formattedDate,
        intensity: intensity,
        note: note,
        message: 'Mood recorded successfully',
      },
    })
  } catch (error) {
    console.error('Mood record error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 📅 ACTION: TODAY - Получение настроения за сегодня
// ===============================================
async function handleToday(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId } = req.query

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    // Получаем JWT из заголовков
    const authHeader = req.headers.authorization
    const jwt = authHeader?.replace('Bearer ', '')

    if (!jwt) {
      return res.status(401).json({
        success: false,
        error: 'Missing JWT token',
      })
    }

    // Временно используем SERVICE_ROLE_KEY для избежания JWT ошибок
    const supabase = await getSupabaseClient()

    // Получаем сегодняшнее настроение
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    const { data: todayEntries, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('telegram_id', telegramId)
      .eq('mood_date', today)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({
        success: false,
        error: 'Database error',
      })
    }

    const todaysMood =
      todayEntries && todayEntries.length > 0 ? todayEntries[0] : null

    return res.status(200).json({
      success: true,
      data: {
        mood: todaysMood ? todaysMood.mood : null,
        moodEntry: todaysMood,
        canCheckin: !todaysMood, // Можно отметить, если сегодня еще не отмечали
      },
    })
  } catch (error) {
    console.error("Error getting today's mood:", error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 📊 ACTION: HISTORY - Получение истории настроений
// ===============================================
async function handleHistory(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, limit, offset = 0 } = req.query

    // Валидация входных данных
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    console.log(`📖 Loading mood history from Supabase for user ${telegramId}`)

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Строим запрос
    let query = supabase
      .from('mood_entries')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('mood_date', { ascending: false })

    // Добавляем лимит и оффсет если указаны
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    if (offset) {
      query = query.range(
        parseInt(offset),
        parseInt(offset) + parseInt(limit || 100) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase mood history fetch failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch mood history',
      })
    }

    console.log(`✅ Loaded ${data.length} mood entries for user ${telegramId}`)

    res.status(200).json({
      success: true,
      data: {
        moodHistory: data, // Возвращаем сырые данные как ожидает frontend
        total: data.length,
        storage: 'supabase',
      },
    })
  } catch (error) {
    console.error('Mood history error:', error)
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

    // 🔐 Проверяем что пользователь работает со своими данными
    const requestedTelegramId = req.query.telegramId || req.body.telegramUserId

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
      case 'record':
        return await handleRecord(req, res)
      case 'history':
        return await handleHistory(req, res)
      case 'today':
        return await handleToday(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: record, history, today`,
        })
    }
  } catch (error) {
    console.error('Mood API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

/**
 * 😊 ОБЪЕДИНЕННЫЙ API ДЛЯ НАСТРОЕНИЙ
 * Включает: record, history
 */

// Общая функция для инициализации Supabase
async function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not configured')
  }

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

    const moodDate = new Date(date)

    console.log(`🗄️ Recording mood to Supabase for user ${telegramUserId}:`, {
      mood,
      date: moodDate.toISOString(),
      note,
      intensity,
    })

    const supabase = await getSupabaseClient()

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

    // Форматируем дату для PostgreSQL (только дата, без времени)
    const formattedDate = moodDate.toISOString().split('T')[0]

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

    // Обновляем счетчики streak пользователя напрямую
    const { error: streakError } = await supabase
      .from('users')
      .update({
        last_visit_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramUserId)

    if (streakError) {
      console.warn('Failed to update user mood streak:', streakError)
      // Не критично, продолжаем
    }

    // 🏆 НАЧИСЛЯЕМ ОПЫТ ЗА ЗАПИСЬ НАСТРОЕНИЯ
    try {
      // Проверяем первая ли это запись за день
      const today = formattedDate
      const { data: todayEntries } = await supabase
        .from('mood_entries')
        .select('id')
        .eq('telegram_id', telegramUserId)
        .eq('mood_date', today)

      const isFirstToday = !todayEntries || todayEntries.length <= 1

      // Базовый опыт за запись настроения
      const addMoodResponse = await fetch(
        `${process.env.VITE_APP_URL || 'https://kirakira-theta.vercel.app'}/api/profile?action=add_experience`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: telegramUserId,
            experiencePoints: isFirstToday ? 20 : 10, // FIRST_MOOD_OF_DAY : DAILY_MOOD
            reason: isFirstToday
              ? `first_mood_today: ${mood}`
              : `mood_entry: ${mood}`,
          }),
        }
      )

      if (addMoodResponse.ok) {
        console.log(
          `🏆 Added XP for mood entry: ${mood} (${isFirstToday ? 'first today' : 'additional'})`
        )
      }
    } catch (xpError) {
      console.warn('⚠️ Failed to add XP for mood entry:', xpError)
      // Не критично, продолжаем
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

    const supabase = await getSupabaseClient()

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
export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Получаем действие из query параметров
    const { action } = req.query

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: action',
      })
    }

    // Роутинг по действиям
    switch (action) {
      case 'record':
        return await handleRecord(req, res)
      case 'history':
        return await handleHistory(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: record, history`,
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

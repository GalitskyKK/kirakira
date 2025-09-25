/**
 * API эндпоинт для записи настроения пользователя
 * POST /api/mood/record
 * Body: { telegramUserId: number, mood: string, date: string }
 */

/**
 * 🗄️ SUPABASE: Сохраняет настроение пользователя в базу данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} mood - Настроение пользователя
 * @param {Date} date - Дата записи
 * @param {string} note - Дополнительная заметка (опционально)
 * @param {number} intensity - Интенсивность настроения (1-3)
 * @returns {Promise<boolean>} Успешность сохранения
 */
async function saveMoodRecord(
  telegramUserId,
  mood,
  date,
  note = null,
  intensity = 2,
  telegramUserData = null
) {
  try {
    console.log(`🗄️ Recording mood to Supabase for user ${telegramUserId}:`, {
      mood,
      date: date.toISOString(),
      note,
      intensity,
    })

    // 🗄️ SUPABASE для всех окружений
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Динамический импорт для совместимости
        const { createClient } = await import('@supabase/supabase-js')

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // 🔥 АВТОМАТИЧЕСКИ СОЗДАЕМ ПОЛЬЗОВАТЕЛЯ ЕСЛИ ЕГО НЕТ
        if (telegramUserData) {
          console.log(`👤 Ensuring user exists with data:`, telegramUserData)

          const { error: userError } = await supabase.rpc(
            'ensure_user_exists',
            {
              user_telegram_id: telegramUserId,
              user_first_name: telegramUserData.firstName || null,
              user_last_name: telegramUserData.lastName || null,
              user_username: telegramUserData.username || null,
            }
          )

          if (userError) {
            console.warn(`⚠️ User creation warning:`, userError.message)
          } else {
            console.log(`✅ User ensured for ${telegramUserId}`)
          }
        }

        // Подготавливаем запись настроения
        const moodEntry = {
          telegram_id: telegramUserId,
          mood: mood,
          mood_date: date.toISOString().split('T')[0], // Только дата без времени
          note: note,
          intensity: intensity,
          created_at: new Date().toISOString(),
        }

        console.log(`🔍 ОТЛАДКА: Сохраняем mood entry:`, moodEntry)

        // Сохраняем в базу данных (upsert для избежания дублей)
        const { data, error } = await supabase
          .from('mood_entries')
          .upsert(moodEntry, {
            onConflict: 'telegram_id,mood_date',
          })
          .select()

        if (error) {
          throw new Error(`Supabase mood insert failed: ${error.message}`)
        }

        // Обновляем кэшированную статистику пользователя
        await updateUserStatsCache(supabase, telegramUserId)

        console.log(`✅ Mood saved to Supabase for user ${telegramUserId}`)
        return true
      } catch (supabaseError) {
        console.error(`❌ Supabase mood save failed:`, supabaseError.message)
        return false
      }
    }

    // 🔄 Fallback: просто логируем для разработки
    console.log(`📝 Mood recorded (no database):`, {
      telegramUserId,
      mood,
      date: date.toISOString(),
      note,
    })

    return true
  } catch (error) {
    console.error('Error recording mood:', error)
    return false
  }
}

/**
 * 📊 Обновляет кэшированную статистику пользователя после записи настроения
 * @param {Object} supabase - Клиент Supabase
 * @param {number} telegramUserId - ID пользователя
 */
async function updateUserStatsCache(supabase, telegramUserId) {
  try {
    // Получаем текущую статистику из функции БД
    const { data: stats, error } = await supabase.rpc('get_user_stats', {
      user_telegram_id: telegramUserId,
    })

    if (error) {
      console.warn(`⚠️ Stats update warning:`, error.message)
      return
    }

    if (stats && stats.length > 0) {
      const userStats = stats[0]

      // Обновляем кэшированные поля в таблице users
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_days: userStats.total_days,
          current_streak: userStats.current_streak,
          longest_streak: userStats.longest_streak,
          total_elements: userStats.total_elements,
          rare_elements_found: userStats.rare_elements_found,
          updated_at: new Date().toISOString(),
        })
        .eq('telegram_id', telegramUserId)

      if (updateError) {
        console.warn(`⚠️ User stats cache update warning:`, updateError.message)
      } else {
        console.log(`📊 Updated stats cache for user ${telegramUserId}`)
      }
    }
  } catch (error) {
    console.warn(`⚠️ Stats cache update failed:`, error.message)
  }
}

/**
 * API handler для записи настроения пользователя
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // 🔍 ОТЛАДКА: Логируем все входящие запросы
  console.log('🔍 API /mood/record called:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString(),
  })

  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramUserId, mood, date, note, intensity, telegramUserData } =
      req.body

    // Валидация входных данных
    if (!telegramUserId || typeof telegramUserId !== 'number') {
      return res
        .status(400)
        .json({ error: 'telegramUserId (number) is required' })
    }

    if (!mood || typeof mood !== 'string') {
      return res.status(400).json({ error: 'mood (string) is required' })
    }

    // Проверяем валидность настроения
    const validMoods = ['joy', 'calm', 'stress', 'sadness', 'anger', 'anxiety']
    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        error: 'Invalid mood value',
        validMoods: validMoods,
      })
    }

    // Получаем дату записи
    const recordDate = date ? new Date(date) : new Date()

    // Проверяем валидность даты
    if (isNaN(recordDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    console.log(`Recording mood for Telegram user ${telegramUserId}:`, {
      mood,
      date: recordDate.toISOString(),
    })

    // Сохраняем запись настроения
    const saved = await saveMoodRecord(
      telegramUserId,
      mood,
      recordDate,
      note,
      intensity,
      telegramUserData
    )

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save mood record',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        telegramUserId,
        mood,
        date: recordDate,
        recorded: true,
      },
      message: 'Mood recorded successfully',
    })
  } catch (error) {
    console.error('Error recording mood:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

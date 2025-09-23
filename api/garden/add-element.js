/**
 * API эндпоинт для добавления элемента сада
 * POST /api/garden/add-element
 * Body: { telegramId: number, element: { type, position, unlockDate, mood, rarity } }
 */

/**
 * 🗄️ SUPABASE: Сохраняет элемент сада в базу данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {Object} element - Элемент сада
 * @returns {Promise<boolean>} Успешность сохранения
 */
async function saveGardenElement(telegramUserId, element) {
  try {
    console.log(
      `🌱 Saving garden element to Supabase for user ${telegramUserId}:`,
      element
    )

    // 🗄️ SUPABASE для всех окружений
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Динамический импорт для совместимости
        const { createClient } = await import('@supabase/supabase-js')

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // Подготавливаем запись элемента сада
        const gardenEntry = {
          telegram_id: telegramUserId,
          element_type: element.type,
          position_x: element.position.x,
          position_y: element.position.y,
          rarity: element.rarity,
          mood_influence: element.mood, // ✅ ИСПРАВЛЕНО: mood_influence, не mood_when_unlocked
          unlock_date: element.unlockDate,
          created_at: new Date().toISOString(),
        }

        // Сохраняем в базу данных
        const { data, error } = await supabase
          .from('garden_elements')
          .insert(gardenEntry)
          .select()

        if (error) {
          throw new Error(`Supabase garden insert failed: ${error.message}`)
        }

        // Обновляем кэшированную статистику пользователя
        await updateUserStatsCache(supabase, telegramUserId)

        console.log(
          `✅ Garden element saved to Supabase for user ${telegramUserId}`
        )
        return true
      } catch (supabaseError) {
        console.error(`❌ Supabase garden save failed:`, supabaseError.message)
        return false
      }
    }

    // 🔄 Fallback: просто логируем для разработки
    console.log(`📝 Garden element recorded (no database):`, {
      telegramUserId,
      element,
    })

    return true
  } catch (error) {
    console.error('Error saving garden element:', error)
    return false
  }
}

/**
 * 📊 Обновляет кэшированную статистику пользователя после добавления элемента
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
 * API handler для добавления элемента сада
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // 🔍 ОТЛАДКА: Логируем все входящие запросы
  console.log('🔍 API /garden/add-element called:', {
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
    const { telegramId, element } = req.body

    // Валидация входных данных
    if (!telegramId || typeof telegramId !== 'number') {
      return res.status(400).json({ error: 'telegramId (number) is required' })
    }

    if (!element || typeof element !== 'object') {
      return res.status(400).json({ error: 'element (object) is required' })
    }

    // Валидация элемента сада
    if (
      !element.type ||
      !element.position ||
      !element.rarity ||
      !element.mood
    ) {
      return res.status(400).json({
        error: 'element must contain: type, position, rarity, mood',
      })
    }

    console.log(
      `Adding garden element for Telegram user ${telegramId}:`,
      element
    )

    // Сохраняем элемент сада
    const saved = await saveGardenElement(telegramId, element)

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save garden element',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        telegramId,
        element,
        saved: true,
      },
      message: 'Garden element saved successfully',
    })
  } catch (error) {
    console.error('Error saving garden element:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

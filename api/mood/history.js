/**
 * API эндпоинт для получения истории настроений пользователя
 * GET /api/mood/history?telegramId=number
 */

/**
 * 🗄️ SUPABASE: Получает историю настроений пользователя из базы данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @returns {Promise<Array>} История настроений
 */
async function getMoodHistory(telegramUserId) {
  try {
    console.log(
      `📖 Loading mood history from Supabase for user ${telegramUserId}`
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

        // Получаем историю настроений
        const { data, error } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('telegram_id', telegramUserId)
          .order('mood_date', { ascending: false })

        if (error) {
          throw new Error(
            `Supabase mood history fetch failed: ${error.message}`
          )
        }

        console.log(
          `✅ Loaded ${data.length} mood entries for user ${telegramUserId}`
        )
        return data || []
      } catch (supabaseError) {
        console.error(
          `❌ Supabase mood history load failed:`,
          supabaseError.message
        )
        return []
      }
    }

    // 🔄 Fallback: возвращаем пустой массив
    console.log(`📝 No database connection - returning empty mood history`)
    return []
  } catch (error) {
    console.error('Error loading mood history:', error)
    return []
  }
}

/**
 * API handler для получения истории настроений
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // 🔍 ОТЛАДКА: Логируем все входящие запросы
  console.log('🔍 API /mood/history called:', {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString(),
  })

  // Проверяем метод запроса
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId } = req.query

    // Валидация входных данных
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' })
    }

    const telegramUserId = parseInt(telegramId, 10)
    if (isNaN(telegramUserId)) {
      return res.status(400).json({ error: 'telegramId must be a number' })
    }

    console.log(`Loading mood history for Telegram user ${telegramUserId}`)

    // Получаем историю настроений
    const moodHistory = await getMoodHistory(telegramUserId)

    res.status(200).json({
      success: true,
      data: {
        telegramId: telegramUserId,
        moodHistory: moodHistory,
        count: moodHistory.length,
      },
      message: 'Mood history loaded successfully',
    })
  } catch (error) {
    console.error('Error loading mood history:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

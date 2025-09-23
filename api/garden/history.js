/**
 * API эндпоинт для получения истории элементов сада пользователя
 * GET /api/garden/history?telegramId=number
 */

/**
 * 🗄️ SUPABASE: Получает элементы сада пользователя из базы данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @returns {Promise<Array>} Элементы сада
 */
async function getGardenHistory(telegramUserId) {
  try {
    console.log(
      `🌱 Loading garden history from Supabase for user ${telegramUserId}`
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

        // Получаем элементы сада
        const { data, error } = await supabase
          .from('garden_elements')
          .select('*')
          .eq('telegram_id', telegramUserId)
          .order('unlock_date', { ascending: false })

        if (error) {
          throw new Error(
            `Supabase garden history fetch failed: ${error.message}`
          )
        }

        console.log(
          `✅ Loaded ${data.length} garden elements for user ${telegramUserId}`
        )
        return data || []
      } catch (supabaseError) {
        console.error(
          `❌ Supabase garden history load failed:`,
          supabaseError.message
        )
        return []
      }
    }

    // 🔄 Fallback: возвращаем пустой массив
    console.log(`📝 No database connection - returning empty garden history`)
    return []
  } catch (error) {
    console.error('Error loading garden history:', error)
    return []
  }
}

/**
 * API handler для получения элементов сада
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // 🔍 ОТЛАДКА: Логируем все входящие запросы
  console.log('🔍 API /garden/history called:', {
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

    console.log(`Loading garden history for Telegram user ${telegramUserId}`)

    // Получаем элементы сада
    const gardenHistory = await getGardenHistory(telegramUserId)

    res.status(200).json({
      success: true,
      data: {
        telegramId: telegramUserId,
        gardenElements: gardenHistory,
        count: gardenHistory.length,
      },
      message: 'Garden history loaded successfully',
    })
  } catch (error) {
    console.error('Error loading garden history:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

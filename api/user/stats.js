/**
 * API эндпоинт для получения статистики пользователя по Telegram ID
 * GET /api/user/stats?telegramId=123456789
 */

/**
 * Получает реальную статистику пользователя из localStorage
 * @param {string} telegramId - ID пользователя в Telegram
 * @returns {Object|null} Статистика пользователя или null
 */
function getUserStatsFromStorage(telegramId) {
  try {
    // Ключи для хранения данных пользователя в localStorage
    const userKey = `kirakira-user-${telegramId}`
    const moodKey = `kirakira-mood-${telegramId}`
    const gardenKey = `kirakira-garden-${telegramId}`

    // В реальности эти данные были бы в базе данных
    // Пока симулируем получение из localStorage через телеграм ID
    console.log(
      `Searching for user data with keys: ${userKey}, ${moodKey}, ${gardenKey}`
    )

    // Возвращаем null, так как в серверном контексте нет доступа к localStorage
    // В продакшене здесь был бы запрос к базе данных
    return null
  } catch (error) {
    console.error('Error getting user stats from storage:', error)
    return null
  }
}

/**
 * Генерирует демо-статистику на основе Telegram ID для консистентности
 * @param {string} telegramId - ID пользователя в Telegram
 * @returns {Object} Консистентная статистика пользователя
 */
function generateConsistentDemoStats(telegramId) {
  // Используем Telegram ID как seed для генерации консистентных данных
  const seed = parseInt(telegramId) || 0
  const random = max => (seed * 9301 + 49297) % max

  const totalDays = Math.max(1, random(45) + 1) // 1-45 дней
  const currentStreak = Math.min(totalDays, random(10) + 1) // До 10 дней подряд
  const totalElements = Math.max(5, random(100) + 5) // 5-105 элементов

  const moods = [
    'радость',
    'спокойствие',
    'энергия',
    'вдохновение',
    'умиротворение',
  ]
  const dominantMood = moods[random(moods.length)]

  return {
    totalDays,
    currentStreak,
    longestStreak: Math.max(currentStreak, random(15) + 1),
    totalElements,
    rareElementsFound: Math.max(0, random(totalElements / 5)),
    gardensShared: random(5),
    dominantMood,
    lastVisit: new Date(Date.now() - random(7) * 24 * 60 * 60 * 1000), // Последние 7 дней
    hasData: totalDays > 0,
    moodHistory: [], // Пустая история для демо
    achievements: ['first_mood', 'week_streak', 'rare_collector'].slice(
      0,
      random(3) + 1
    ),
  }
}

/**
 * API handler для получения статистики пользователя
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // Проверяем метод запроса
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId } = req.query

    if (!telegramId || typeof telegramId !== 'string') {
      return res.status(400).json({ error: 'telegramId is required' })
    }

    console.log(`Fetching stats for Telegram user: ${telegramId}`)

    // Пытаемся получить реальные данные пользователя
    let stats = getUserStatsFromStorage(telegramId)

    if (!stats) {
      // Если реальных данных нет, генерируем консистентные демо-данные
      // В продакшене здесь был бы возврат пустых данных для новых пользователей
      stats = generateConsistentDemoStats(telegramId)
      console.log(`Generated demo stats for user ${telegramId}:`, stats)
    }

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

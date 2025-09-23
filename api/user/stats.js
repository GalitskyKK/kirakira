/**
 * API эндпоинт для получения статистики пользователя по Telegram ID
 * GET /api/user/stats?telegramId=123456789
 */

/**
 * ИСПРАВЛЕННЫЙ ПОДХОД: API будет получать данные от самого приложения
 * Статистика вычисляется на основе реальных пользовательских данных
 * @param {string} telegramId - ID пользователя в Telegram
 * @param {Object} userData - Данные пользователя от приложения (опционально)
 * @returns {Promise<Object|null>} Статистика пользователя или null
 */
async function getUserRealStats(telegramId, userData = null) {
  try {
    console.log(`Computing REAL stats for Telegram user: ${telegramId}`)

    // Если данные переданы от приложения - используем их
    if (userData) {
      console.log(`Using provided user data for ${telegramId}`)
      return computeStatsFromUserData(userData)
    }

    // TODO: В будущем здесь будет запрос к базе данных
    // const userRecord = await db.users.findByTelegramId(telegramId)
    // const moods = await db.moods.findByUserId(userRecord.id)
    // const garden = await db.gardens.findByUserId(userRecord.id)

    console.log(
      `No data provided for user ${telegramId} - returning new user stats`
    )
    return null
  } catch (error) {
    console.error('Error getting real user stats:', error)
    return null
  }
}

/**
 * Вычисляет статистику на основе реальных данных пользователя
 */
function computeStatsFromUserData(userData) {
  try {
    const { user, moods = [], garden = {} } = userData

    // Вычисляем реальную статистику
    const now = new Date()
    const registrationDate = user?.registrationDate
      ? new Date(user.registrationDate)
      : now
    const totalDays = Math.max(
      0,
      Math.ceil((now - registrationDate) / (1000 * 60 * 60 * 24))
    )

    // Подсчитываем серию дней из реальных записей настроений
    let currentStreak = 0
    let longestStreak = 0

    if (moods.length > 0) {
      const sortedMoods = moods.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )
      let streak = 0
      let maxStreak = 0
      let lastDate = null

      for (const mood of sortedMoods) {
        const moodDate = new Date(mood.date)
        moodDate.setHours(0, 0, 0, 0)

        if (!lastDate) {
          streak = 1
          lastDate = moodDate
        } else {
          const dayDiff = Math.ceil(
            (lastDate - moodDate) / (1000 * 60 * 60 * 24)
          )

          if (dayDiff === 1) {
            streak++
          } else {
            if (streak > maxStreak) maxStreak = streak
            streak = 1
          }

          lastDate = moodDate
        }
      }

      currentStreak = streak
      longestStreak = Math.max(maxStreak, streak)
    }

    // Подсчитываем элементы сада
    const gardenElements = garden.elements || []
    const totalElements = gardenElements.length
    const rareElementsFound = gardenElements.filter(el =>
      [
        'rainbow_flower',
        'glowing_crystal',
        'mystic_mushroom',
        'aurora_tree',
      ].includes(el.type)
    ).length

    // Определяем доминирующее настроение
    const moodCounts = {}
    moods.forEach(mood => {
      moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1
    })

    const dominantMoodKey = Object.keys(moodCounts).reduce(
      (a, b) => (moodCounts[a] > moodCounts[b] ? a : b),
      'calm'
    )

    const realStats = {
      totalDays,
      currentStreak,
      longestStreak,
      totalElements,
      rareElementsFound, // ЦЕЛОЕ ЧИСЛО, не дробное!
      gardensShared: user?.stats?.gardensShared || 0,
      dominantMood: translateMood(dominantMoodKey),
      lastVisit: new Date(),
      hasData: totalDays > 0 || moods.length > 0,
      moodHistory: moods.slice(0, 10), // Последние 10 записей
      achievements: calculateAchievements(
        totalDays,
        currentStreak,
        totalElements,
        rareElementsFound
      ),
    }

    console.log(`Real stats computed:`, realStats)
    return realStats
  } catch (error) {
    console.error('Error computing stats from user data:', error)
    return null
  }
}

/**
 * Переводит настроение на русский язык
 */
function translateMood(mood) {
  const translations = {
    joy: 'радость',
    calm: 'спокойствие',
    stress: 'стресс',
    sadness: 'грусть',
    anger: 'гнев',
    anxiety: 'тревога',
  }
  return translations[mood] || mood
}

/**
 * Вычисляет достижения пользователя
 */
function calculateAchievements(
  totalDays,
  currentStreak,
  totalElements,
  rareElements
) {
  const achievements = []

  if (totalDays >= 1) achievements.push('first_day')
  if (currentStreak >= 7) achievements.push('week_streak')
  if (currentStreak >= 30) achievements.push('month_streak')
  if (totalElements >= 10) achievements.push('garden_starter')
  if (totalElements >= 50) achievements.push('garden_master')
  if (rareElements >= 1) achievements.push('rare_collector')
  if (rareElements >= 5) achievements.push('rare_master')

  return achievements
}

/**
 * Возвращает дефолтную статистику для новых пользователей
 * @returns {Object} Пустая статистика для новых пользователей
 */
function getNewUserStats() {
  return {
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalElements: 0,
    rareElementsFound: 0,
    gardensShared: 0,
    dominantMood: 'спокойствие',
    lastVisit: new Date(),
    hasData: false,
    moodHistory: [],
    achievements: [],
  }
}

/**
 * API handler для получения статистики пользователя
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // Поддерживаем GET (новые пользователи) и POST (с данными приложения)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId } = req.query

    if (!telegramId || typeof telegramId !== 'string') {
      return res.status(400).json({ error: 'telegramId is required' })
    }

    console.log(`Fetching REAL stats for Telegram user: ${telegramId}`)

    // Проверяем, передал ли приложение пользовательские данные в POST запросе
    let userData = null
    if (req.method === 'POST' && req.body) {
      userData = req.body
      console.log(`POST request with user data for ${telegramId}`)
    }

    // Получаем РЕАЛЬНЫЕ данные пользователя
    let stats = await getUserRealStats(telegramId, userData)

    if (!stats) {
      // Для новых пользователей возвращаем нулевую статистику, НЕ фейковые данные
      stats = getNewUserStats()
      console.log(`New user ${telegramId} - returning zero stats`)
    } else {
      console.log(`Real stats computed for user ${telegramId}:`, stats)
    }

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      source: stats.hasData ? 'real_data' : 'new_user',
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

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

    // 🔥 РЕАЛЬНАЯ ИНТЕГРАЦИЯ: Получаем данные пользователя по telegramId
    console.log(`Getting real user data by telegramId: ${telegramId}`)

    const userDataFromStorage = await getUserDataByTelegramId(telegramId)

    if (userDataFromStorage) {
      console.log(`✅ Found real data for user ${telegramId}`)
      return computeStatsFromUserData(userDataFromStorage)
    }

    console.log(
      `📝 No data found for user ${telegramId} - returning new user stats`
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
 * 🔥 ПОЛУЧАЕТ РЕАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ по telegramId
 * Интегрируется с серверным хранилищем для синхронизации с CloudStorage
 * @param {string} telegramId - ID пользователя в Telegram
 * @returns {Promise<Object|null>} Данные пользователя или null
 */
async function getUserDataByTelegramId(telegramId) {
  try {
    // 🚀 РЕАЛЬНАЯ ИНТЕГРАЦИЯ: Пытаемся получить данные из серверного хранилища

    // Пока используем простое решение - временное хранилище в памяти
    const userData = await getFromServerStorage(telegramId)

    if (userData) {
      return userData
    }

    // ❌ НЕ ГЕНЕРИРУЕМ ФЕЙКОВЫЕ ДАННЫЕ ДЛЯ РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЕЙ!
    // Для новых пользователей просто возвращаем null
    console.log(`👤 User ${telegramId} is truly new - no fake data generation`)

    // Можно создать базовую запись пользователя без фейковых настроений
    const newUserRecord = {
      user: {
        id: `tg_${telegramId}`,
        telegramId: parseInt(telegramId),
        registrationDate: new Date().toISOString(),
        lastVisitDate: new Date().toISOString(),
        isAnonymous: false,
        stats: {
          firstVisit: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          totalDays: 0,
          currentStreak: 0,
          longestStreak: 0,
          gardensShared: 0,
        },
      },
      moods: [], // ✅ ПУСТОЙ массив настроений!
      garden: {
        elements: [], // ✅ ПУСТОЙ сад!
      },
    }

    // Сохраняем только базовую запись пользователя
    await saveToServerStorage(telegramId, newUserRecord)

    return null
  } catch (error) {
    console.error(`Error getting user data for ${telegramId}:`, error)
    return null
  }
}

/**
 * 🗄️ SUPABASE: Получает данные пользователя из базы данных
 * @param {string} telegramId - ID пользователя в Telegram
 * @returns {Promise<Object|null>} Данные пользователя или null
 */
async function getFromServerStorage(telegramId) {
  try {
    // 🗄️ SUPABASE для всех окружений
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Динамический импорт для совместимости
        const { createClient } = await import('@supabase/supabase-js')

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // Получаем пользователя
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramId)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          // PGRST116 = not found
          throw userError
        }

        if (!user) {
          console.log(`👤 User ${telegramId} not found in Supabase`)
          return null
        }

        // Получаем настроения пользователя
        const { data: moods, error: moodsError } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('telegram_id', telegramId)
          .order('mood_date', { ascending: false })

        if (moodsError) {
          console.warn(
            `⚠️ Error fetching moods for ${telegramId}:`,
            moodsError.message
          )
        }

        // Получаем элементы сада
        const { data: gardenElements, error: gardenError } = await supabase
          .from('garden_elements')
          .select('*')
          .eq('telegram_id', telegramId)
          .order('unlock_date', { ascending: false })

        if (gardenError) {
          console.warn(
            `⚠️ Error fetching garden for ${telegramId}:`,
            gardenError.message
          )
        }

        // Формируем объект данных в формате приложения
        const userData = {
          user: {
            id: user.user_id,
            telegramId: parseInt(telegramId),
            registrationDate: user.registration_date,
            lastVisitDate: user.last_visit_date,
            isAnonymous: user.is_anonymous || false,
            stats: {
              firstVisit: user.registration_date,
              lastVisit: user.last_visit_date,
              totalDays: user.total_days || 0,
              currentStreak: user.current_streak || 0,
              longestStreak: user.longest_streak || 0,
              gardensShared: user.gardens_shared || 0,
            },
          },
          moods: (moods || []).map(mood => ({
            id: mood.id,
            mood: mood.mood,
            date: mood.mood_date,
            telegramUserId: mood.telegram_id,
            createdAt: mood.created_at,
            note: mood.note,
          })),
          garden: {
            elements: (gardenElements || []).map(element => ({
              id: element.id,
              type: element.element_type,
              position: { x: element.position_x, y: element.position_y },
              unlockDate: element.unlock_date,
              moodInfluence: element.mood_influence,
              rarity: element.rarity,
              createdAt: element.created_at,
            })),
          },
        }

        console.log(`📂 Found user data in Supabase for ${telegramId}`)
        return userData
      } catch (supabaseError) {
        console.warn(
          `Supabase unavailable, falling back to temp storage:`,
          supabaseError.message
        )
      }
    }

    // 🔄 Fallback: временное хранилище для разработки
    if (!global.kirakiraTempStorage) {
      global.kirakiraTempStorage = new Map()
    }

    const userData = global.kirakiraTempStorage.get(telegramId)

    if (userData) {
      console.log(`📂 Found cached data in temp storage for user ${telegramId}`)
      return userData
    }

    return null
  } catch (error) {
    console.error(`Error reading storage for ${telegramId}:`, error)
    return null
  }
}

/**
 * 🗄️ SUPABASE: Сохраняет данные пользователя в базу данных
 * @param {string} telegramId - ID пользователя в Telegram
 * @param {Object} userData - Данные для сохранения
 */
async function saveToServerStorage(telegramId, userData) {
  try {
    // 🗄️ SUPABASE для всех окружений
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Динамический импорт для совместимости
        const { createClient } = await import('@supabase/supabase-js')

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        const { user, moods = [], garden = {} } = userData

        // 1. Сохраняем/обновляем пользователя
        const { error: userError } = await supabase.from('users').upsert(
          {
            telegram_id: parseInt(telegramId),
            user_id: user.id,
            username: user.username || null,
            first_name: user.firstName || null,
            last_name: user.lastName || null,
            registration_date: user.registrationDate,
            last_visit_date: user.lastVisitDate || new Date().toISOString(),
            is_anonymous: user.isAnonymous || false,
            onboarding_completed: true,
            // Кэшируем статистику для быстрого доступа
            total_days: user.stats?.totalDays || 0,
            current_streak: user.stats?.currentStreak || 0,
            longest_streak: user.stats?.longestStreak || 0,
            gardens_shared: user.stats?.gardensShared || 0,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'telegram_id',
          }
        )

        if (userError) {
          throw new Error(`User upsert failed: ${userError.message}`)
        }

        // 2. Сохраняем настроения (только новые)
        if (moods.length > 0) {
          const moodEntries = moods.map(mood => ({
            telegram_id: parseInt(telegramId),
            mood: mood.mood,
            mood_date: mood.date.split('T')[0], // Только дата без времени
            note: mood.note || null,
            created_at: mood.createdAt || new Date().toISOString(),
          }))

          const { error: moodsError } = await supabase
            .from('mood_entries')
            .upsert(moodEntries, {
              onConflict: 'telegram_id,mood_date',
            })

          if (moodsError) {
            console.warn(`⚠️ Moods upsert warning: ${moodsError.message}`)
          }
        }

        // 3. Сохраняем элементы сада (только новые)
        if (garden.elements && garden.elements.length > 0) {
          const gardenEntries = garden.elements.map(element => ({
            telegram_id: parseInt(telegramId),
            element_type: element.type,
            rarity: element.rarity || 'common',
            position_x: element.position?.x || 50,
            position_y: element.position?.y || 50,
            mood_influence: element.moodInfluence || null,
            unlock_date: element.unlockDate || new Date().toISOString(),
            created_at: element.createdAt || new Date().toISOString(),
          }))

          // Используем insert ignore чтобы не дублировать элементы
          const { error: gardenError } = await supabase
            .from('garden_elements')
            .insert(gardenEntries)
            .select()

          if (gardenError && !gardenError.message.includes('duplicate')) {
            console.warn(
              `⚠️ Garden elements insert warning: ${gardenError.message}`
            )
          }
        }

        console.log(`✅ Saved user data for ${telegramId} to Supabase`)
        return
      } catch (supabaseError) {
        console.warn(
          `Supabase save failed, falling back to temp storage:`,
          supabaseError.message
        )
      }
    }

    // 🔄 Fallback: временное хранилище для разработки
    if (!global.kirakiraTempStorage) {
      global.kirakiraTempStorage = new Map()
    }

    global.kirakiraTempStorage.set(telegramId, userData)
    console.log(`✅ Saved user data for ${telegramId} to temp storage`)
  } catch (error) {
    console.error(`❌ Failed to save user data for ${telegramId}:`, error)
  }
}

// ❌ ФУНКЦИЯ УДАЛЕНА: generateTelegramUserData()
// Больше не генерируем фейковые данные для реальных пользователей!
// Новые пользователи начинают с пустыми данными и сами заполняют свой сад.

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
    hasData: false, // ✅ Явно указываем что данных нет
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
      // 📝 Новый пользователь без истории - возвращаем нулевую статистику
      stats = getNewUserStats()
      console.log(`📝 New user ${telegramId} - returning zero stats`)
    } else {
      console.log(`✅ Real stats computed for user ${telegramId}:`, stats)
    }

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        hasData: stats.hasData || false, // Убеждаемся что hasData всегда есть
      },
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

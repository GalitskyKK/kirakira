/**
 * 👤 ОБЪЕДИНЕННЫЙ API ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
 * Включает: stats, update-photo
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
async function getUserDataFromSupabase(telegramId) {
  try {
    const supabase = await getSupabaseClient()

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

    // Вычисляем streak настроений - ИСПРАВЛЕННАЯ ЛОГИКА
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    if (moods.length > 0) {
      const sortedMoods = moods.sort(
        (a, b) => new Date(b.mood_date) - new Date(a.mood_date)
      )

      console.log(
        `🔍 STREAK DEBUG: Анализ ${sortedMoods.length} записей настроений`
      )

      // Проверяем текущий streak - ИСПРАВЛЕННАЯ ЛОГИКА
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0) // Используем UTC для корректного сравнения дат

      // Проверяем есть ли запись за сегодня или вчера для активного стрика
      const lastMoodDate = new Date(sortedMoods[0].mood_date)
      lastMoodDate.setUTCHours(0, 0, 0, 0)

      const daysSinceLastMood = Math.floor(
        (today - lastMoodDate) / (1000 * 60 * 60 * 24)
      )
      console.log(
        `🔍 STREAK DEBUG: Последняя запись ${lastMoodDate.toISOString().split('T')[0]}, дней назад: ${daysSinceLastMood}`
      )

      // Стрик активен если последняя запись была сегодня или вчера
      if (daysSinceLastMood <= 1) {
        currentStreak = 1
        console.log(`🔍 STREAK DEBUG: Стрик активен, начинаем с 1`)

        // Считаем последовательные дни назад
        for (let i = 1; i < sortedMoods.length; i++) {
          const currentMoodDate = new Date(sortedMoods[i - 1].mood_date)
          const prevMoodDate = new Date(sortedMoods[i].mood_date)

          currentMoodDate.setUTCHours(0, 0, 0, 0)
          prevMoodDate.setUTCHours(0, 0, 0, 0)

          const daysDiff = Math.floor(
            (currentMoodDate - prevMoodDate) / (1000 * 60 * 60 * 24)
          )
          console.log(
            `🔍 STREAK DEBUG: Сравниваем ${currentMoodDate.toISOString().split('T')[0]} и ${prevMoodDate.toISOString().split('T')[0]}, разница: ${daysDiff} дней`
          )

          if (daysDiff === 1) {
            currentStreak++
            console.log(`🔍 STREAK DEBUG: Стрик увеличен до ${currentStreak}`)
          } else {
            console.log(
              `🔍 STREAK DEBUG: Стрик прерван, разница ${daysDiff} дней`
            )
            break
          }
        }
      } else {
        console.log(
          `🔍 STREAK DEBUG: Стрик неактивен, последняя запись ${daysSinceLastMood} дней назад`
        )
        currentStreak = 0
      }

      // Вычисляем самый длинный streak
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
      userDataParsed = await getUserDataFromSupabase(telegramId)
    }

    let stats
    if (userDataParsed) {
      console.log(`✅ Found real data for user ${telegramId}`)
      stats = computeStatsFromUserData(userDataParsed)
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

    // Проверяем существует ли пользователь и есть ли у него уже фото
    const supabase = await getSupabaseClient()
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
      case 'stats':
        return await handleStats(req, res)
      case 'update-photo':
        return await handleUpdatePhoto(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: stats, update-photo`,
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

/**
 * 📢 ОБЪЕДИНЕННАЯ СИСТЕМА УВЕДОМЛЕНИЙ KIRAKIRA
 *
 * 🎯 ОПТИМИЗИРОВАНО ДЛЯ VERCEL HOBBY ПЛАНА (1 cron job в день)
 *
 * Отправляет персонализированные уведомления пользователям:
 * - Напоминания об отметке настроения (стандартные)
 * - Уведомления о потере стрика
 * - Напоминания о возвращении при неактивности
 * - Мотивационные сообщения
 * - Умные персонализированные уведомления на базе ИИ-анализа
 *
 * 📅 Запуск: Каждый день в 11:00 МСК (08:00 UTC)
 * 🎯 Логика: Приоритетная отправка (1 уведомление на пользователя в день)
 *
 * Поддерживает два режима:
 * ?type=standard - обычные уведомления (по умолчанию)
 * ?type=smart - умные уведомления с анализом паттернов
 */

// Типы уведомлений
const NOTIFICATION_TYPES = {
  DAILY_MOOD_REMINDER: 'daily_mood_reminder',
  STREAK_LOST: 'streak_lost',
  INACTIVITY_RETURN: 'inactivity_return',
  STREAK_MILESTONE: 'streak_milestone',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  WEEKLY_MOTIVATION: 'weekly_motivation',
}

// Приоритеты уведомлений (для Hobby плана Vercel - 1 запуск в день)
const NOTIFICATION_PRIORITIES = {
  [NOTIFICATION_TYPES.INACTIVITY_RETURN]: {
    priority: 1,
    condition: 'inactive_3_or_7_days',
  },
  [NOTIFICATION_TYPES.STREAK_LOST]: {
    priority: 2,
    condition: 'streak_broken_yesterday',
  },
  [NOTIFICATION_TYPES.WEEKLY_MOTIVATION]: {
    priority: 3,
    condition: 'streak_7_plus_monday',
  },
  [NOTIFICATION_TYPES.DAILY_MOOD_REMINDER]: {
    priority: 4,
    condition: 'no_mood_today',
  },
}

// Расписание: Каждый день в 08:00 UTC (11:00 МСК) - оптимальное время
const NOTIFICATION_TIME = {
  utc: '09:00',
  moscow: '12:00',
  schedule: '0 9 * * *', // Vercel cron format
}

// Конфигурация
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.VITE_APP_URL || 'https://kirakiragarden.ru'

/**
 * Получает всех активных пользователей для уведомлений
 *
 * ⚠️ АДМИНИСТРАТИВНАЯ ОПЕРАЦИЯ: Использует SERVICE_ROLE_KEY
 * Это правильно для CRON задач, которые работают от имени системы
 */
async function getActiveUsers() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    // ✅ SERVICE_ROLE_KEY правильно для CRON задач (минует RLS намеренно)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Получаем пользователей с включенными уведомлениями
    const { data: users, error } = await supabase
      .from('users')
      .select(
        `
        telegram_id,
        first_name,
        username,
        registration_date,
        last_visit_date,
        notification_settings,
        created_at
      `
      )
      .not('telegram_id', 'is', null)
      .order('last_visit_date', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch users:', error)
      return []
    }

    console.log(`📊 Found ${users.length} total users`)

    // Фильтруем пользователей с включенными уведомлениями
    const activeUsers = users.filter(user => {
      const settings = user.notification_settings || {}
      return settings.enabled !== false && settings.dailyReminder !== false
    })

    console.log(`✅ ${activeUsers.length} users have notifications enabled`)
    return activeUsers
  } catch (error) {
    console.error('❌ Error fetching active users:', error)
    return []
  }
}

/**
 * Получает пользователей с уже отмеченным настроением на дату
 */
async function getUsersWithMoodOnDate(telegramIds, dateString) {
  if (!telegramIds || telegramIds.length === 0) {
    return new Set()
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('mood_entries')
      .select('telegram_id')
      .in('telegram_id', telegramIds)
      .eq('mood_date', dateString)

    if (error) {
      console.error('❌ Failed to fetch mood entries for date:', error)
      return new Set()
    }

    return new Set((data || []).map(entry => entry.telegram_id))
  } catch (error) {
    console.error('❌ Error fetching mood entries for date:', error)
    return new Set()
  }
}

/**
 * Проверяет отметил ли пользователь настроение сегодня
 */
async function checkMoodToday(telegramUserId, todayDateString) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('telegram_id', telegramUserId)
      .eq('mood_date', todayDateString)
      .limit(1)

    if (error) {
      console.error(
        `❌ Failed to check mood for user ${telegramUserId}:`,
        error
      )
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error(`❌ Error checking mood for user ${telegramUserId}:`, error)
    return false
  }
}

/**
 * Получает статистику пользователя
 */
async function getUserMoodStats(telegramUserId) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    const response = await fetch(
      `${MINI_APP_URL}/api/profile?action=get_profile&telegramId=${telegramUserId}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    return result.success && result.data?.stats ? result.data.stats : null
  } catch (error) {
    console.warn(`⚠️ Failed to get stats for user ${telegramUserId}:`, error)
    return null
  }
}

/**
 * Отправляет сообщение пользователю
 */
async function sendNotification(chatId, message, options = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

  const params = {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...options,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error(`❌ Failed to send notification to ${chatId}:`, result)
      return false
    }

    return true
  } catch (error) {
    console.error(`❌ Error sending notification to ${chatId}:`, error)
    return false
  }
}

/**
 * Создает клавиатуру для быстрых действий
 */
function createQuickActionsKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '😊 Отметить настроение',
          web_app: { url: `${MINI_APP_URL}?tab=mood` },
        },
      ],
      [
        {
          text: '🌱 Мой сад',
          web_app: { url: MINI_APP_URL },
        },
        {
          text: '📊 Статистика',
          web_app: { url: `${MINI_APP_URL}?tab=profile` },
        },
      ],
    ],
  }
}

/**
 * УВЕДОМЛЕНИЕ: Ежедневное напоминание об отметке настроения
 */
async function sendDailyMoodReminder(user, todayDateString, hasMoodToday) {
  if (hasMoodToday) {
    console.log(`✅ User ${user.telegram_id} already marked mood today`)
    return false
  }

  const name = user.first_name || 'друг'
  const stats = await getUserMoodStats(user.telegram_id)

  let message = `🌸 Привет, ${name}!

Как дела сегодня? Время отметить свое настроение и вырастить новый элемент в саду! 🌱`

  // Добавляем мотивацию на основе статистики
  if (stats) {
    if (stats.currentStreak > 0) {
      message += `\n\n🔥 Твоя серия: ${stats.currentStreak} ${getDaysWord(stats.currentStreak)}!\nПродолжай - ты молодец! 💪`
    } else if (stats.totalDays > 0) {
      message += `\n\n🌟 У тебя уже ${stats.totalDays} ${getDaysWord(stats.totalDays)} с KiraKira!\nВремя начать новую серию! ✨`
    }
  }

  message += `\n\n_Каждое настроение делает твой сад уникальным!_ 🎨`

  const sent = await sendNotification(user.telegram_id, message, {
    reply_markup: createQuickActionsKeyboard(),
  })

  if (sent) {
    console.log(`📤 Daily reminder sent to ${user.telegram_id} (${name})`)
  }

  return sent
}

/**
 * УВЕДОМЛЕНИЕ: Потеря стрика
 */
async function sendStreakLostNotification(user) {
  const stats = await getUserMoodStats(user.telegram_id)

  if (!stats || stats.currentStreak > 0) {
    return false // Стрик не потерян
  }

  // Проверяем был ли у пользователя стрик раньше
  if (stats.longestStreak < 2) {
    return false // Не было значимого стрика
  }

  const name = user.first_name || 'друг'

  const message = `💔 ${name}, твоя серия прервалась...

Но не расстраивайся! Твой лучший результат ${stats.longestStreak} ${getDaysWord(stats.longestStreak)} никуда не делся! 🏆

🌱 *Начнем новую серию прямо сегодня?*
Отметь свое текущее настроение и посмотри, как твой сад начнет расти снова!

_Помни: каждый день - это новая возможность! ✨_`

  const sent = await sendNotification(user.telegram_id, message, {
    reply_markup: createQuickActionsKeyboard(),
  })

  if (sent) {
    console.log(
      `📤 Streak lost notification sent to ${user.telegram_id} (${name})`
    )
  }

  return sent
}

/**
 * УВЕДОМЛЕНИЕ: Возвращение после неактивности
 */
async function sendInactivityNotification(user, daysInactive) {
  const name = user.first_name || 'друг'
  const stats = await getUserMoodStats(user.telegram_id)

  let message = `🌸 Скучаем по тебе, ${name}!

Ты не заходил в свой эмоциональный сад уже ${daysInactive} ${getDaysWord(daysInactive)}. 🌿`

  if (stats && stats.totalElements > 0) {
    message += `\n\n🌱 Твои ${stats.totalElements} элементов сада ждут тебя!`

    if (stats.longestStreak > 0) {
      message += `\nТвой лучший стрик ${stats.longestStreak} дней показывает, что ты можешь быть постоянным! 💪`
    }
  }

  message += `\n\n_Отметь настроение и продолжи растить свой уникальный сад! ✨_`

  const sent = await sendNotification(user.telegram_id, message, {
    reply_markup: createQuickActionsKeyboard(),
  })

  if (sent) {
    console.log(
      `📤 Inactivity notification sent to ${user.telegram_id} (${name}) - ${daysInactive} days`
    )
  }

  return sent
}

/**
 * УВЕДОМЛЕНИЕ: Мотивационное для хорошего стрика
 */
async function sendWeeklyMotivation(user) {
  const stats = await getUserMoodStats(user.telegram_id)

  if (!stats || stats.currentStreak < 7) {
    return false
  }

  const name = user.first_name || 'друг'

  let message = `🔥 ${name}, ты просто супер!

Твоя серия ${stats.currentStreak} дней впечатляет! 🏆`

  // Разные мотивационные сообщения в зависимости от стрика
  if (stats.currentStreak >= 30) {
    message += `\n\n🌟 Целый месяц постоянства! Ты создал удивительную привычку заботы о себе. Продолжай в том же духе! 💪✨`
  } else if (stats.currentStreak >= 21) {
    message += `\n\n🎯 3 недели - это серьезно! Ты доказал себе, что можешь быть постоянным. Впереди еще больше достижений! 🚀`
  } else if (stats.currentStreak >= 14) {
    message += `\n\n💪 Две недели подряд - отличный результат! Ты на правильном пути к формированию крепкой привычки! 🌱`
  } else {
    message += `\n\n🌟 Неделя+ стабильности - это прекрасное начало! Продолжай заботиться о своих эмоциях! 💚`
  }

  message += `\n\n_Твой эмоциональный сад процветает благодаря твоей заботе! 🌸_`

  const sent = await sendNotification(user.telegram_id, message, {
    reply_markup: createQuickActionsKeyboard(),
  })

  if (sent) {
    console.log(
      `📤 Weekly motivation sent to ${user.telegram_id} (${name}) - ${stats.currentStreak} days streak`
    )
  }

  return sent
}

/**
 * Возвращает правильное склонение слова "день"
 */
function getDaysWord(count) {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder100 >= 11 && remainder100 <= 19) {
    return 'дней'
  }

  if (remainder10 === 1) return 'день'
  if (remainder10 >= 2 && remainder10 <= 4) return 'дня'
  return 'дней'
}

/**
 * Проверяет находится ли время в диапазоне
 */
function isTimeInRange(currentTime, startTime, endTime) {
  return currentTime >= startTime && currentTime <= endTime
}

/**
 * Получает текущее время в МСК
 */
function getMoscowTime() {
  const now = new Date()
  const moscowTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' })
  )
  return moscowTime
}

/**
 * Форматирует время в HH:MM
 */
function formatTime(date) {
  return date.toTimeString().substr(0, 5)
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ: Обработка всех уведомлений
 */
async function processNotifications() {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not configured')
    return { error: 'Bot token not configured' }
  }

  console.log('🔔 Starting notification processing...')

  const moscowTime = getMoscowTime()
  const currentTimeStr = formatTime(moscowTime)
  const todayDateStr = moscowTime.toISOString().split('T')[0] // YYYY-MM-DD
  const isMonday = moscowTime.getDay() === 1

  console.log(
    `🕐 Moscow time: ${currentTimeStr}, Date: ${todayDateStr}, Is Monday: ${isMonday}`
  )

  // Получаем всех активных пользователей
  const users = await getActiveUsers()
  if (users.length === 0) {
    console.log('📭 No active users found')
    return { message: 'No active users' }
  }

  const telegramIds = users
    .map(user => user.telegram_id)
    .filter(telegramId => telegramId)
  const usersWithMoodToday = await getUsersWithMoodOnDate(
    telegramIds,
    todayDateStr
  )

  const results = {
    processed: 0,
    dailyReminders: 0,
    streakLost: 0,
    inactivity: 0,
    weeklyMotivation: 0,
    errors: 0,
  }

  // 🎯 ОПТИМИЗИРОВАННАЯ ЛОГИКА ДЛЯ HOBBY ПЛАНА VERCEL
  // За один запуск в день отправляем ВСЕ релевантные уведомления

  const processUser = async user => {
    try {
      results.processed++
      let sent = false
      let notificationType = ''
      const hasMoodToday = usersWithMoodToday.has(user.telegram_id)

      // Проверяем неактивность (высший приоритет)
      if (user.last_visit_date && !sent) {
        const lastVisit = new Date(user.last_visit_date)
        const daysSinceVisit = Math.floor(
          (moscowTime - lastVisit) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceVisit === 3 || daysSinceVisit === 7) {
          const inactivitySent = await sendInactivityNotification(
            user,
            daysSinceVisit
          )
          if (inactivitySent) {
            results.inactivity++
            sent = true
            notificationType = 'inactivity'
          }
        }
      }

      // Потеря стрика (средний приоритет)
      if (!sent) {
        const streakSent = await sendStreakLostNotification(user)
        if (streakSent) {
          results.streakLost++
          sent = true
          notificationType = 'streak_lost'
        }
      }

      // Еженедельная мотивация (по понедельникам)
      if (isMonday && !sent) {
        const motivationSent = await sendWeeklyMotivation(user)
        if (motivationSent) {
          results.weeklyMotivation++
          sent = true
          notificationType = 'weekly_motivation'
        }
      }

      // Ежедневное напоминание (самый низкий приоритет)
      if (!sent) {
        const reminderSent = await sendDailyMoodReminder(
          user,
          todayDateStr,
          hasMoodToday
        )
        if (reminderSent) {
          results.dailyReminders++
          sent = true
          notificationType = 'daily_reminder'
        }
      }

      // Логируем что отправили
      if (sent) {
        console.log(
          `📤 Sent ${notificationType} to ${user.telegram_id} (${user.first_name})`
        )
      }
    } catch (error) {
      console.error(`❌ Error processing user ${user.telegram_id}:`, error)
      results.errors++
    }
  }

  const runWithConcurrency = async (items, limit, handler) => {
    let index = 0
    const workers = Array.from({ length: limit }, async () => {
      while (index < items.length) {
        const currentIndex = index
        index += 1
        await handler(items[currentIndex])
      }
    })
    await Promise.all(workers)
  }

  // Ограничиваем параллелизм, чтобы уложиться в лимиты Telegram и Vercel
  const CONCURRENCY_LIMIT = 5
  await runWithConcurrency(users, CONCURRENCY_LIMIT, processUser)

  console.log('✅ Notification processing completed:', results)

  return {
    success: true,
    timestamp: new Date().toISOString(),
    moscowTime: currentTimeStr,
    results,
  }
}

/**
 * 🎯 ОБЪЕДИНЕННЫЙ VERCEL FUNCTIONS HANDLER
 * Поддерживает оба типа уведомлений в одном endpoint
 *
 * VERCEL CRON отправляет GET запросы, поэтому обрабатываем оба метода!
 */
export default async function handler(req, res) {
  // Проверяем метод
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Получаем тип уведомлений из query параметра
  const notificationType = req.query.type || 'standard'

  // Проверка статуса только если явно указан параметр status=true
  if (req.method === 'GET' && req.query.status === 'true') {
    return res.status(200).json({
      status: `Notifications system ready (${notificationType})`,
      availableTypes: ['standard', 'smart'],
      botConfigured: !!BOT_TOKEN,
      timestamp: new Date().toISOString(),
      moscowTime: formatTime(getMoscowTime()),
    })
  }

  // Обрабатываем уведомления для GET (Vercel Cron) и POST (ручной запуск)
  try {
    let result

    // Выбираем тип обработки уведомлений
    switch (notificationType) {
      case 'smart':
        console.log('🧠 Processing SMART notifications...')
        result = await processSmartNotifications()
        break
      case 'standard':
      default:
        console.log('🔔 Processing STANDARD notifications...')
        result = await processNotifications()
        break
    }

    res.status(200).json({
      ...result,
      type: notificationType,
      method: req.method,
      triggeredBy: req.method === 'GET' ? 'Vercel Cron' : 'Manual POST',
    })
  } catch (error) {
    console.error('❌ Notifications handler error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      type: notificationType,
    })
  }
}

// ===============================================
// 🧠 УМНЫЕ УВЕДОМЛЕНИЯ (ОБЪЕДИНЕННАЯ ЛОГИКА)
// ===============================================

/**
 * Анализирует паттерны пользователя и определяет лучшее время для уведомлений
 */
async function analyzeUserPatterns(telegramUserId) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Получаем историю настроений за последние 30 дней
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: moodHistory, error } = await supabase
      .from('mood_entries')
      .select('mood_date, created_at, mood')
      .eq('telegram_id', telegramUserId)
      .gte('mood_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('mood_date', { ascending: false })

    if (error) {
      console.warn(
        `Failed to get mood history for user ${telegramUserId}:`,
        error
      )
      return null
    }

    if (!moodHistory || moodHistory.length === 0) {
      return null
    }

    // Анализируем паттерны
    const patterns = {
      userId: telegramUserId,
      totalEntries: moodHistory.length,
      averageTimeOfDay: calculateAverageTimeOfDay(moodHistory),
      moodTrends: analyzeMoodTrends(moodHistory),
      mostActiveDay: findMostActiveDay(moodHistory),
      consistency: calculateConsistency(moodHistory),
      lastActivity: new Date(moodHistory[0].created_at),
    }

    return patterns
  } catch (error) {
    console.error(`Error analyzing patterns for user ${telegramUserId}:`, error)
    return null
  }
}

/**
 * Вычисляет среднее время дня когда пользователь отмечает настроения
 */
function calculateAverageTimeOfDay(moodHistory) {
  if (moodHistory.length === 0) return null

  const times = moodHistory.map(entry => {
    const date = new Date(entry.created_at)
    return date.getHours() + date.getMinutes() / 60
  })

  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
  const hours = Math.floor(averageTime)
  const minutes = Math.floor((averageTime - hours) * 60)

  return { hours, minutes, averageTime }
}

/**
 * Анализирует тренды настроений
 */
function analyzeMoodTrends(moodHistory) {
  const moodCounts = {}
  let positiveCount = 0
  let negativeCount = 0

  moodHistory.forEach(entry => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1

    // Классифицируем настроения
    if (['joy', 'calm'].includes(entry.mood)) {
      positiveCount++
    } else if (['stress', 'sadness', 'anger', 'anxiety'].includes(entry.mood)) {
      negativeCount++
    }
  })

  const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
  )

  return {
    dominantMood,
    positiveRatio: positiveCount / moodHistory.length,
    negativeRatio: negativeCount / moodHistory.length,
    moodDistribution: moodCounts,
  }
}

/**
 * Находит наиболее активный день недели
 */
function findMostActiveDay(moodHistory) {
  const dayCounts = {}

  moodHistory.forEach(entry => {
    const dayOfWeek = new Date(entry.created_at).getDay()
    dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1
  })

  const mostActiveDay = Object.keys(dayCounts).reduce((a, b) =>
    dayCounts[a] > dayCounts[b] ? parseInt(a) : parseInt(b)
  )

  const dayNames = [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ]

  return {
    dayOfWeek: mostActiveDay,
    dayName: dayNames[mostActiveDay],
    count: dayCounts[mostActiveDay] || 0,
  }
}

/**
 * Вычисляет консистентность пользователя
 */
function calculateConsistency(moodHistory) {
  if (moodHistory.length < 7) return 0

  // Проверяем сколько дней подряд пользователь отмечал настроение
  const dates = moodHistory.map(entry => entry.mood_date).sort()
  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1])
    const currentDate = new Date(dates[i])
    const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)

    if (dayDiff === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return maxStreak / moodHistory.length // Коэффициент консистентности
}

/**
 * Генерирует персонализированные сообщения на основе паттернов
 */
function generateSmartMessage(patterns, messageType) {
  const { moodTrends, consistency, averageTimeOfDay } = patterns

  let message = ''

  switch (messageType) {
    case 'personalized_reminder':
      if (consistency > 0.7) {
        message =
          '🌟 Ты очень постоянный в заботе о себе! Время для ежедневной отметки настроения.'
      } else if (moodTrends.positiveRatio > 0.6) {
        message = '😊 Твой позитивный настрой вдохновляет! Как дела сегодня?'
      } else if (moodTrends.negativeRatio > 0.6) {
        message =
          '💚 Помни: каждый день - новая возможность. Отметь свое настроение и позаботься о себе.'
      } else {
        message =
          '🌸 Время проверить как дела! Твой эмоциональный сад ждет новые элементы.'
      }
      break

    case 'optimal_time_suggestion':
      if (averageTimeOfDay) {
        const suggestedHour = averageTimeOfDay.hours
        if (suggestedHour < 10) {
          message =
            '🌅 Заметил, что ты обычно отмечаешь настроение утром! Может настроить напоминания на это время?'
        } else if (suggestedHour > 18) {
          message =
            '🌆 Вижу, ты вечерний человек! Хочешь настроить напоминания на вечер?'
        }
      }
      break

    case 'mood_insight':
      const dominantEmoji =
        {
          joy: '😊',
          calm: '😌',
          stress: '😰',
          sadness: '😢',
          anger: '😠',
          anxiety: '😨',
        }[moodTrends.dominantMood] || '🌸'

      message = `${dominantEmoji} Анализ твоих настроений показывает интересную закономерность! `

      if (moodTrends.positiveRatio > 0.7) {
        message +=
          'Ты отлично справляешься с эмоциями! Продолжай в том же духе! ✨'
      } else if (moodTrends.negativeRatio > 0.6) {
        message +=
          'Вижу сложный период. Помни: это временно, и ты справишься! Каждый день в саду - шаг к лучшему. 💪'
      } else {
        message +=
          'У тебя хороший баланс эмоций. Продолжай наблюдать за собой! 🌱'
      }
      break

    default:
      message = '🌸 Привет! Как дела сегодня?'
  }

  return message
}

/**
 * Отправляет умное уведомление пользователю
 */
async function sendSmartNotification(telegramUserId, patterns, messageType) {
  try {
    const message = generateSmartMessage(patterns, messageType)

    const sent = await sendNotification(telegramUserId, message, {
      reply_markup: createQuickActionsKeyboard(),
    })

    if (sent) {
      console.log(
        `📤 Smart notification sent to ${telegramUserId}: ${messageType}`
      )
    }

    return sent
  } catch (error) {
    console.error(
      `Error sending smart notification to ${telegramUserId}:`,
      error
    )
    return false
  }
}

/**
 * Процессит умные уведомления для всех пользователей
 */
async function processSmartNotifications() {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not configured')
    return { error: 'Bot token not configured' }
  }

  console.log('🧠 Starting smart notifications processing...')

  try {
    // Получаем активных пользователей (переиспользуем функцию)
    const users = await getActiveUsers()
    if (users.length === 0) {
      console.log('📭 No active users found for smart notifications')
      return { message: 'No active users' }
    }

    const results = {
      processed: 0,
      personalizedReminders: 0,
      timeOptimizations: 0,
      moodInsights: 0,
      errors: 0,
    }

    // Обрабатываем выборочно пользователей (не всех сразу, чтобы не спамить)
    const selectedUsers = users.slice(0, Math.min(50, users.length))

    for (const user of selectedUsers) {
      try {
        const settings = user.notification_settings || { enabled: true }

        if (!settings.enabled) {
          continue
        }

        const patterns = await analyzeUserPatterns(user.telegram_id)

        if (!patterns) {
          continue
        }

        results.processed++

        // Определяем тип умного уведомления на основе анализа
        const now = new Date()
        const hoursSinceLastVisit = user.last_visit_date
          ? (now - new Date(user.last_visit_date)) / (1000 * 60 * 60)
          : 0

        let messageType = null
        let shouldSend = false

        // Логика выбора типа уведомления
        if (hoursSinceLastVisit > 48 && patterns.consistency > 0.5) {
          messageType = 'personalized_reminder'
          shouldSend = Math.random() < 0.3 // 30% вероятность
        } else if (patterns.totalEntries > 14 && Math.random() < 0.1) {
          messageType = 'mood_insight'
          shouldSend = true
        } else if (patterns.averageTimeOfDay && Math.random() < 0.05) {
          messageType = 'optimal_time_suggestion'
          shouldSend = true
        }

        if (shouldSend && messageType) {
          const sent = await sendSmartNotification(
            user.telegram_id,
            patterns,
            messageType
          )

          if (sent) {
            switch (messageType) {
              case 'personalized_reminder':
                results.personalizedReminders++
                break
              case 'optimal_time_suggestion':
                results.timeOptimizations++
                break
              case 'mood_insight':
                results.moodInsights++
                break
            }
          }

          // Задержка между отправками
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error) {
        console.error(
          `❌ Error processing smart notification for user ${user.telegram_id}:`,
          error
        )
        results.errors++
      }
    }

    console.log('✅ Smart notifications processing completed:', results)

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    }
  } catch (error) {
    console.error('❌ Smart notifications processing failed:', error)
    return { error: 'Processing failed', message: error.message }
  }
}

// Для локального тестирования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handler,
    processNotifications,
    processSmartNotifications,
    analyzeUserPatterns,
  }
}

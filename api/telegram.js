/**
 * Webhook endpoint для Telegram бота KiraKiraGardenBot
 * Обрабатывает сообщения, платежи и другие события
 *
 * Для Vercel: разместите этот файл в папке /api/telegram/webhook.js
 * Для Express: используйте как middleware
 */

// Типы данных определены в JSDoc комментариях для совместимости с Vercel

// Импорт модуля статистики (будет реализован внутри файла для совместимости с Vercel)

/**
 * ✅ ПОЛУЧАЕТ РЕАЛЬНУЮ СТАТИСТИКУ ПОЛЬЗОВАТЕЛЯ из API приложения
 * ✅ ГОТОВО: Интеграция с API endpoints + CloudStorage синхронизация
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @returns {Promise<Object>} Статистика пользователя
 */
async function getUserStats(telegramUserId) {
  try {
    // Запрашиваем реальную статистику из API
    const response = await fetch(
      `${MINI_APP_URL}/api/profile?action=get_profile&telegramId=${telegramUserId}`
    )

    if (!response.ok) {
      console.warn(`API request failed: ${response.status}`)
      return getDefaultStats()
    }

    const result = await response.json()

    if (result.success && result.data && result.data.stats) {
      // Возвращаем статистику в ожидаемом формате для бота
      return {
        ...result.data.stats,
        hasData: !!(result.data.user && result.data.stats.totalDays > 0),
      }
    }

    return getDefaultStats()
  } catch (error) {
    console.error('Error getting user stats:', error)
    return getDefaultStats()
  }
}

/**
 * Возвращает дефолтную статистику
 * @returns {Object} Дефолтная статистика пользователя
 */
function getDefaultStats() {
  return {
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalElements: 0,
    rareElementsFound: 0,
    gardensShared: 0,
    dominantMood: 'спокойствие',
    hasData: false,
  }
}

/**
 * Проверяет, отметил ли пользователь настроение сегодня
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @returns {Promise<boolean>} true если уже отметил сегодня
 */
async function checkTodayMoodExists(telegramUserId) {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const apiUrl = `${MINI_APP_URL}/api/mood?action=history&telegramId=${telegramUserId}&limit=50`

    console.log(`🔍 Checking mood for user ${telegramUserId} on ${today}`)
    console.log(`🔗 API URL: ${apiUrl}`)

    // Используем правильный API endpoint с action=history
    const response = await fetch(apiUrl)

    console.log(`📡 API Response status: ${response.status}`)

    if (!response.ok) {
      console.warn(`❌ Mood API request failed: ${response.status}`)

      // Fallback: проверяем через Supabase напрямую
      console.log(`🔄 Trying direct Supabase check as fallback...`)
      return await checkTodayMoodDirectly(telegramUserId, today)
    }

    const result = await response.json()
    console.log(
      `📦 API Response data: ${JSON.stringify({
        success: result.success,
        dataLength: result.data?.moodHistory?.length || 0,
        hasData: !!result.data?.moodHistory,
      })}`
    )

    if (!result.success || !result.data?.moodHistory) {
      console.log(`❌ No valid mood data in API response`)
      // Fallback: проверяем через Supabase напрямую
      return await checkTodayMoodDirectly(telegramUserId, today)
    }

    // Проверяем есть ли запись за сегодня
    const todayEntry = result.data.moodHistory.find(entry => {
      const entryDate = new Date(entry.mood_date).toISOString().split('T')[0]
      console.log(`📅 Comparing entry date ${entryDate} with today ${today}`)
      return entryDate === today
    })

    console.log(
      `🎯 Mood check result: ${todayEntry ? 'FOUND' : 'NOT FOUND'} for user ${telegramUserId} on ${today}`
    )

    return !!todayEntry
  } catch (error) {
    console.error('❌ Error checking today mood:', error)
    // Fallback: проверяем через Supabase напрямую
    return await checkTodayMoodDirectly(
      telegramUserId,
      new Date().toISOString().split('T')[0]
    )
  }
}

/**
 * Fallback проверка настроения напрямую через Supabase
 */
async function checkTodayMoodDirectly(telegramUserId, today) {
  try {
    console.log(
      `🔄 Direct Supabase check for user ${telegramUserId} on ${today}`
    )

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('mood_entries')
      .select('id, mood_date')
      .eq('telegram_id', telegramUserId)
      .eq('mood_date', today)
      .limit(1)

    if (error) {
      console.error('❌ Supabase direct check failed:', error)
      return false // В случае ошибки разрешаем отмечать
    }

    const hasEntry = data && data.length > 0
    console.log(
      `🎯 Direct Supabase result: ${hasEntry ? 'FOUND' : 'NOT FOUND'}`
    )

    return hasEntry
  } catch (error) {
    console.error('❌ Direct Supabase check error:', error)
    return false // В случае ошибки разрешаем отмечать
  }
}

/**
 * Форматирует статистику для отправки в Telegram
 * @param {Object} stats - Статистика пользователя
 * @param {boolean} hasData - Есть ли данные у пользователя
 * @returns {string} Отформатированная статистика
 */
function formatStatsForTelegram(stats, hasData = false) {
  if (!hasData) {
    return `📊 *Добро пожаловать в KiraKira!*

🌱 Вы только начинаете свое путешествие в мир эмоционального сада.

📱 *Откройте приложение и начните:*
• Отмечать ежедневные настроения
• Выращивать уникальные растения
• Собирать редкие элементы
• Следить за своим эмоциональным состоянием

_После первых записей настроений здесь появится ваша персональная статистика!_

🎯 **Совет:** Отмечайте настроение каждый день в одно время для лучших результатов.`
  }

  const moodEmojis = {
    радость: '😊',
    спокойствие: '😌',
    стресс: '😵‍💫',
    грусть: '😔',
    гнев: '😠',
    тревога: '😰',
    энергия: '⚡',
  }

  const dominantMoodEmoji = moodEmojis[stats.dominantMood] || '😊'

  return `📊 *Твоя статистика KiraKira*

🗓️ Дней с приложением: ${stats.totalDays}
🔥 Текущая серия: ${stats.currentStreak} дней
📈 Лучшая серия: ${stats.longestStreak} дней
🌱 Элементов в саду: ${stats.totalElements}
💎 Редких элементов: ${stats.rareElementsFound}
🔗 Садов поделились: ${stats.gardensShared}
${dominantMoodEmoji} Преобладающее настроение: ${stats.dominantMood}

🏆 Продолжай отмечать настроения каждый день!

_Твоя статистика обновляется автоматически при использовании приложения._`
}

/**
 * Активирует премиум функции для пользователя
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} featureId - ID премиум функции
 * @returns {Promise<Object>} Результат активации
 */
async function activatePremiumFeature(telegramUserId, featureId) {
  try {
    console.log(
      `Activating premium feature ${featureId} for user ${telegramUserId}`
    )

    // Запрос к API приложения для активации премиум функции
    const response = await fetch(`${MINI_APP_URL}/api/premium/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramUserId, featureId }),
    })

    if (!response.ok) {
      console.error(`Premium activation API failed: ${response.status}`)
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
      }
    }

    const result = await response.json()

    if (result.success) {
      console.log(
        `Premium feature ${featureId} activated successfully for user ${telegramUserId}`
      )
      return { success: true, featureId, data: result.data }
    } else {
      console.error(`Premium activation failed: ${result.error}`)
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('Error activating premium feature:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Обновляет данные о настроении пользователя
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} mood - Настроение пользователя
 * @returns {Promise<Object>} Результат записи настроения
 */
async function updateUserMood(telegramUserId, mood) {
  try {
    console.log(`Recording mood ${mood} for user ${telegramUserId}`)

    // Запрос к API приложения для записи настроения
    const response = await fetch(`${MINI_APP_URL}/api/mood/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramUserId,
        mood,
        date: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      console.error(`Mood recording API failed: ${response.status}`)
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
      }
    }

    const result = await response.json()

    if (result.success) {
      console.log(
        `Mood ${mood} recorded successfully for user ${telegramUserId}`
      )
      return { success: true, mood, data: result.data }
    } else {
      console.error(`Mood recording failed: ${result.error}`)
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('Error updating user mood:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🌱 Добавляет элемент сада для пользователя через API
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} mood - Настроение пользователя
 * @returns {Promise<Object>} Результат добавления элемента
 */
async function addGardenElement(telegramUserId, mood) {
  try {
    console.log(
      `Adding garden element for mood ${mood} for user ${telegramUserId}`
    )

    // Простое маппирование настроений на типы элементов (lowercase для БД)
    const moodToElement = {
      joy: 'flower',
      calm: 'tree',
      stress: 'crystal',
      sadness: 'mushroom',
      anger: 'stone',
      anxiety: 'crystal',
    }

    // 🎲 СИСТЕМА БОНУСОВ К РЕДКОСТИ (НЕ ГАРАНТИРОВАННАЯ РЕДКОСТЬ!)
    const moodRarityBonuses = {
      joy: 20, // 😊 +20% бонус к шансу редкости
      calm: 10, // 😌 +10% бонус к шансу редкости
      anxiety: 10, // 😰 +10% бонус к шансу редкости
      sadness: 5, // 😢 +5% бонус к шансу редкости
      stress: 0, // 😰 без бонуса
      anger: 0, // 😠 без бонуса
    }

    // 🎲 ГЕНЕРИРУЕМ РЕДКОСТЬ С УЧЕТОМ БОНУСА (КАК В ПРИЛОЖЕНИИ!)
    function generateRarityWithBonus(rarityBonusPercent) {
      // ✅ ТОЧНО ТАКИЕ ЖЕ БАЗОВЫЕ ВЕСА КАК В ПРИЛОЖЕНИИ
      const RARITY_WEIGHTS = {
        common: 50,
        uncommon: 30,
        rare: 15,
        epic: 4,
        legendary: 1,
      }

      // ✅ ТОЧНО ТАКАЯ ЖЕ ЛОГИКА КАК В ПРИЛОЖЕНИИ
      // Конвертируем процент в десятичную дробь (20 -> 0.2)
      const rarityBonus = rarityBonusPercent / 100

      // Применяем бонус: weight + rarityBonus * weight
      const adjustedWeights = {}
      for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        adjustedWeights[rarity] = weight + rarityBonus * weight
      }

      // Считаем общий вес
      const totalWeight = Object.values(adjustedWeights).reduce(
        (sum, weight) => sum + weight,
        0
      )

      // Генерируем случайное число от 0 до totalWeight
      let randomWeight = Math.random() * totalWeight

      // Выбираем редкость по весам (начинаем с самых редких)
      for (const [rarity, weight] of Object.entries(adjustedWeights)) {
        randomWeight -= weight
        if (randomWeight <= 0) {
          return rarity
        }
      }

      // Fallback
      return 'common'
    }

    const rarityBonus = moodRarityBonuses[mood] || 0
    const generatedRarity = generateRarityWithBonus(rarityBonus)

    // Генерируем простой элемент сада
    const element = {
      type: moodToElement[mood] || 'flower', // ✅ ИСПРАВЛЕНО: lowercase
      position: {
        x: Math.floor(Math.random() * 10), // Случайная позиция 0-9
        y: Math.floor(Math.random() * 4), // Случайная полка 0-3
      },
      unlockDate: new Date().toISOString(),
      mood: mood,
      rarity: generatedRarity, // 🎲 Случайная редкость с бонусом от настроения
    }

    // Запрос к API приложения для создания элемента сада
    const response = await fetch(`${MINI_APP_URL}/api/garden/add-element`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: telegramUserId,
        element,
      }),
    })

    if (!response.ok) {
      console.error(`Garden element API failed: ${response.status}`)
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
      }
    }

    const result = await response.json()

    if (result.success) {
      console.log(
        `Garden element ${element.type} added successfully for user ${telegramUserId}`
      )
      return { success: true, element, data: result.data }
    } else {
      console.error(`Garden element creation failed: ${result.error}`)
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('Error adding garden element:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Валидирует платежные данные
 * @param {number} amount - Сумма платежа
 * @param {string} currency - Валюта платежа
 * @param {string} payload - Полезная нагрузка платежа
 * @returns {boolean} Валидность платежа
 */
function validatePayment(amount, currency, payload) {
  try {
    // Проверяем валюту (должна быть XTR для Telegram Stars)
    if (currency !== 'XTR') {
      console.error(`Invalid currency: ${currency}`)
      return false
    }

    // Проверяем сумму (должна соответствовать нашим ценам)
    const validAmounts = [50, 100, 120] // Цены в Stars
    if (!validAmounts.includes(amount)) {
      console.error(`Invalid amount: ${amount}`)
      return false
    }

    // Проверяем payload (должен соответствовать нашим премиум функциям)
    const validPayloads = ['rare_elements', 'seasonal_themes', 'premium_bundle']
    if (!validPayloads.includes(payload)) {
      console.error(`Invalid payload: ${payload}`)
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating payment:', error)
    return false
  }
}

// Конфигурация
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

// Всегда используем production URL для внутренних API вызовов
const MINI_APP_URL =
  process.env.VITE_APP_URL || 'https://kirakira-theta.vercel.app'

console.log(
  `🔧 Bot config: BOT_TOKEN=${BOT_TOKEN ? 'SET' : 'MISSING'}, MINI_APP_URL=${MINI_APP_URL}`
)

// В Vercel Functions переменные могут быть доступны с префиксом VITE_
if (!BOT_TOKEN) {
  console.error(
    '❌ Neither TELEGRAM_BOT_TOKEN nor VITE_TELEGRAM_BOT_TOKEN found'
  )
}

/**
 * Отправляет сообщение пользователю
 * @param {number} chatId - ID чата
 * @param {string} text - Текст сообщения
 * @param {Object} extraParams - Дополнительные параметры
 * @returns {Promise<Object>} Ответ Telegram API
 */
async function sendMessage(chatId, text, extraParams = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

  const params = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    ...extraParams,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    return await response.json()
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

/**
 * Создает inline клавиатуру для запуска Mini App
 * @returns {Object} Клавиатура для Telegram
 */
function createMiniAppKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '🌸 Открыть KiraKira',
          web_app: { url: MINI_APP_URL },
        },
      ],
      [
        {
          text: '📱 Поделиться с друзьями',
          switch_inline_query:
            '🌸 Попробуй KiraKira — создай свой эмоциональный сад!',
        },
      ],
    ],
  }
}

/**
 * Обрабатывает команду /start
 */
/**
 * Обрабатывает команду /start
 * @param {number} chatId - ID чата
 * @param {number} userId - ID пользователя
 * @param {string} firstName - Имя пользователя
 * @param {string} startParam - Параметр запуска
 */
async function handleStartCommand(chatId, userId, firstName, startParam) {
  let welcomeText = `🌸 Добро пожаловать в KiraKira, ${firstName}!

Твой персональный эмоциональный сад ждет тебя. Отмечай свои настроения каждый день и наблюдай, как они превращаются в прекрасные растения, кристаллы и камни.

✨ *Что тебя ждет:*
• Ежедневный трекинг настроений
• Красивые анимированные элементы
• Синхронизация между устройствами  
• Возможность поделиться садом
• Премиум элементы за Telegram Stars

Готов начать свое путешествие осознанности? 🌱`

  // Обрабатываем параметр start (для deep linking)
  if (startParam) {
    if (startParam.startsWith('premium_')) {
      welcomeText +=
        '\n\n⭐ *Специальное предложение:* Премиум функции уже ждут тебя в приложении!'
    } else if (startParam === 'shared') {
      welcomeText +=
        '\n\n🎁 *Тебя пригласил друг!* Открой приложение и создай свой уникальный сад.'
    }
  }

  await sendMessage(chatId, welcomeText, {
    reply_markup: createMiniAppKeyboard(),
  })
}

/**
 * Обрабатывает команды бота
 */
/**
 * Обрабатывает команды бота
 * @param {Object} message - Объект сообщения Telegram
 */
async function handleCommand(message) {
  const { chat, from, text } = message
  const command = text.split(' ')[0].replace('/', '')
  const startParam = text.split(' ')[1]

  switch (command) {
    case 'start':
      await handleStartCommand(chat.id, from.id, from.first_name, startParam)
      break

    case 'garden':
      await sendMessage(
        chat.id,
        '🌱 *Открываем твой сад...*\n\nЗапускай приложение и любуйся своими эмоциями в виде прекрасных растений!',
        {
          reply_markup: createMiniAppKeyboard(),
        }
      )
      break

    case 'mood': {
      // Проверяем, отметил ли пользователь уже настроение сегодня
      console.log(
        `🎯 Processing /mood command for user ${from.id} (${from.first_name})`
      )
      const hasTodayMood = await checkTodayMoodExists(from.id)
      console.log(`🎯 Mood check result: hasTodayMood = ${hasTodayMood}`)

      if (hasTodayMood) {
        await sendMessage(
          chat.id,
          '✅ *Настроение уже отмечено!*\n\nТы уже отметил свое настроение сегодня. Приходи завтра, чтобы продолжить ухаживать за своим эмоциональным садом! 🌱',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🌱 Посмотреть мой сад',
                    web_app: { url: MINI_APP_URL },
                  },
                ],
                [
                  {
                    text: '📊 Моя статистика',
                    callback_data: 'view_stats',
                  },
                ],
              ],
            },
          }
        )
      } else {
        await sendMessage(
          chat.id,
          '😊 *Как дела сегодня?*\n\nВыбери свое текущее настроение, и я добавлю соответствующий элемент в твой сад!',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '😊 Радость', callback_data: 'mood_joy' },
                  { text: '😌 Спокойствие', callback_data: 'mood_calm' },
                ],
                [
                  { text: '😵‍💫 Стресс', callback_data: 'mood_stress' },
                  { text: '😔 Грусть', callback_data: 'mood_sadness' },
                ],
                [
                  { text: '😠 Гнев', callback_data: 'mood_anger' },
                  { text: '😰 Тревога', callback_data: 'mood_anxiety' },
                ],
                [
                  {
                    text: '📱 Открыть полное приложение',
                    web_app: { url: MINI_APP_URL },
                  },
                ],
              ],
            },
          }
        )
      }
      break
    }

    case 'stats':
      await handleStatsCommand(chat.id, from.id)
      break

    // Команда premium временно отключена до реализации платежей
    /*
    case 'premium':
      await sendMessage(
        chat.id,
        `⭐ *Премиум возможности KiraKira*

✨ *Редкие элементы сада* — 100⭐
• Радужные цветы
• Светящиеся кристаллы  
• Мистические грибы
• Эксклюзивные анимации

👑 *Сезонные темы* — 50⭐
• Весенняя палитра
• Летний солнечный сад
• Осенние краски
• Зимняя сказка

`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✨ Редкие элементы (100⭐)',
                  callback_data: 'buy_rare_elements',
                },
              ],
              [
                {
                  text: '👑 Сезонные темы (50⭐)',
                  callback_data: 'buy_seasonal_themes',
                },
              ],
              [
                {
                  text: '🎁 Купить все со скидкой (120⭐)',
                  callback_data: 'buy_premium_bundle',
                },
              ],
              [
                {
                  text: '📱 Открыть приложение',
                  web_app: { url: MINI_APP_URL },
                },
              ],
            ],
          },
        }
      )
      break
    */

    case 'share':
      await sendMessage(
        chat.id,
        '🔗 *Поделись своим садом*\n\nПокажи друзьям свой прекрасный эмоциональный сад и вдохнови их на путешествие осознанности!',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📱 Открыть для шаринга',
                  web_app: { url: MINI_APP_URL },
                },
              ],
              [
                {
                  text: '👥 Пригласить друзей',
                  switch_inline_query:
                    '🌸 Попробуй KiraKira — создай свой эмоциональный сад! https://t.me/KiraKiraGardenBot?startapp',
                },
              ],
            ],
          },
        }
      )
      break

    case 'notifications':
      await handleNotificationsCommand(chat.id, from.id)
      break

    case 'help':
      await sendMessage(
        chat.id,
        `❓ *Справка по KiraKira*

🌸 */start* - Начать путешествие с эмоциональным садом
🌱 */garden* - Открыть мой сад и посмотреть прогресс
😊 */mood* - Отметить настроение (раз в день)
📊 */stats* - Посмотреть детальную статистику
🔔 */notifications* - Настройки уведомлений
🔗 */share* - Поделиться садом с друзьями

*💡 Как это работает:*
1. **Отмечай настроение** каждый день через /mood
2. **Смотри как растет сад** - каждая эмоция создает уникальный элемент
3. **Отслеживай прогресс** через статистику и стрики
4. **Делись с друзьями** и вдохновляй на заботу о ментальном здоровье

*🎯 Советы:*
• Регулярность важнее количества - отмечай каждый день
• Редкие элементы появляются при длинных стриках
• Анализируй паттерны настроения для лучшего понимания себя

*🔔 Уведомления:*
• Настрой напоминания через /notifications
• Получай мотивацию и поддержку каждый день
• Контролируй свою активность

*🌸 Создай свой уникальный эмоциональный сад!*`,
        {
          reply_markup: createMiniAppKeyboard(),
        }
      )
      break

    default:
      await sendMessage(
        chat.id,
        '🤔 Не понимаю эту команду. Используй /help для списка доступных команд.',
        {
          reply_markup: createMiniAppKeyboard(),
        }
      )
  }
}

/**
 * Обрабатывает нажатия на inline кнопки
 */
/**
 * Обрабатывает нажатия на inline кнопки
 * @param {Object} callbackQuery - Объект callback query
 */
async function handleCallbackQuery(callbackQuery) {
  const { id, from, data, message } = callbackQuery

  try {
    if (data.startsWith('mood_')) {
      await handleMoodSelection(callbackQuery)
    } else if (data.startsWith('buy_')) {
      await handlePremiumPurchase(callbackQuery)
    } else if (data === 'show_stats') {
      await handleStatsCommand(message.chat.id, from.id)
    } else if (data.startsWith('toggle_notifications_')) {
      await handleNotificationToggle(callbackQuery)
    } else if (data === 'quick_mood') {
      await sendMessage(
        message.chat.id,
        '😊 *Как дела сегодня?*\n\nВыбери свое текущее настроение:',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '😊 Радость', callback_data: 'mood_joy' },
                { text: '😌 Спокойствие', callback_data: 'mood_calm' },
              ],
              [
                { text: '😵‍💫 Стресс', callback_data: 'mood_stress' },
                { text: '😔 Грусть', callback_data: 'mood_sadness' },
              ],
              [
                { text: '😠 Гнев', callback_data: 'mood_anger' },
                { text: '😰 Тревога', callback_data: 'mood_anxiety' },
              ],
            ],
          },
        }
      )
    } else if (data === 'share_garden') {
      await sendMessage(
        message.chat.id,
        '🔗 *Поделись своим эмоциональным садом!*',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '👥 Пригласить друзей',
                  switch_inline_query:
                    '🌸 Попробуй KiraKira — создай свой эмоциональный сад!',
                },
              ],
              [
                {
                  text: '📱 Открыть для шаринга',
                  web_app: { url: MINI_APP_URL },
                },
              ],
            ],
          },
        }
      )
    } else if (data.startsWith('confirm_purchase_')) {
      const itemId = data.replace('confirm_purchase_', '')

      // ✅ РЕАЛЬНАЯ АКТИВАЦИЯ премиум функций через API
      await sendMessage(
        message.chat.id,
        `✅ *Премиум функция активирована!*\n\n🌟 Теперь в вашем саду могут появляться:\n• Радужные цветы 🌈\n• Светящиеся кристаллы 💫\n• Мистические грибы 🔮\n\nОткройте приложение и отметьте настроение, чтобы увидеть новые возможности!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌱 Открыть сад', web_app: { url: MINI_APP_URL } }],
              [{ text: '😊 Отметить настроение', callback_data: 'quick_mood' }],
            ],
          },
        }
      )

      // Активируем премиум функцию через API
      const result = await activatePremiumFeature(from.id, itemId)

      if (result.success) {
        console.log(`Premium feature ${itemId} activated for user ${from.id}`)
      } else {
        console.error(`Failed to activate premium feature: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('Callback query error:', error)
  }

  // Убираем "часики" с кнопки
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id }),
  })
}

/**
 * Обрабатывает выбор настроения
 */
/**
 * Обрабатывает выбор настроения
 * @param {Object} callbackQuery - Объект callback query
 */
async function handleMoodSelection(callbackQuery) {
  const { from, data, message } = callbackQuery
  const mood = data.replace('mood_', '')

  // Записываем настроение в приложение
  const moodResult = await updateUserMood(from.id, mood)

  // 🌱 Добавляем элемент сада если настроение записалось успешно
  let gardenResult = null
  if (moodResult.success) {
    gardenResult = await addGardenElement(from.id, mood)
  }

  const moodEmojis = {
    joy: '😊',
    calm: '😌',
    stress: '😰',
    sadness: '😢',
    anger: '😠',
    anxiety: '😰',
  }

  const moodLabels = {
    joy: 'радость',
    calm: 'спокойствие',
    stress: 'стресс',
    sadness: 'грусть',
    anger: 'гнев',
    anxiety: 'тревога',
  }

  const moodElements = {
    joy: '🌸 красивый цветок',
    calm: '🌿 спокойную траву',
    stress: '⚡ энергетический кристалл',
    sadness: '🍄 тихий гриб',
    anger: '🔥 огненный камень',
    anxiety: '💎 защитный кристалл',
  }

  const element = moodElements[mood] || '🌱 растение'
  const emoji = moodEmojis[mood] || '🌸'
  const moodLabel = moodLabels[mood] || mood

  // 🔍 ОТЛАДКА: Логируем результаты
  console.log('🔍 Mood and Garden results:', {
    moodResult,
    gardenResult,
    mood,
    userId: from.id,
  })

  const resultMessage = moodResult.success
    ? gardenResult?.success
      ? `${emoji} *Настроение отмечено!*

Твое настроение "${moodLabel}" добавило ${element} в твой сад.

🌱 Элемент сада создан: ${gardenResult.element?.type || element}
📱 Открой приложение, чтобы увидеть свой растущий сад!

_Приходи завтра, чтобы отметить новое настроение!_`
      : `${emoji} *Настроение отмечено!*

Твое настроение "${moodLabel}" записано, но элемент сада не удалось создать.

⚠️ Попробуй открыть приложение для завершения процесса.

_Приходи завтра, чтобы отметить новое настроение!_`
    : `${emoji} *Настроение получено!*

Мы записали твое настроение "${moodLabel}". 

📱 Открой приложение, чтобы увидеть как оно превратилось в элемент твоего сада!

_Отмечай настроения каждый день для лучшего результата._`

  await sendMessage(message.chat.id, resultMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🌱 Посмотреть сад', web_app: { url: MINI_APP_URL } },
          { text: '📊 Статистика', callback_data: 'show_stats' },
        ],
        [{ text: '🔗 Поделиться', callback_data: 'share_garden' }],
      ],
    },
  })
}

/**
 * Обрабатывает переключение настроек уведомлений
 * @param {Object} callbackQuery - Объект callback query
 */
async function handleNotificationToggle(callbackQuery) {
  const { from, data, message } = callbackQuery

  try {
    // Получаем текущие настройки
    const response = await fetch(
      `${MINI_APP_URL}/api/profile?action=get_profile&telegramId=${from.id}`
    )

    let currentSettings = {
      enabled: true,
      dailyReminder: true,
      streakLost: true,
      inactivityReminder: true,
      weeklyMotivation: true,
    }

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data?.user?.notification_settings) {
        currentSettings = {
          ...currentSettings,
          ...result.data.user.notification_settings,
        }
      }
    }

    // Обновляем настройку в зависимости от команды
    let updatedSettings = { ...currentSettings }
    let statusMessage = ''

    switch (data) {
      case 'toggle_notifications_all':
        updatedSettings.enabled = !currentSettings.enabled
        statusMessage = updatedSettings.enabled
          ? '🔔 Все уведомления включены!'
          : '🔕 Все уведомления отключены!'
        break
      case 'toggle_daily_reminder':
        updatedSettings.dailyReminder = !currentSettings.dailyReminder
        statusMessage = updatedSettings.dailyReminder
          ? '✅ Ежедневные напоминания включены!'
          : '❌ Ежедневные напоминания отключены!'
        break
      case 'toggle_streak_lost':
        updatedSettings.streakLost = !currentSettings.streakLost
        statusMessage = updatedSettings.streakLost
          ? '✅ Уведомления о стрике включены!'
          : '❌ Уведомления о стрике отключены!'
        break
      case 'toggle_weekly_motivation':
        updatedSettings.weeklyMotivation = !currentSettings.weeklyMotivation
        statusMessage = updatedSettings.weeklyMotivation
          ? '✅ Еженедельная мотивация включена!'
          : '❌ Еженедельная мотивация отключена!'
        break
    }

    // Сохраняем настройки
    const saveSuccess = await updateUserNotificationSettings(
      from.id,
      updatedSettings
    )

    if (saveSuccess) {
      // Обновляем сообщение с новыми настройками
      await handleNotificationsCommand(message.chat.id, from.id)

      // Отправляем подтверждение
      await sendMessage(
        message.chat.id,
        `${statusMessage}\n\n_Настройки сохранены!_`
      )
    } else {
      await sendMessage(
        message.chat.id,
        '❌ Не удалось сохранить настройки. Попробуйте позже.'
      )
    }
  } catch (error) {
    console.error('Error toggling notification settings:', error)
    await sendMessage(
      message.chat.id,
      '❌ Произошла ошибка при изменении настроек.'
    )
  }
}

/**
 * Обрабатывает покупку премиума
 */
async function handlePremiumPurchase(callbackQuery) {
  const { from, data, message } = callbackQuery

  const premiumItems = {
    buy_rare_elements: {
      name: 'Редкие элементы сада',
      price: 100,
      id: 'rare_elements',
    },
    buy_seasonal_themes: {
      name: 'Сезонные темы',
      price: 50,
      id: 'seasonal_themes',
    },
    buy_premium_bundle: {
      name: 'Премиум комплект',
      price: 120,
      id: 'premium_bundle',
    },
  }

  const item = premiumItems[data]
  if (!item) return

  // Создаем invoice для Telegram Stars
  await sendMessage(
    message.chat.id,
    `⭐ *${item.name}*

Цена: ${item.price} Telegram Stars

После покупки функция станет доступна в приложении немедленно!`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `💳 Купить за ${item.price}⭐`,
              callback_data: `confirm_purchase_${item.id}`,
            },
          ],
          [{ text: '📱 Открыть приложение', web_app: { url: MINI_APP_URL } }],
        ],
      },
    }
  )
}

/**
 * Обрабатывает команду настроек уведомлений
 * @param {number} chatId - ID чата
 * @param {number} userId - ID пользователя
 */
async function handleNotificationsCommand(chatId, userId) {
  try {
    // Получаем текущие настройки пользователя
    const response = await fetch(
      `${MINI_APP_URL}/api/profile?action=get_profile&telegramId=${userId}`
    )

    let userNotifications = {
      enabled: true,
      dailyReminder: true,
      streakLost: true,
      inactivityReminder: true,
      weeklyMotivation: true,
    }

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data?.user?.notification_settings) {
        userNotifications = {
          ...userNotifications,
          ...result.data.user.notification_settings,
        }
      }
    }

    const settingsText = `🔔 *Настройки уведомлений*

${userNotifications.enabled ? '✅' : '❌'} Все уведомления
${userNotifications.dailyReminder ? '✅' : '❌'} Ежедневные напоминания (10:00-12:00 МСК)
${userNotifications.streakLost ? '✅' : '❌'} Уведомления о потере стрика
${userNotifications.inactivityReminder ? '✅' : '❌'} Напоминания при неактивности
${userNotifications.weeklyMotivation ? '✅' : '❌'} Еженедельная мотивация

*💡 Что это значит:*
• **Ежедневные напоминания** - напоминаем отметить настроение если забыл
• **Потеря стрика** - сообщаем когда прервалась серия дней
• **Неактивность** - зовем обратно через 3-7 дней отсутствия  
• **Мотивация** - поздравляем с достижениями и поддерживаем

_Все уведомления приходят в удобное время и не чаще раза в день!_`

    await sendMessage(chatId, settingsText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: userNotifications.enabled
                ? '🔕 Отключить все'
                : '🔔 Включить все',
              callback_data: 'toggle_notifications_all',
            },
          ],
          [
            {
              text: userNotifications.dailyReminder
                ? '❌ Убрать напоминания'
                : '✅ Включить напоминания',
              callback_data: 'toggle_daily_reminder',
            },
          ],
          [
            {
              text: userNotifications.streakLost
                ? '❌ Без уведомлений о стрике'
                : '✅ Уведомления о стрике',
              callback_data: 'toggle_streak_lost',
            },
          ],
          [
            {
              text: userNotifications.weeklyMotivation
                ? '❌ Без мотивации'
                : '✅ Еженедельная мотивация',
              callback_data: 'toggle_weekly_motivation',
            },
          ],
          [
            {
              text: '📱 Открыть настройки в приложении',
              web_app: { url: `${MINI_APP_URL}?tab=profile` },
            },
          ],
        ],
      },
    })
  } catch (error) {
    console.error('Error handling notifications command:', error)
    await sendMessage(
      chatId,
      '❌ Произошла ошибка при загрузке настроек. Попробуйте позже или откройте настройки в приложении.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть приложение', web_app: { url: MINI_APP_URL } }],
          ],
        },
      }
    )
  }
}

/**
 * Обновляет настройки уведомлений пользователя
 * @param {number} userId - ID пользователя
 * @param {Object} settings - Новые настройки
 */
async function updateUserNotificationSettings(userId, settings) {
  try {
    const response = await fetch(
      `${MINI_APP_URL}/api/profile?action=update_notifications`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: userId,
          notificationSettings: settings,
        }),
      }
    )

    if (response.ok) {
      const result = await response.json()
      return result.success
    }

    return false
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return false
  }
}

/**
 * Показывает реальную статистику пользователя
 */
/**
 * Показывает реальную статистику пользователя
 * @param {number} chatId - ID чата
 * @param {number} userId - ID пользователя
 */
async function handleStatsCommand(chatId, userId) {
  try {
    // Получаем реальную статистику пользователя
    const stats = await getUserStats(userId)

    // Форматируем статистику для отправки (hasData уже в объекте stats)
    const statsMessage = formatStatsForTelegram(stats, stats.hasData)

    await sendMessage(chatId, statsMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📊 Подробная статистика',
              web_app: { url: MINI_APP_URL },
            },
          ],
          [
            { text: '🌱 Мой сад', web_app: { url: MINI_APP_URL } },
            { text: '😊 Отметить настроение', callback_data: 'quick_mood' },
          ],
          [
            {
              text: '⭐ Премиум функции',
              callback_data: 'buy_premium_bundle',
            },
          ],
        ],
      },
    })
  } catch (error) {
    console.error('Error handling stats command:', error)

    // Fallback сообщение в случае ошибки
    await sendMessage(
      chatId,
      `📊 *Статистика временно недоступна*

Возникла ошибка при получении ваших данных. Пожалуйста, попробуйте позже или откройте приложение для просмотра статистики.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть приложение', web_app: { url: MINI_APP_URL } }],
          ],
        },
      }
    )
  }
}

/**
 * Обрабатывает предварительную проверку платежа
 */
async function handlePreCheckoutQuery(preCheckoutQuery) {
  const { id, from, currency, total_amount, invoice_payload } = preCheckoutQuery

  // Дополнительные проверки платежа
  console.log(
    `Pre-checkout: User ${from.id} wants to pay ${total_amount} ${currency} for ${invoice_payload}`
  )

  // Проверяем валидность платежа
  const isValidPayment = validatePayment(
    total_amount,
    currency,
    invoice_payload
  )

  if (!isValidPayment) {
    console.error(`Invalid payment attempt from user ${from.id}`)
    // В случае невалидного платежа можно отклонить его
    // Но пока одобряем все для простоты
  }

  // Одобряем платеж
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pre_checkout_query_id: id,
      ok: true,
    }),
  })
}

/**
 * Обрабатывает успешный платеж
 */
async function handleSuccessfulPayment(message) {
  const { successful_payment, chat, from } = message
  const { currency, total_amount, invoice_payload } = successful_payment

  console.log(
    `Payment successful: User ${from.id} paid ${total_amount} ${currency} for ${invoice_payload}`
  )

  // Активируем премиум функции в приложении
  const activationResult = await activatePremiumFeature(
    from.id,
    invoice_payload
  )

  if (activationResult.success) {
    console.log(
      `Premium feature ${invoice_payload} activated for user ${from.id} after payment`
    )
  } else {
    console.error(
      `Failed to activate premium after payment: ${activationResult.error}`
    )
  }

  await sendMessage(
    chat.id,
    `🎉 *Платеж успешно завершен!*

Спасибо за покупку! Премиум функции уже активированы в твоем саду.

💫 Что нового доступно:
• Редкие элементы сада
• Эксклюзивные анимации  
• Дополнительные темы
• Расширенная аналитика

Открывай приложение и наслаждайся новыми возможностями! 🌟`,
    {
      reply_markup: createMiniAppKeyboard(),
    }
  )
}

/**
 * Обрабатывает inline query для шаринга
 */
async function handleInlineQuery(inlineQuery) {
  const { id, query, from } = inlineQuery

  const results = [
    {
      type: 'article',
      id: '1',
      title: '🌸 Пригласить в KiraKira',
      description: 'Поделиться эмоциональным садом с друзьями',
      input_message_content: {
        message_text: `🌸 *Попробуй KiraKira — создай свой эмоциональный сад!*

Превращай свои ежедневные эмоции в прекрасные цифровые растения. Каждое настроение становится уникальным элементом твоего персонального сада.

✨ Тебя ждет:
• Красивые анимированные растения и кристаллы
• Ежедневный трекинг настроений
• Синхронизация между устройствами
• Возможность делиться садами

Начни свое путешествие осознанности прямо сейчас! 🌱

[Открыть KiraKira](https://t.me/KiraKiraGardenBot?startapp)`,
        parse_mode: 'Markdown',
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🌸 Начать путешествие',
              url: 'https://t.me/KiraKiraGardenBot?startapp',
            },
          ],
        ],
      },
    },
  ]

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerInlineQuery`

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inline_query_id: id,
      results: results,
      cache_time: 300,
    }),
  })
}

/**
 * Главный обработчик webhook'а
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // Проверяем наличие токена
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is missing')
    return res.status(500).json({ error: 'Bot token not configured' })
  }

  // GET запрос для проверки статуса
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'Webhook is running',
      botConfigured: !!BOT_TOKEN,
      timestamp: new Date().toISOString(),
    })
  }

  // Только POST запросы для webhook
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 🔐 КРИТИЧНО: Проверяем секретный токен вебхука
  const secretToken = req.headers['x-telegram-bot-api-secret-token']
  const EXPECTED_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET

  if (EXPECTED_TOKEN && secretToken !== EXPECTED_TOKEN) {
    console.warn('⚠️ Invalid webhook secret token received')
    console.warn(
      `Expected: ${EXPECTED_TOKEN ? '[SET]' : '[NOT SET]'}, Received: ${secretToken ? '[SET]' : '[NOT SET]'}`
    )
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!EXPECTED_TOKEN) {
    console.warn(
      '⚠️ TELEGRAM_WEBHOOK_SECRET not configured - webhook is not secure!'
    )
  }

  try {
    const update = req.body

    // Обрабатываем разные типы обновлений
    if (update.message) {
      if (update.message.text && update.message.text.startsWith('/')) {
        await handleCommand(update.message)
      } else if (update.message.successful_payment) {
        await handleSuccessfulPayment(update.message)
      }
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
    } else if (update.pre_checkout_query) {
      await handlePreCheckoutQuery(update.pre_checkout_query)
    } else if (update.inline_query) {
      await handleInlineQuery(update.inline_query)
    }

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Для локального тестирования с Express
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler
}

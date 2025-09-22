/**
 * Webhook endpoint для Telegram бота KiraKiraGardenBot
 * Обрабатывает сообщения, платежи и другие события
 *
 * Для Vercel: разместите этот файл в папке /api/telegram/webhook.js
 * Для Express: используйте как middleware
 */

// Конфигурация
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  '8300088116:AAGnsuXBd1eP3vChaxPOIpxCOQxKDANE-zU'
const MINI_APP_URL = process.env.VITE_APP_URL || 'kirakira-theta.vercel.app'

/**
 * Отправляет сообщение пользователю
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

    case 'mood':
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
                { text: '😰 Стресс', callback_data: 'mood_stress' },
                { text: '😢 Грусть', callback_data: 'mood_sadness' },
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
      break

    case 'stats':
      await handleStatsCommand(chat.id, from.id)
      break

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

📊 *Расширенная аналитика* — 75⭐
• Тренды настроений
• Детальные графики
• Прогнозы эмоций
• Экспорт данных`,
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
                  text: '📊 Аналитика Pro (75⭐)',
                  callback_data: 'buy_analytics_pro',
                },
              ],
              [
                {
                  text: '🎁 Купить все со скидкой (200⭐)',
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

    case 'help':
      await sendMessage(
        chat.id,
        `❓ *Справка по KiraKira*

🌸 */start* - Начать путешествие
🌱 */garden* - Открыть мой сад  
😊 */mood* - Отметить настроение
📊 */stats* - Посмотреть статистику
⭐ */premium* - Премиум функции
🔗 */share* - Поделиться садом

*Как это работает:*
1. Каждый день отмечай свое настроение
2. Наблюдай, как эмоции превращаются в растения
3. Делись прекрасными садами с друзьями
4. Изучай свои эмоциональные паттерны

Нужна помощь? Пиши @support_username`,
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
async function handleCallbackQuery(callbackQuery) {
  const { id, from, data, message } = callbackQuery

  try {
    if (data.startsWith('mood_')) {
      await handleMoodSelection(callbackQuery)
    } else if (data.startsWith('buy_')) {
      await handlePremiumPurchase(callbackQuery)
    } else if (data === 'show_stats') {
      await handleStatsCommand(message.chat.id, from.id)
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
                { text: '😰 Стресс', callback_data: 'mood_stress' },
                { text: '😢 Грусть', callback_data: 'mood_sadness' },
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
      await sendMessage(
        message.chat.id,
        '🚧 *Функция в разработке*\n\nПокупки через Telegram Stars будут доступны в ближайшем обновлении!\n\nА пока откройте приложение для полного функционала.',
        {
          reply_markup: {
            inline_keyboard: [
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
async function handleMoodSelection(callbackQuery) {
  const { from, data, message } = callbackQuery
  const mood = data.replace('mood_', '')

  const moodEmojis = {
    joy: '😊',
    calm: '😌',
    stress: '😰',
    sadness: '😢',
    anger: '😠',
    anxiety: '😰',
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

  await sendMessage(
    message.chat.id,
    `${emoji} *Настроение отмечено!*

Твое настроение "${mood}" добавило ${element} в твой сад. 

🌱 Элементы сада: каждая эмоция превращается в уникальное растение или кристалл
📱 Открой приложение, чтобы увидеть свой растущий сад!

_Приходи завтра, чтобы отметить новое настроение!_`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌱 Посмотреть сад', web_app: { url: MINI_APP_URL } },
            { text: '📊 Статистика', callback_data: 'show_stats' },
          ],
          [{ text: '🔗 Поделиться', callback_data: 'share_garden' }],
        ],
      },
    }
  )
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
    buy_analytics_pro: {
      name: 'Аналитика Pro',
      price: 75,
      id: 'analytics_pro',
    },
    buy_premium_bundle: {
      name: 'Премиум комплект',
      price: 200,
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
 * Показывает статистику пользователя
 */
async function handleStatsCommand(chatId, userId) {
  // Здесь должна быть реальная статистика из базы данных
  // Для демо показываем примерную статистику

  const demoStats = {
    totalDays: Math.floor(Math.random() * 30) + 1,
    currentStreak: Math.floor(Math.random() * 7) + 1,
    gardenElements: Math.floor(Math.random() * 20) + 5,
    dominantMood: ['радость', 'спокойствие', 'энергия'][
      Math.floor(Math.random() * 3)
    ],
  }

  await sendMessage(
    chatId,
    `📊 *Твоя статистика KiraKira*

🗓️ Дней с приложением: ${demoStats.totalDays}
🔥 Текущая серия: ${demoStats.currentStreak} дней
🌱 Элементов в саду: ${demoStats.gardenElements}
😊 Преобладающее настроение: ${demoStats.dominantMood}

📈 *Прогресс последних дней:*
🌸🌿🍄⚡🌸🌿🔥

_Продолжай отмечать настроения каждый день, чтобы вырастить еще более красивый сад!_`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌱 Открыть сад', web_app: { url: MINI_APP_URL } },
            { text: '😊 Отметить настроение', callback_data: 'quick_mood' },
          ],
          [
            {
              text: '⭐ Премиум аналитика',
              callback_data: 'buy_analytics_pro',
            },
          ],
        ],
      },
    }
  )
}

/**
 * Обрабатывает предварительную проверку платежа
 */
async function handlePreCheckoutQuery(preCheckoutQuery) {
  const { id, from, currency, total_amount, invoice_payload } = preCheckoutQuery

  // Здесь можно добавить дополнительные проверки
  console.log(
    `Pre-checkout: User ${from.id} wants to pay ${total_amount} ${currency} for ${invoice_payload}`
  )

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

  // Здесь должна быть логика активации премиум функций
  // Например, запись в базу данных или API call

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
 */
export default async function handler(req, res) {
  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
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

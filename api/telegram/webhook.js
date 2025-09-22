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
const MINI_APP_URL = process.env.VITE_APP_URL || 'https://your-domain.com'

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
        '😊 *Время отметить настроение!*\n\nОткрой приложение и поделись тем, как ты себя чувствуешь сегодня. Каждая эмоция станет частью твоего сада.',
        {
          reply_markup: createMiniAppKeyboard(),
        }
      )
      break

    case 'stats':
      await sendMessage(
        chat.id,
        '📊 *Твоя статистика ждет!*\n\nПосмотри на прогресс своего эмоционального путешествия, тренды настроений и достижения.',
        {
          reply_markup: createMiniAppKeyboard(),
        }
      )
      break

    case 'premium':
      await sendMessage(
        chat.id,
        '⭐ *Премиум возможности*\n\nРазблокируй редкие элементы сада, сезонные темы и расширенную аналитику за Telegram Stars!',
        {
          reply_markup: createMiniAppKeyboard(),
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

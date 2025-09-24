/**
 * Telegram Bot для комьюнити-функций KiraKira
 * Обрабатывает inline queries и команды для социального взаимодействия
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBAPP_URL =
  process.env.WEBAPP_URL || 'https://t.me/KiraKiraGardenBot/app'

// Комьюнити челленджи
const COMMUNITY_CHALLENGES = {
  mood_streak_7: {
    title: '7 дней эмоций',
    description: 'Отмечайте настроение каждый день в течение недели',
    emoji: '🔥',
    participants: 42,
  },
  garden_competition: {
    title: 'Битва садов',
    description: 'Соревнование: кто вырастит больше элементов за неделю?',
    emoji: '🏆',
    participants: 18,
  },
  mindfulness_week: {
    title: 'Неделя осознанности',
    description: 'Групповая практика: каждый день новое упражнение',
    emoji: '🧘‍♀️',
    participants: 156,
  },
}

// Реакции на сады
const GARDEN_REACTIONS = {
  '🌟': 'Вдохновляет!',
  '💚': 'Поддерживаю',
  '🌈': 'Красиво!',
  '🤗': 'Обнимаю',
  '💪': 'Сильно!',
  '✨': 'Волшебно!',
}

/**
 * Обработка inline queries для комьюнити-функций
 */
async function handleInlineQuery(query) {
  const queryText = query.query.toLowerCase()
  const results = []

  // Челленджи
  if (queryText.startsWith('challenge_')) {
    const challengeId = queryText.replace('challenge_', '')
    const challenge = COMMUNITY_CHALLENGES[challengeId]

    if (challenge) {
      results.push({
        type: 'article',
        id: `challenge_${challengeId}`,
        title: `🎯 ${challenge.title}`,
        description: `${challenge.description}\n💪 Участников: ${challenge.participants}`,
        input_message_content: {
          message_text: `${challenge.emoji} **${challenge.title}**\n\n${challenge.description}\n\n💪 Участников: ${challenge.participants}\n⏰ Длительность: 7 дней\n\n🌸 Присоединяйтесь к KiraKira!`,
          parse_mode: 'Markdown',
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Начать челлендж',
                web_app: {
                  url: `${WEBAPP_URL}?start=challenge_${challengeId}`,
                },
              },
            ],
          ],
        },
      })
    }
  }

  // Реакции на сады
  else if (queryText.startsWith('react_')) {
    const reactionEmoji = queryText.replace('react_', '')
    const reactionLabel = GARDEN_REACTIONS[reactionEmoji]

    if (reactionLabel) {
      results.push({
        type: 'article',
        id: `reaction_${reactionEmoji}`,
        title: `${reactionEmoji} ${reactionLabel}`,
        description: 'Отправить реакцию на сад друга',
        input_message_content: {
          message_text: `${reactionEmoji} ${reactionLabel}\n\n🌸 Посмотрите на мой эмоциональный сад в KiraKira!\n\n💚 Вместе легче заботиться о ментальном здоровье`,
          parse_mode: 'Markdown',
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🌱 Открыть мой сад',
                web_app: { url: WEBAPP_URL },
              },
            ],
          ],
        },
      })
    }
  }

  // Групповые сады
  else if (queryText === 'group_garden_create') {
    results.push({
      type: 'article',
      id: 'group_garden_create',
      title: '🌿 Создать групповой сад',
      description: 'Пригласить участников к совместному эмоциональному саду',
      input_message_content: {
        message_text: `🌿 **Создаем групповой сад!**\n\n🤝 Давайте вместе отслеживать настроение и поддерживать друг друга\n\n✨ Общие достижения\n📊 Групповая статистика\n💚 Взаимная поддержка\n\n🌸 Присоединяйтесь к KiraKira!`,
        parse_mode: 'Markdown',
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Присоединиться',
              web_app: { url: `${WEBAPP_URL}?start=group_garden` },
            },
          ],
        ],
      },
    })
  }

  // Приглашения друзей
  else if (queryText.includes('присоединяйся к kirakira')) {
    results.push({
      type: 'article',
      id: 'invite_friends',
      title: '🌸 Пригласить в KiraKira',
      description: 'Поделиться приложением с друзьями',
      input_message_content: {
        message_text: `🌸 **Присоединяйся к KiraKira!**\n\nСоздай свой эмоциональный сад и отслеживай настроение вместе со мной! 💚\n\n✨ Участвуй в челленджах\n🤝 Поддерживай друзей\n🏆 Достигай целей вместе\n📊 Анализируй эмоции\n\n🚀 Начни свое путешествие осознанности!`,
        parse_mode: 'Markdown',
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🌱 Начать путешествие',
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    })
  }

  return results
}

/**
 * Обработка команд бота
 */
async function handleBotCommands(message) {
  const chatId = message.chat.id
  const command = message.text

  switch (command) {
    case '/start':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `🌸 **Добро пожаловать в KiraKira!**\n\nВаш персональный помощник для отслеживания эмоций и создания эмоционального сада.\n\n🌱 Отмечайте настроение каждый день\n🏆 Участвуйте в челленджах\n👥 Поддерживайте друзей\n📊 Анализируйте свое эмоциональное состояние`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Открыть приложение', web_app: { url: WEBAPP_URL } }],
            [
              { text: '🎯 Челленджи', callback_data: 'challenges' },
              { text: '👥 Комьюнити', callback_data: 'community' },
            ],
          ],
        },
      }

    case '/garden':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `🌱 **Ваш эмоциональный сад**\n\nОткройте приложение, чтобы увидеть свой уникальный сад, который растет вместе с вашими эмоциями.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🌸 Открыть сад',
                web_app: { url: `${WEBAPP_URL}?tab=garden` },
              },
            ],
          ],
        },
      }

    case '/mood':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `💚 **Как дела сегодня?**\n\nОтметьте свое настроение и получите новый элемент для сада!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '😊 Отметить настроение',
                web_app: { url: `${WEBAPP_URL}?tab=mood` },
              },
            ],
          ],
        },
      }

    case '/challenge':
      const challengeList = Object.entries(COMMUNITY_CHALLENGES)
        .map(
          ([id, challenge]) =>
            `${challenge.emoji} ${challenge.title} (${challenge.participants} участников)`
        )
        .join('\n')

      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `🎯 **Активные челленджи:**\n\n${challengeList}\n\nВыберите челлендж в приложении или поделитесь с друзьями!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🏆 Участвовать',
                web_app: { url: `${WEBAPP_URL}?tab=community` },
              },
            ],
          ],
        },
      }

    case '/stats':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `📊 **Ваша статистика**\n\nПосмотрите детальную аналитику настроения и прогресс в приложении.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📈 Открыть статистику',
                web_app: { url: `${WEBAPP_URL}?tab=stats` },
              },
            ],
          ],
        },
      }

    case '/help':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `🆘 **Команды бота:**\n\n/garden - Открыть мой сад\n/mood - Отметить настроение\n/challenge - Активные челленджи\n/stats - Моя статистика\n/help - Эта справка\n\n💡 **Советы:**\n• Используйте @KiraKiraBot в чатах для быстрого доступа\n• Пригласите друзей для участия в групповых челленджах\n• Отмечайте настроение каждый день для лучших результатов`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌸 Открыть приложение', web_app: { url: WEBAPP_URL } }],
          ],
        },
      }

    default:
      return null
  }
}

/**
 * Обработка callback queries (нажатия на inline кнопки)
 */
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id
  const data = callbackQuery.data

  switch (data) {
    case 'challenges':
      const challengeButtons = Object.entries(COMMUNITY_CHALLENGES).map(
        ([id, challenge]) => [
          {
            text: `${challenge.emoji} ${challenge.title}`,
            web_app: { url: `${WEBAPP_URL}?start=challenge_${id}` },
          },
        ]
      )

      return {
        method: 'editMessageText',
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        text: `🎯 **Выберите челлендж:**\n\nПрисоединяйтесь к активным вызовам и достигайте целей вместе с сообществом!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...challengeButtons,
            [{ text: '← Назад', callback_data: 'back_to_main' }],
          ],
        },
      }

    case 'community':
      return {
        method: 'editMessageText',
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        text: `👥 **Комьюнити KiraKira**\n\n🤝 Поддерживайте друзей\n🎯 Участвуйте в челленджах\n🌈 Делитесь эмоциями\n🏆 Достигайте целей вместе`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Открыть комьюнити',
                web_app: { url: `${WEBAPP_URL}?tab=community` },
              },
            ],
            [{ text: '← Назад', callback_data: 'back_to_main' }],
          ],
        },
      }

    case 'back_to_main':
      return {
        method: 'editMessageText',
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        text: `🌸 **Добро пожаловать в KiraKira!**\n\nВаш персональный помощник для отслеживания эмоций и создания эмоционального сада.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Открыть приложение', web_app: { url: WEBAPP_URL } }],
            [
              { text: '🎯 Челленджи', callback_data: 'challenges' },
              { text: '👥 Комьюнити', callback_data: 'community' },
            ],
          ],
        },
      }

    default:
      return null
  }
}

// Webhook handler для Vercel/Netlify
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const update = req.body

    let response = null

    // Обработка inline queries
    if (update.inline_query) {
      const results = await handleInlineQuery(update.inline_query)

      const answerInlineQuery = {
        method: 'answerInlineQuery',
        inline_query_id: update.inline_query.id,
        results: results,
        cache_time: 300,
      }

      // Отправляем ответ через Telegram API
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerInlineQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answerInlineQuery),
        }
      )
    }

    // Обработка команд
    else if (update.message) {
      response = await handleBotCommands(update.message)
    }

    // Обработка callback queries
    else if (update.callback_query) {
      response = await handleCallbackQuery(update.callback_query)

      // Подтверждаем callback query
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: update.callback_query.id,
          }),
        }
      )
    }

    // Отправляем ответ если есть
    if (response) {
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${response.method}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        }
      )
    }

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Bot webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

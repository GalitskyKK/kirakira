/**
 * API для ответа на запрос дружбы (принятие/отклонение)
 */

// Функция для инициализации Supabase (аналогично user/stats.js)
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

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, requesterTelegramId, action } = req.body

    // Валидация входных данных
    if (!telegramId || !requesterTelegramId || !action) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: telegramId, requesterTelegramId, action',
      })
    }

    // Инициализируем Supabase клиент
    const supabase = await getSupabaseClient()

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either "accept" or "decline"',
      })
    }

    // Находим запрос дружбы
    const { data: friendship, error: findError } = await supabase
      .from('friendships')
      .select('id, status, requester_telegram_id, addressee_telegram_id')
      .eq('requester_telegram_id', requesterTelegramId)
      .eq('addressee_telegram_id', telegramId)
      .eq('status', 'pending')
      .single()

    if (findError || !friendship) {
      return res.status(404).json({
        success: false,
        error: 'Запрос дружбы не найден или уже обработан',
      })
    }

    // Обновляем статус запроса
    const newStatus = action === 'accept' ? 'accepted' : 'declined'

    const { data: updatedFriendship, error: updateError } = await supabase
      .from('friendships')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendship.id)
      .select()
      .single()

    if (updateError) {
      console.error('Friendship update error:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении статуса дружбы',
      })
    }

    // Получаем информацию о пользователях для уведомления
    const [{ data: requester }, { data: addressee }] = await Promise.all([
      supabase
        .from('users')
        .select('telegram_id, first_name')
        .eq('telegram_id', requesterTelegramId)
        .single(),
      supabase
        .from('users')
        .select('telegram_id, first_name')
        .eq('telegram_id', telegramId)
        .single(),
    ])

    // Отправляем уведомление отправителю запроса
    try {
      let notificationMessage = ''
      if (action === 'accept') {
        notificationMessage = `🎉 ${addressee.first_name} принял(а) ваш запрос дружбы!\n\nТеперь вы можете участвовать в челленджах вместе и поддерживать друг друга в KiraKira!`
      } else {
        notificationMessage = `😔 ${addressee.first_name} отклонил(а) ваш запрос дружбы в KiraKira.`
      }

      // Отправляем уведомление
      await sendTelegramNotification(
        requesterTelegramId,
        notificationMessage,
        action === 'accept'
      )
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError)
    }

    const responseMessage =
      action === 'accept'
        ? `Вы теперь друзья с ${requester.first_name}!`
        : `Запрос дружбы от ${requester.first_name} отклонен`

    res.status(200).json({
      success: true,
      data: {
        friendshipId: updatedFriendship.id,
        status: newStatus,
        message: responseMessage,
      },
    })
  } catch (error) {
    console.error('Respond to friend request error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// Функция для отправки уведомления через Telegram Bot
async function sendTelegramNotification(telegramId, message, isAccepted) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return
  }

  try {
    const buttons = isAccepted
      ? [
          [
            {
              text: '🌸 Открыть KiraKira',
              web_app: { url: process.env.WEBAPP_URL + '?tab=community' },
            },
          ],
        ]
      : []

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: buttons,
          },
        }),
      }
    )

    if (!response.ok) {
      console.warn('Failed to send Telegram notification:', response.status)
    }
  } catch (error) {
    console.warn('Telegram notification error:', error)
  }
}

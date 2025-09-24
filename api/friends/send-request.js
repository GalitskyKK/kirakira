/**
 * API для отправки запроса дружбы
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
    const { requesterTelegramId, addresseeTelegramId } = req.body

    // Валидация входных данных
    if (!requesterTelegramId || !addresseeTelegramId) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: requesterTelegramId, addresseeTelegramId',
      })
    }

    // Проверяем, что пользователи разные
    if (requesterTelegramId === addresseeTelegramId) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя отправить запрос дружбы самому себе',
      })
    }

    // Проверяем существование пользователей
    const [{ data: requester }, { data: addressee }] = await Promise.all([
      supabase
        .from('users')
        .select('telegram_id, first_name')
        .eq('telegram_id', requesterTelegramId)
        .single(),
      supabase
        .from('users')
        .select('telegram_id, first_name')
        .eq('telegram_id', addresseeTelegramId)
        .single(),
    ])

    if (!requester || !addressee) {
      return res.status(404).json({
        success: false,
        error: 'Один из пользователей не найден',
      })
    }

    // Проверяем существующие отношения
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('status, requester_telegram_id')
      .or(
        `and(requester_telegram_id.eq.${requesterTelegramId},addressee_telegram_id.eq.${addresseeTelegramId}),` +
          `and(requester_telegram_id.eq.${addresseeTelegramId},addressee_telegram_id.eq.${requesterTelegramId})`
      )
      .single()

    if (existingFriendship) {
      let message = ''
      switch (existingFriendship.status) {
        case 'accepted':
          message = 'Вы уже друзья'
          break
        case 'pending':
          if (
            existingFriendship.requester_telegram_id === requesterTelegramId
          ) {
            message = 'Запрос дружбы уже отправлен'
          } else {
            message = 'У вас есть входящий запрос от этого пользователя'
          }
          break
        case 'declined':
          message = 'Запрос дружбы был отклонен'
          break
        case 'blocked':
          message = 'Этот пользователь заблокирован'
          break
      }
      return res.status(400).json({
        success: false,
        error: message,
      })
    }

    // Создаем запрос дружбы
    const { data: newFriendship, error: insertError } = await supabase
      .from('friendships')
      .insert({
        requester_telegram_id: requesterTelegramId,
        addressee_telegram_id: addresseeTelegramId,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Friendship creation error:', insertError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка при создании запроса дружбы',
      })
    }

    // Отправляем уведомление через Telegram Bot (опционально)
    try {
      const notificationMessage = `🤝 Новый запрос дружбы!\n\n${requester.first_name} хочет добавить вас в друзья в KiraKira!\n\nОткройте приложение, чтобы принять или отклонить запрос.`

      // Здесь можно отправить уведомление через Bot API
      // await sendTelegramNotification(addresseeTelegramId, notificationMessage)
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError)
    }

    res.status(200).json({
      success: true,
      data: {
        friendshipId: newFriendship.id,
        message: `Запрос дружбы отправлен пользователю ${addressee.first_name}!`,
      },
    })
  } catch (error) {
    console.error('Send friend request error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// Функция для отправки уведомления через Telegram Bot
async function sendTelegramNotification(telegramId, message) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return
  }

  try {
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
            inline_keyboard: [
              [
                {
                  text: '👀 Посмотреть запросы',
                  web_app: {
                    url:
                      process.env.WEBAPP_URL + '?tab=community&view=requests',
                  },
                },
              ],
            ],
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

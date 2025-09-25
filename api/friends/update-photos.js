/**
 * API для массового обновления аватарок друзей
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
      return null
    }

    // Формируем URL для скачивания
    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileResult.result.file_path}`

    return photoUrl
  } catch (error) {
    console.error(`Error getting photo for user ${telegramId}:`, error)
    return null
  }
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
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const { telegramId } = req.body

    // Валидация входных данных
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    const supabase = await getSupabaseClient()

    // Получаем всех друзей пользователя
    const { data: friends, error: friendsError } = await supabase.rpc(
      'get_user_friends',
      { user_telegram_id: parseInt(telegramId) }
    )

    if (friendsError) {
      console.error('Friends fetch error:', friendsError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка при получении списка друзей',
      })
    }

    const results = []
    const batchSize = 5 // Обрабатываем по 5 пользователей одновременно

    console.log(`🔍 Updating photos for ${friends.length} friends...`)

    // Обрабатываем друзей батчами чтобы не перегрузить Telegram API
    for (let i = 0; i < friends.length; i += batchSize) {
      const batch = friends.slice(i, i + batchSize)

      const batchPromises = batch.map(async friend => {
        try {
          // Проверяем нужно ли обновлять фото
          const { data: userData } = await supabase
            .from('users')
            .select('photo_url, updated_at')
            .eq('telegram_id', friend.friend_telegram_id)
            .single()

          // Пропускаем если фото обновлялось недавно (менее дня назад)
          if (userData?.photo_url && userData.updated_at) {
            const lastUpdate = new Date(userData.updated_at)
            const now = new Date()
            const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24)

            if (daysSinceUpdate < 1) {
              return {
                telegramId: friend.friend_telegram_id,
                photoUrl: userData.photo_url,
                status: 'skipped',
                message: 'Photo is up to date',
              }
            }
          }

          // Получаем новое фото
          const photoUrl = await getTelegramUserPhoto(friend.friend_telegram_id)

          // Обновляем в базе данных
          const { error: updateError } = await supabase
            .from('users')
            .update({ photo_url: photoUrl })
            .eq('telegram_id', friend.friend_telegram_id)

          if (updateError) {
            throw new Error(updateError.message)
          }

          return {
            telegramId: friend.friend_telegram_id,
            photoUrl,
            status: 'updated',
            message: photoUrl ? 'Photo updated' : 'No photo found',
          }
        } catch (error) {
          console.error(
            `Error updating photo for user ${friend.friend_telegram_id}:`,
            error
          )
          return {
            telegramId: friend.friend_telegram_id,
            photoUrl: null,
            status: 'error',
            message: error.message,
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Небольшая пауза между батчами
      if (i + batchSize < friends.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const updatedCount = results.filter(r => r.status === 'updated').length
    const skippedCount = results.filter(r => r.status === 'skipped').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(
      `✅ Photos update completed: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`
    )

    res.status(200).json({
      success: true,
      data: {
        total: friends.length,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
        results: results,
      },
    })
  } catch (error) {
    console.error('Update friends photos error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

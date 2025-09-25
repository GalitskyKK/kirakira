/**
 * API для обновления аватарки пользователя через Telegram Bot API
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
 * Обновляет аватарку пользователя в базе данных
 * @param {number} telegramId - ID пользователя в Telegram
 * @param {string|null} photoUrl - URL аватарки
 */
async function updateUserPhoto(telegramId, photoUrl) {
  const supabase = await getSupabaseClient()

  const { error } = await supabase
    .from('users')
    .update({ photo_url: photoUrl })
    .eq('telegram_id', telegramId)

  if (error) {
    throw new Error(`Failed to update user photo: ${error.message}`)
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
    await updateUserPhoto(telegramId, photoUrl)

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

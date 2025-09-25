/**
 * API для поиска пользователей по реферальному коду
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { referralCode, searcherTelegramId } = req.query

    // Валидация входных данных
    if (!referralCode || !searcherTelegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: referralCode, searcherTelegramId',
      })
    }

    // Инициализируем Supabase клиент
    const supabase = await getSupabaseClient()

    // Проверяем, что пользователь не ищет сам себя
    const { data: searcherReferral } = await supabase
      .from('user_referral_codes')
      .select('referral_code')
      .eq('telegram_id', searcherTelegramId)
      .single()

    if (
      searcherReferral &&
      searcherReferral.referral_code.toUpperCase() ===
        referralCode.toUpperCase()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Вы не можете добавить себя в друзья',
      })
    }

    // Ищем пользователя по реферальному коду
    console.log(
      '🔍 SEARCH DEBUG: Looking for code:',
      referralCode.toUpperCase()
    )

    const { data: foundUsers, error: searchError } = await supabase.rpc(
      'find_user_by_referral_code',
      { code: referralCode.toUpperCase() }
    )

    console.log('🔍 SEARCH DEBUG: Raw result:', { foundUsers, searchError })

    if (searchError) {
      console.error('Supabase search error:', searchError)
      return res.status(500).json({
        success: false,
        error: 'Database error during search',
      })
    }

    if (!foundUsers || foundUsers.length === 0) {
      console.log(
        '🔍 SEARCH DEBUG: No users found for code:',
        referralCode.toUpperCase()
      )
      return res.status(404).json({
        success: false,
        error: 'Пользователь с таким реферальным кодом не найден',
      })
    }

    const foundUser = foundUsers[0]
    console.log('🔍 SEARCH DEBUG: Found user:', foundUser)

    // Проверяем существующие отношения дружбы
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('status')
      .or(
        `and(requester_telegram_id.eq.${searcherTelegramId},addressee_telegram_id.eq.${foundUser.telegram_id}),` +
          `and(requester_telegram_id.eq.${foundUser.telegram_id},addressee_telegram_id.eq.${searcherTelegramId})`
      )
      .single()

    let relationshipStatus = 'none'
    if (existingFriendship) {
      relationshipStatus = existingFriendship.status
    }

    console.log('🔍 SEARCH DEBUG: Relationship status:', relationshipStatus)

    // Формируем ответ
    const result = {
      user: {
        telegramId: foundUser.telegram_id,
        firstName: foundUser.first_name,
        lastName: foundUser.last_name,
        username: foundUser.username,
        gardenElements: foundUser.garden_elements,
        currentStreak: foundUser.current_streak,
      },
      relationshipStatus,
      canSendRequest: relationshipStatus === 'none',
    }

    console.log('🔍 SEARCH DEBUG: Final result:', result)

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Friend search error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

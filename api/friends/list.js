/**
 * API для получения списка друзей и запросов дружбы
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, type = 'all' } = req.query

    // Валидация входных данных
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    // Инициализируем Supabase клиент
    const supabase = await getSupabaseClient()
    const result = {}

    // Получаем принятых друзей
    if (type === 'all' || type === 'friends') {
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

      result.friends = friends.map(friend => ({
        telegramId: friend.friend_telegram_id,
        firstName: friend.friend_first_name,
        lastName: friend.friend_last_name,
        username: friend.friend_username,
        gardenElements: friend.friend_garden_elements,
        currentStreak: friend.friend_current_streak,
        friendshipDate: friend.friendship_date,
        isOnline: false, // Можно реализовать отдельно через WebSocket или timestamp последней активности
      }))
    }

    // Получаем входящие запросы дружбы
    if (type === 'all' || type === 'incoming') {
      const { data: incomingRequests, error: incomingError } = await supabase
        .from('friendships')
        .select(
          `
          id,
          requester_telegram_id,
          created_at,
          users!friendships_requester_telegram_id_fkey (
            telegram_id,
            first_name,
            last_name,
            username
          )
        `
        )
        .eq('addressee_telegram_id', telegramId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (incomingError) {
        console.error('Incoming requests fetch error:', incomingError)
        return res.status(500).json({
          success: false,
          error: 'Ошибка при получении входящих запросов',
        })
      }

      // Получаем статистику для каждого запроса
      const requestsWithStats = await Promise.all(
        incomingRequests.map(async request => {
          const requesterTelegramId = request.requester_telegram_id

          // Получаем статистику сада
          const { data: gardenStats } = await supabase
            .from('garden_elements')
            .select('id')
            .eq('telegram_id', requesterTelegramId)

          // Получаем статистику настроения
          const { data: moodStats } = await supabase
            .from('mood_entries')
            .select('id')
            .eq('telegram_id', requesterTelegramId)
            .gte(
              'mood_date',
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            )

          return {
            requestId: request.id,
            telegramId: requesterTelegramId,
            firstName: request.users?.first_name || 'Неизвестный',
            lastName: request.users?.last_name || '',
            username: request.users?.username || '',
            gardenElements: gardenStats?.length || 0,
            currentStreak: moodStats?.length || 0,
            requestDate: request.created_at,
          }
        })
      )

      result.incomingRequests = requestsWithStats
    }

    // Получаем исходящие запросы дружбы
    if (type === 'all' || type === 'outgoing') {
      const { data: outgoingRequests, error: outgoingError } = await supabase
        .from('friendships')
        .select(
          `
          id,
          addressee_telegram_id,
          status,
          created_at,
          users!friendships_addressee_telegram_id_fkey (
            telegram_id,
            first_name,
            last_name,
            username
          )
        `
        )
        .eq('requester_telegram_id', telegramId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (outgoingError) {
        console.error('Outgoing requests fetch error:', outgoingError)
        return res.status(500).json({
          success: false,
          error: 'Ошибка при получении исходящих запросов',
        })
      }

      result.outgoingRequests = outgoingRequests.map(request => ({
        requestId: request.id,
        telegramId: request.addressee_telegram_id,
        firstName: request.users?.first_name || 'Неизвестный',
        lastName: request.users?.last_name || '',
        username: request.users?.username || '',
        status: request.status,
        requestDate: request.created_at,
      }))
    }

    // Получаем реферальный код пользователя
    if (type === 'all' || type === 'referral') {
      let { data: referralData } = await supabase
        .from('user_referral_codes')
        .select('referral_code')
        .eq('telegram_id', telegramId)
        .single()

      // Если реферального кода нет - создаем автоматически (для старых пользователей)
      if (!referralData) {
        console.log(`Creating referral code for existing user: ${telegramId}`)

        // Проверяем что пользователь существует
        const { data: userData } = await supabase
          .from('users')
          .select('telegram_id')
          .eq('telegram_id', telegramId)
          .single()

        if (userData) {
          try {
            // Создаем реферальный код
            const { data: newReferralCode, error: rpcError } =
              await supabase.rpc('generate_unique_referral_code')

            if (newReferralCode && !rpcError) {
              // Сохраняем код
              const { data: insertedData, error: insertError } = await supabase
                .from('user_referral_codes')
                .insert({
                  telegram_id: parseInt(telegramId),
                  referral_code: newReferralCode,
                })
                .select('referral_code')
                .single()

              if (!insertError) {
                referralData = insertedData
                console.log(
                  `Successfully created referral code for user ${telegramId}: ${newReferralCode}`
                )
              } else {
                console.error('Error inserting referral code:', insertError)
              }
            } else {
              console.error('Error generating referral code:', rpcError)
            }
          } catch (autoCreateError) {
            console.error('Error auto-creating referral code:', autoCreateError)
          }
        }
      }

      result.referralCode = referralData?.referral_code || null
    }

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Friends list error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

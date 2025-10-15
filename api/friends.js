/**
 * 🤝 ОБЪЕДИНЕННЫЙ API ДЛЯ ДРУЗЕЙ
 * Включает: list, search, send-request, respond-request, update-photos
 */

// 🔒 Функция для инициализации Supabase с JWT (RLS-защищенный)
async function getSupabaseClient(jwt = null) {
  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL not configured')
  }

  // ✅ ПРИОРИТЕТ: Используем JWT для RLS-защищенных запросов
  if (jwt) {
    try {
      const { createAuthenticatedSupabaseClient } = await import('./_jwt.js')
      console.log('✅ Using JWT-authenticated Supabase client (RLS enabled)')
      return await createAuthenticatedSupabaseClient(jwt)
    } catch (error) {
      console.error('❌ Failed to create JWT client:', error)
      // Fallback на SERVICE_ROLE_KEY ниже
    }
  }

  // ⚠️ FALLBACK: SERVICE_ROLE_KEY (минует RLS, использовать только для admin операций)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured')
  }

  console.warn('⚠️ Using SERVICE_ROLE_KEY (bypasses RLS) - migrate to JWT!')
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

// ===============================================
// 📋 ACTION: LIST - Получение списка друзей
// ===============================================
async function handleList(req, res) {
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
    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)
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
        photoUrl: friend.friend_photo_url,
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
            username,
            photo_url
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
            photoUrl: request.users?.photo_url || null,
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
            username,
            photo_url
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
        photoUrl: request.users?.photo_url || null,
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

// ===============================================
// 🔍 ACTION: SEARCH - Поиск по реферальному коду или глобальный поиск
// ===============================================
async function handleSearch(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      referralCode,
      searcherTelegramId,
      query,
      page = '1',
      limit = '10',
    } = req.query

    // Инициализируем Supabase клиент
    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // ========================================
    // ВАРИАНТ 1: Поиск по реферальному коду
    // ========================================
    if (referralCode) {
      // Валидация входных данных
      if (!searcherTelegramId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: searcherTelegramId',
        })
      }

      // Ищем пользователя по реферальному коду
      const { data: referralData, error: referralError } = await supabase
        .from('user_referral_codes')
        .select(
          `
          telegram_id,
          users (
            telegram_id,
            first_name,
            last_name,
            username,
            total_elements,
            current_streak
          )
        `
        )
        .eq('referral_code', referralCode.toUpperCase())
        .single()

      if (referralError || !referralData) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь с таким реферальным кодом не найден',
        })
      }

      const targetUserId = referralData.telegram_id
      const userData = referralData.users

      // Проверяем что пользователь не ищет сам себя
      if (parseInt(searcherTelegramId) === targetUserId) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя добавить себя в друзья',
        })
      }

      // Проверяем существующие отношения между пользователями
      const { data: existingRelation, error: relationError } = await supabase
        .from('friendships')
        .select('status')
        .or(
          `and(requester_telegram_id.eq.${searcherTelegramId},addressee_telegram_id.eq.${targetUserId}),and(requester_telegram_id.eq.${targetUserId},addressee_telegram_id.eq.${searcherTelegramId})`
        )
        .single()

      let relationshipStatus = 'none'
      let canSendRequest = true

      if (existingRelation) {
        relationshipStatus = existingRelation.status
        canSendRequest = false

        if (relationshipStatus === 'declined') {
          // Можно отправить новый запрос после отклонения
          canSendRequest = true
          relationshipStatus = 'none'
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            telegramId: targetUserId,
            firstName: userData?.first_name || 'Пользователь',
            lastName: userData?.last_name || '',
            username: userData?.username || '',
            gardenElements: userData?.total_elements || 0,
            currentStreak: userData?.current_streak || 0,
          },
          relationshipStatus,
          canSendRequest,
        },
      })
    }

    // ========================================
    // ВАРИАНТ 2: Глобальный поиск пользователей
    // ========================================
    if (query) {
      // Валидация входных данных
      if (!searcherTelegramId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: searcherTelegramId',
        })
      }

      if (query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Поисковый запрос должен содержать минимум 2 символа',
        })
      }

      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)
      const offset = (pageNum - 1) * limitNum

      // Убираем @ из запроса если он есть
      const cleanQuery = query.trim().replace(/^@/, '')
      const searchPattern = `%${cleanQuery.toLowerCase()}%`

      console.log(
        `🔍 Global user search: query="${query}", cleanQuery="${cleanQuery}", searchPattern="${searchPattern}", page=${pageNum}, limit=${limitNum}`
      )

      // Тестовый запрос - проверим есть ли вообще пользователи в базе
      const testQuery = await supabase
        .from('users')
        .select('telegram_id, username, first_name')
        .limit(5)

      console.log('🔍 Test query - all users (first 5):', {
        error: testQuery.error,
        data: testQuery.data,
      })

      // Поиск пользователей по username или firstName
      // Используем отдельные запросы и объединяем результаты
      const usernameQuery = supabase
        .from('users')
        .select(
          'telegram_id, first_name, last_name, username, photo_url, level, total_elements, current_streak, registration_date, privacy_settings'
        )
        .neq('telegram_id', parseInt(searcherTelegramId))
        .ilike('username', `%${cleanQuery}%`)

      const firstNameQuery = supabase
        .from('users')
        .select(
          'telegram_id, first_name, last_name, username, photo_url, level, total_elements, current_streak, registration_date, privacy_settings'
        )
        .neq('telegram_id', parseInt(searcherTelegramId))
        .ilike('first_name', `%${cleanQuery}%`)

      // Выполняем оба запроса параллельно
      const [usernameResult, firstNameResult] = await Promise.all([
        usernameQuery.order('username', { ascending: true, nullsFirst: false }),
        firstNameQuery.order('first_name', {
          ascending: true,
          nullsFirst: false,
        }),
      ])

      console.log('🔍 Username search result:', {
        error: usernameResult.error,
        dataLength: usernameResult.data?.length || 0,
        data: usernameResult.data?.slice(0, 2), // Показываем первые 2 результата для отладки
      })

      console.log('🔍 First name search result:', {
        error: firstNameResult.error,
        dataLength: firstNameResult.data?.length || 0,
        data: firstNameResult.data?.slice(0, 2), // Показываем первые 2 результата для отладки
      })

      if (usernameResult.error) {
        console.error('Username search error:', usernameResult.error)
        return res.status(500).json({
          success: false,
          error: 'Ошибка поиска по username',
        })
      }

      if (firstNameResult.error) {
        console.error('First name search error:', firstNameResult.error)
        return res.status(500).json({
          success: false,
          error: 'Ошибка поиска по имени',
        })
      }

      // Объединяем результаты и убираем дубликаты
      const allUsers = [
        ...(usernameResult.data || []),
        ...(firstNameResult.data || []),
      ]
      const uniqueUsers = allUsers.filter(
        (user, index, self) =>
          index === self.findIndex(u => u.telegram_id === user.telegram_id)
      )

      // Применяем пагинацию к объединенному результату
      const users = uniqueUsers.slice(offset, offset + limitNum)

      console.log(
        `🔍 Found ${uniqueUsers.length} total users, returning ${users.length} users`
      )

      // Фильтруем пользователей с учетом privacy settings
      const visibleUsers = (users || []).filter(user => {
        // privacy_settings может быть строкой или объектом
        let privacySettings = user.privacy_settings

        // Если это строка - парсим JSON
        if (typeof privacySettings === 'string') {
          try {
            privacySettings = JSON.parse(privacySettings)
          } catch (e) {
            console.error(
              'Failed to parse privacy_settings for user:',
              user.telegram_id
            )
            privacySettings = {}
          }
        }

        const showProfile = privacySettings?.showProfile ?? true
        console.log(
          `🔍 User ${user.telegram_id} (${user.username || user.first_name}): showProfile=${showProfile}`
        )
        return showProfile
      })

      // Проверяем отношения для каждого найденного пользователя
      const usersWithRelations = await Promise.all(
        visibleUsers.map(async user => {
          // Проверяем существующие отношения
          const { data: friendship } = await supabase
            .from('friendships')
            .select('status')
            .or(
              `and(requester_telegram_id.eq.${searcherTelegramId},addressee_telegram_id.eq.${user.telegram_id}),and(requester_telegram_id.eq.${user.telegram_id},addressee_telegram_id.eq.${searcherTelegramId})`
            )
            .single()

          let relationshipStatus = 'none'
          if (friendship) {
            relationshipStatus = friendship.status
          }

          // Парсим privacy_settings если это строка
          let privacySettings = user.privacy_settings
          if (typeof privacySettings === 'string') {
            try {
              privacySettings = JSON.parse(privacySettings)
            } catch (e) {
              privacySettings = {}
            }
          }

          return {
            telegram_id: user.telegram_id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
            level: user.level,
            registration_date: user.registration_date,
            total_elements: user.total_elements,
            current_streak: user.current_streak,
            relationshipStatus,
            privacy_settings: privacySettings,
          }
        })
      )

      // Проверяем есть ли еще результаты
      const hasMore = visibleUsers.length === limitNum + 1
      const usersToReturn = hasMore
        ? usersWithRelations.slice(0, limitNum)
        : usersWithRelations

      console.log(`✅ Found ${usersToReturn.length} users, hasMore: ${hasMore}`)

      return res.status(200).json({
        success: true,
        data: {
          users: usersToReturn,
          hasMore,
          nextPage: hasMore ? pageNum + 1 : undefined,
          total: usersToReturn.length,
        },
      })
    }

    // Если нет ни referralCode, ни query
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: referralCode or query',
    })
  } catch (error) {
    console.error('Friend search error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// ➕ ACTION: SEND-REQUEST - Отправка запроса дружбы
// ===============================================
async function handleSendRequest(req, res) {
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

    // Проверяем что пользователь не пытается добавить себя
    if (requesterTelegramId === addresseeTelegramId) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя добавить себя в друзья',
      })
    }

    // Инициализируем Supabase клиент
    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Проверяем существующие отношения
    const { data: existingRelation, error: checkError } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_telegram_id.eq.${requesterTelegramId},addressee_telegram_id.eq.${addresseeTelegramId}),and(requester_telegram_id.eq.${addresseeTelegramId},addressee_telegram_id.eq.${requesterTelegramId})`
      )
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 означает "no rows returned" - это нормально
      console.error('Check existing relation error:', checkError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка проверки существующих отношений',
      })
    }

    if (existingRelation) {
      if (existingRelation.status === 'accepted') {
        return res.status(400).json({
          success: false,
          error: 'Вы уже друзья',
        })
      } else if (existingRelation.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Запрос дружбы уже отправлен',
        })
      } else if (existingRelation.status === 'declined') {
        // Обновляем статус с declined на pending
        const { error: updateError } = await supabase
          .from('friendships')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRelation.id)

        if (updateError) {
          console.error('Update declined request error:', updateError)
          return res.status(500).json({
            success: false,
            error: 'Ошибка обновления запроса',
          })
        }

        return res.status(200).json({
          success: true,
          data: {
            message: 'Запрос дружбы отправлен повторно',
          },
        })
      }
    }

    // Создаем новый запрос дружбы
    const { error: insertError } = await supabase.from('friendships').insert({
      requester_telegram_id: requesterTelegramId,
      addressee_telegram_id: addresseeTelegramId,
      status: 'pending',
    })

    if (insertError) {
      console.error('Insert friendship request error:', insertError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка создания запроса дружбы',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Запрос дружбы отправлен',
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

// ===============================================
// ✅ ACTION: RESPOND-REQUEST - Ответ на запрос дружбы
// ===============================================
async function handleRespondRequest(req, res) {
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

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "accept" or "decline"',
      })
    }

    // Инициализируем Supabase клиент
    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Находим запрос дружбы
    const { data: friendshipRequest, error: findError } = await supabase
      .from('friendships')
      .select('*')
      .eq('requester_telegram_id', requesterTelegramId)
      .eq('addressee_telegram_id', telegramId)
      .eq('status', 'pending')
      .single()

    if (findError || !friendshipRequest) {
      return res.status(404).json({
        success: false,
        error: 'Запрос дружбы не найден',
      })
    }

    // Обновляем статус запроса
    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { error: updateError } = await supabase
      .from('friendships')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipRequest.id)

    if (updateError) {
      console.error('Update friendship status error:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка обновления статуса запроса',
      })
    }

    const message =
      action === 'accept' ? 'Запрос дружбы принят' : 'Запрос дружбы отклонен'

    res.status(200).json({
      success: true,
      data: {
        message,
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

// ===============================================
// 📸 ACTION: UPDATE-PHOTOS - Обновление аватарок друзей
// ===============================================
async function handleUpdatePhotos(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

// ===============================================
// 🎯 ГЛАВНЫЙ ОБРАБОТЧИК - Роутинг по действиям
// ===============================================

// Импортируем middleware аутентификации
import { withAuth, verifyTelegramId } from './_auth.js'

// Защищенный handler с аутентификацией
async function protectedHandler(req, res) {
  try {
    // Получаем действие из query параметров
    const { action } = req.query

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: action',
      })
    }

    // 🔐 Проверяем что пользователь работает со своими данными
    const requestedTelegramId =
      req.query.telegramId ||
      req.query.searcherTelegramId ||
      req.body.requesterTelegramId ||
      req.body.telegramId

    if (
      requestedTelegramId &&
      !verifyTelegramId(requestedTelegramId, req.auth.telegramId)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only access your own data',
      })
    }

    // Роутинг по действиям
    switch (action) {
      case 'list':
        return await handleList(req, res)
      case 'search':
        return await handleSearch(req, res)
      case 'send-request':
        return await handleSendRequest(req, res)
      case 'respond-request':
        return await handleRespondRequest(req, res)
      case 'update-photos':
        return await handleUpdatePhotos(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: list, search, send-request, respond-request, update-photos`,
        })
    }
  } catch (error) {
    console.error('Friends API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

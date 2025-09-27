/**
 * 🌱 ОБЪЕДИНЕННЫЙ API ДЛЯ САДА
 * Включает: add-element, history, update-position
 */

// Общая функция для инициализации Supabase
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

// ===============================================
// ➕ ACTION: ADD-ELEMENT - Добавление элемента сада
// ===============================================
async function handleAddElement(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, element, telegramUserData } = req.body

    // Валидация входных данных
    if (!telegramId || !element) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: telegramId, element',
      })
    }

    console.log(
      `🌱 Saving garden element to Supabase for user ${telegramId}:`,
      element
    )

    const supabase = await getSupabaseClient()

    // 🔥 АВТОМАТИЧЕСКИ СОЗДАЕМ ПОЛЬЗОВАТЕЛЯ ЕСЛИ ЕГО НЕТ
    if (telegramUserData) {
      console.log(`👤 Ensuring user exists with data:`, telegramUserData)

      const { error: userError } = await supabase.from('users').upsert(
        {
          telegram_id: telegramId,
          user_id: telegramUserData.userId || `user_${telegramId}`,
          username: telegramUserData.username || null,
          first_name: telegramUserData.firstName || null,
          last_name: telegramUserData.lastName || null,
          language_code: telegramUserData.languageCode || 'ru',
          photo_url: telegramUserData.photoUrl || null,
          // registration_date будет равна created_at (автоматически в БД)
          last_visit_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'telegram_id',
        }
      )

      if (userError) {
        console.error('Auto user creation error:', userError)
        // Продолжаем выполнение, так как пользователь может уже существовать
      } else {
        console.log(`✅ User ${telegramId} ensured in database`)
      }
    }

    // Сохраняем элемент сада
    const { data, error } = await supabase
      .from('garden_elements')
      .insert({
        telegram_id: telegramId,
        element_type: element.type,
        rarity: element.rarity,
        position_x: element.position.x,
        position_y: element.position.y,
        mood_influence: element.moodInfluence,
        unlock_date: element.unlockDate || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase garden element insert failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to save garden element',
      })
    }

    console.log(`✅ Garden element saved to Supabase:`, data)

    // 🔥 ИСПРАВЛЕНИЕ: Обновляем ВСЮ статистику пользователя (дни, стрики, элементы)
    const { error: updateError } = await supabase.rpc('update_user_stats', {
      target_telegram_id: telegramId,
    })

    if (updateError) {
      console.warn('Failed to update user stats:', updateError)
      // Не критично, продолжаем
    } else {
      console.log('✅ User stats updated after adding garden element')
    }

    // 🏆 НАЧИСЛЯЕМ ОПЫТ ЗА НОВОЕ РАСТЕНИЕ
    try {
      // Базовый опыт за растение
      const addPlantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/profile?action=add_experience`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId,
            experiencePoints: 15, // EXPERIENCE_REWARDS.NEW_PLANT
            reason: `garden_element: ${element.type} (${element.rarity})`,
          }),
        }
      )

      // Дополнительный опыт за редкие элементы
      const rareTypes = ['rare', 'epic', 'legendary']
      if (rareTypes.includes(element.rarity?.toLowerCase())) {
        const addRareResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/profile?action=add_experience`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId,
              experiencePoints: 50, // EXPERIENCE_REWARDS.RARE_PLANT
              reason: `rare_element: ${element.type} (${element.rarity})`,
            }),
          }
        )

        if (addRareResponse.ok) {
          console.log(
            `🏆 Added rare element bonus XP for ${element.rarity} ${element.type}`
          )
        }
      }

      if (addPlantResponse.ok) {
        console.log(`🏆 Added XP for new garden element: ${element.type}`)
      }
    } catch (xpError) {
      console.warn('⚠️ Failed to add XP for garden element:', xpError)
      // Не критично, продолжаем
    }

    res.status(200).json({
      success: true,
      data: {
        id: data.id,
        saved: true,
        storage: 'supabase',
        message: 'Garden element saved successfully',
      },
    })
  } catch (error) {
    console.error('Garden add-element error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 📊 ACTION: HISTORY - Получение истории элементов сада
// ===============================================
async function handleHistory(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId } = req.query

    // Валидация входных данных
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    console.log(
      `🌱 Loading garden history from Supabase for user ${telegramId}`
    )

    const supabase = await getSupabaseClient()

    // Получаем элементы сада
    const { data, error } = await supabase
      .from('garden_elements')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('unlock_date', { ascending: false })

    if (error) {
      console.error('Supabase garden history fetch failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch garden history',
      })
    }

    console.log(`✅ Loaded ${data.length} garden elements from Supabase`)

    res.status(200).json({
      success: true,
      data: {
        gardenElements: data, // Возвращаем сырые данные как ожидает frontend
        total: data.length,
        storage: 'supabase',
      },
    })
  } catch (error) {
    console.error('Garden history error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 🔄 ACTION: UPDATE-POSITION - Обновление позиции элемента
// ===============================================
async function handleUpdatePosition(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, elementId, position } = req.body

    // Валидация входных данных
    if (!telegramId || !elementId || !position) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: telegramId, elementId, position',
      })
    }

    const { x: positionX, y: positionY } = position

    if (
      typeof positionX !== 'number' ||
      typeof positionY !== 'number' ||
      positionX < 0 ||
      positionX > 100 ||
      positionY < 0 ||
      positionY > 100
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid position coordinates. Must be numbers between 0-100',
      })
    }

    console.log(
      `🗄️ Updating element position in Supabase for user ${telegramId}:`,
      {
        elementId,
        positionX,
        positionY,
      }
    )

    const supabase = await getSupabaseClient()

    // 🔧 ИСПРАВЛЕНИЕ: Убираем префикс "element_" из UUID для совместимости с базой данных
    const cleanElementId = elementId.startsWith('element_')
      ? elementId.replace('element_', '')
      : elementId

    // Обновляем позицию элемента
    const { data, error } = await supabase
      .from('garden_elements')
      .update({
        position_x: positionX,
        position_y: positionY,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cleanElementId)
      .eq('telegram_id', telegramId) // Дополнительная защита
      .select()

    if (error) {
      console.error('Supabase position update failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update element position',
      })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Element not found or no permission to update',
      })
    }

    console.log(`✅ Element position updated in Supabase:`, data[0])

    res.status(200).json({
      success: true,
      data: {
        elementId: `element_${data[0].id}`,
        position: {
          x: data[0].position_x,
          y: data[0].position_y,
        },
        updatedAt: data[0].updated_at,
        storage: 'supabase',
        message: 'Element position updated successfully',
      },
    })
  } catch (error) {
    console.error('Garden update-position error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 👀 ACTION: VIEW-FRIEND-GARDEN - Просмотр сада друга
// ===============================================
async function handleViewFriendGarden(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { viewerTelegramId, friendTelegramId } = req.query

    // Валидация входных данных
    if (!viewerTelegramId || !friendTelegramId) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: viewerTelegramId, friendTelegramId',
      })
    }

    // Проверяем что не пытаются посмотреть свой собственный сад
    if (parseInt(viewerTelegramId) === parseInt(friendTelegramId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot view your own garden through friend view',
      })
    }

    console.log(
      `👀 Friend garden view request: ${viewerTelegramId} wants to view ${friendTelegramId}'s garden`
    )

    const supabase = await getSupabaseClient()

    // 1. Проверяем что пользователи являются друзьями
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('status')
      .or(
        `and(requester_telegram_id.eq.${viewerTelegramId},addressee_telegram_id.eq.${friendTelegramId}),and(requester_telegram_id.eq.${friendTelegramId},addressee_telegram_id.eq.${viewerTelegramId})`
      )
      .eq('status', 'accepted')
      .single()

    if (friendshipError || !friendship) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: you are not friends with this user',
      })
    }

    // 2. Проверяем настройки приватности владельца сада
    const { data: ownerSettings, error: settingsError } = await supabase
      .from('users')
      .select('first_name, last_name, username, photo_url, share_garden')
      .eq('telegram_id', friendTelegramId)
      .single()

    if (settingsError) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found',
      })
    }

    // Проверяем разрешение на просмотр сада (по умолчанию true если поле не задано)
    const canShareGarden = ownerSettings.share_garden !== false

    if (!canShareGarden) {
      return res.status(403).json({
        success: false,
        error: 'This user has disabled garden sharing',
      })
    }

    // 3. Получаем элементы сада друга
    const { data: gardenElements, error: gardenError } = await supabase
      .from('garden_elements')
      .select('*')
      .eq('telegram_id', friendTelegramId)
      .order('unlock_date', { ascending: true }) // Сортируем по дате создания

    if (gardenError) {
      console.error('Failed to fetch friend garden elements:', gardenError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch garden data',
      })
    }

    // 4. Получаем статистику друга
    const { data: friendStats, error: statsError } = await supabase
      .from('users')
      .select('current_streak, total_elements, created_at')
      .eq('telegram_id', friendTelegramId)
      .single()

    console.log(
      `✅ Loaded ${gardenElements.length} garden elements for friend ${friendTelegramId}`
    )

    // 5. Форматируем ответ с правильными координатами
    res.status(200).json({
      success: true,
      data: {
        friendInfo: {
          telegramId: parseInt(friendTelegramId),
          firstName: ownerSettings.first_name || 'Друг',
          lastName: ownerSettings.last_name || '',
          username: ownerSettings.username || '',
          photoUrl: ownerSettings.photo_url || null,
          currentStreak: friendStats?.current_streak || 0,
          totalElements: friendStats?.total_elements || gardenElements.length,
          gardenCreated: friendStats?.created_at || null,
        },
        gardenElements: gardenElements.map(element => ({
          id: element.id,
          type: element.element_type,
          rarity: element.rarity,
          position: {
            x: element.position_x,
            y: element.position_y,
          },
          unlockDate: element.unlock_date,
          moodInfluence: element.mood_influence,
          createdAt: element.created_at,
        })),
        total: gardenElements.length,
        canEdit: false, // Всегда false для чужого сада
        viewMode: 'friend',
      },
    })
  } catch (error) {
    console.error('View friend garden error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 🎯 ГЛАВНЫЙ ОБРАБОТЧИК - Роутинг по действиям
// ===============================================
export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Получаем действие из query параметров
    const { action } = req.query

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: action',
      })
    }

    // Роутинг по действиям
    switch (action) {
      case 'add-element':
        return await handleAddElement(req, res)
      case 'history':
        return await handleHistory(req, res)
      case 'update-position':
        return await handleUpdatePosition(req, res)
      case 'view-friend-garden':
        return await handleViewFriendGarden(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: add-element, history, update-position, view-friend-garden`,
        })
    }
  } catch (error) {
    console.error('Garden API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

/**
 * 🌱 ОБЪЕДИНЕННЫЙ API ДЛЯ САДА
 * Включает: add-element, history, update-position
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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
    // 🔑 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: используем переданный ID для детерминизма
    const insertData = {
      telegram_id: telegramId,
      element_type: element.type,
      rarity: element.rarity,
      position_x: element.position.x,
      position_y: element.position.y,
      mood_influence: element.moodInfluence,
      unlock_date: element.unlockDate || new Date().toISOString(),
      seasonal_variant: element.seasonalVariant || null, // 🍂 Сохраняем сезонный вариант
    }

    // Если клиент передал ID, используем его (для детерминированной генерации)
    // ВАЖНО: В PostgreSQL текстовый ID будет автоматически преобразован в UUID
    // Формат: 'user_123-2024-10-09' -> должен быть валидным UUID или будет ошибка
    if (element.id) {
      // Проверяем, что ID - это валидный UUID формат
      // Если это текстовая строка, генерируем детерминированный UUID из неё
      console.log(`🔑 Using client-provided element ID: ${element.id}`)

      // ⚠️ ВРЕМЕННОЕ РЕШЕНИЕ: Используем переданный ID как есть
      // В будущем нужно будет генерировать валидный UUID на клиенте
      // Сейчас просто используем уникальный constraint по (telegram_id + unlock_date)
      // А ID пусть генерируется сервером, но при загрузке будем использовать
      // детерминированный подход на основе данных
    }

    const { data, error } = await supabase
      .from('garden_elements')
      .insert(insertData)
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

    // 🏆 НАЧИСЛЯЕМ ОПЫТ ЗА НОВОЕ РАСТЕНИЕ (JWT-аутентифицированный RPC)
    try {
      // ✅ БЕЗОПАСНО: Используем RPC с тем же JWT-клиентом (соблюдает RLS)

      // Базовый опыт за растение (15 XP)
      const { data: plantXP, error: plantXPError } = await supabase.rpc(
        'add_user_experience',
        {
          p_telegram_id: telegramId,
          p_experience_points: 15, // EXPERIENCE_REWARDS.NEW_PLANT
        }
      )

      if (plantXPError) {
        console.error(`❌ CRITICAL: Failed to add XP for garden element:`, {
          error: plantXPError,
          telegram_id: telegramId,
          element_type: element.type,
          rarity: element.rarity,
        })
      } else {
        console.log(
          `🏆 Added 15 XP for new garden element: ${element.type}`,
          plantXP?.[0] || plantXP
        )
      }

      // Дополнительный опыт за редкие элементы (50 XP)
      const rareTypes = ['rare', 'epic', 'legendary']
      if (rareTypes.includes(element.rarity?.toLowerCase())) {
        const { data: rareXP, error: rareXPError } = await supabase.rpc(
          'add_user_experience',
          {
            p_telegram_id: telegramId,
            p_experience_points: 50, // EXPERIENCE_REWARDS.RARE_PLANT
          }
        )

        if (rareXPError) {
          console.error(`❌ CRITICAL: Failed to add rare element bonus XP:`, {
            error: rareXPError,
            telegram_id: telegramId,
            element_type: element.type,
            rarity: element.rarity,
          })
        } else {
          console.log(
            `🏆 Added 50 XP rare element bonus for ${element.rarity} ${element.type}`,
            rareXP?.[0] || rareXP
          )
        }
      }
    } catch (xpError) {
      console.error('❌ CRITICAL: Exception in XP addition:', {
        exception: xpError,
        telegram_id: telegramId,
        message: xpError?.message,
      })
      // Не критично для пользователя, но требует внимания разработчика
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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
      .select(
        'first_name, last_name, username, photo_url, share_garden, garden_theme'
      )
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
          gardenTheme: ownerSettings.garden_theme || 'light', // Добавляем тему сада друга
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
// ⬆️ ACTION: UPGRADE-ELEMENT - Улучшение элемента сада
// ===============================================
async function handleUpgradeElement(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, elementId, useFree = false } = req.body

    // Валидация входных данных
    if (!telegramId || !elementId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: telegramId, elementId',
      })
    }

    console.log(
      `⬆️ Upgrading element ${elementId} for user ${telegramId} (useFree: ${useFree})`
    )

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Вызываем PostgreSQL функцию для улучшения элемента
    const { data, error } = await supabase.rpc('upgrade_garden_element', {
      p_element_id: elementId,
      p_telegram_id: telegramId,
      p_use_free_upgrade: useFree,
    })

    if (error) {
      console.error('Supabase upgrade element failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to upgrade element',
      })
    }

    // Универсальная обработка массива/объекта
    const result = Array.isArray(data) ? data[0] : data

    // Проверяем результат функции
    if (!result || !result.success) {
      console.log(`⚠️ Upgrade failed: ${result?.error}`)
      return res.status(400).json({
        success: false,
        error: result?.error || 'Upgrade failed',
      })
    }

    console.log(`✅ Element upgrade result:`, result)

    // 🔍 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ failed_attempts
    console.log('🔍 Upgrade details:', {
      elementId,
      telegramId,
      upgraded: result.upgraded,
      newRarity: result.newRarity,
      progressBonus: result.progressBonus,
      failedAttempts: result.failedAttempts,
      cost: result.cost,
      usedFree: result.usedFree,
    })

    res.status(200).json({
      success: true,
      data: {
        upgraded: result.upgraded,
        newRarity: result.newRarity,
        xpReward: result.xpReward,
        progressBonus: result.progressBonus,
        failedAttempts: result.failedAttempts,
        cost: result.cost,
        usedFree: result.usedFree,
        message: result.upgraded
          ? 'Element upgraded successfully'
          : 'Upgrade failed, progress increased',
      },
    })
  } catch (error) {
    console.error('Garden upgrade-element error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 📊 ACTION: UPGRADE-INFO - Получение информации об улучшении
// ===============================================
async function handleUpgradeInfo(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, elementId } = req.query

    // Валидация входных данных
    if (!telegramId || !elementId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: telegramId, elementId',
      })
    }

    console.log(
      `📊 Getting upgrade info for element ${elementId} of user ${telegramId}`
    )

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Вызываем PostgreSQL функцию для получения информации
    const { data, error } = await supabase.rpc('get_element_upgrade_info', {
      p_element_id: elementId,
      p_telegram_id: telegramId,
    })

    if (error) {
      console.error('Supabase get upgrade info failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to get upgrade info',
      })
    }

    // Универсальная обработка массива/объекта
    const result = Array.isArray(data) ? data[0] : data

    // Проверяем результат функции
    if (!result || !result.success) {
      console.log(`⚠️ Get upgrade info failed: ${result?.error}`)
      return res.status(400).json({
        success: false,
        error: result?.error || 'Failed to get upgrade info',
      })
    }

    console.log(`✅ Upgrade info retrieved:`, result)

    res.status(200).json({
      success: true,
      data: {
        id: result.id,
        elementId: result.elementId,
        telegramId: result.telegramId,
        originalRarity: result.originalRarity,
        currentRarity: result.currentRarity,
        upgradeCount: result.upgradeCount || 0,
        failedAttempts: result.failedAttempts || 0,
        progressBonus: result.progressBonus || 0,
        lastUpgradeAt: result.lastUpgradeAt,
        createdAt: result.createdAt,
      },
    })
  } catch (error) {
    console.error('Garden upgrade-info error:', error)
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
    // Исключение: view-friend-garden позволяет просмотр садов друзей
    const requestedTelegramId =
      req.query.telegramId || req.body.telegramId || req.query.viewerTelegramId
    const allowedActionsWithDifferentId = ['view-friend-garden']

    if (
      requestedTelegramId &&
      !allowedActionsWithDifferentId.includes(action)
    ) {
      if (!verifyTelegramId(requestedTelegramId, req.auth.telegramId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only access your own data',
        })
      }
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
        // Проверяем что viewerTelegramId совпадает с аутентифицированным пользователем
        if (
          req.query.viewerTelegramId &&
          !verifyTelegramId(req.query.viewerTelegramId, req.auth.telegramId)
        ) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Invalid viewer credentials',
          })
        }
        return await handleViewFriendGarden(req, res)
      case 'upgrade-element':
        return await handleUpgradeElement(req, res)
      case 'upgrade-info':
        return await handleUpgradeInfo(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: add-element, history, update-position, view-friend-garden, upgrade-element, upgrade-info`,
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

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

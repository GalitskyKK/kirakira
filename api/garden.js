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

      const { error: userError } = await supabase.rpc('ensure_user_exists', {
        telegram_id: telegramId,
        user_data: telegramUserData,
      })

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

    // Обновляем счетчик элементов пользователя
    const { error: updateError } = await supabase.rpc(
      'increment_user_total_elements',
      { user_telegram_id: telegramId }
    )

    if (updateError) {
      console.warn('Failed to update user elements counter:', updateError)
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
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: add-element, history, update-position`,
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

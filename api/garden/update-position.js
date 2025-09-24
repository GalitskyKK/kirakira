import { createClient } from '@supabase/supabase-js'

/**
 * 🗄️ SUPABASE: Обновляет позицию элемента сада в базе данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} elementId - ID элемента для обновления
 * @param {number} positionX - Новая X координата
 * @param {number} positionY - Новая Y координата
 * @returns {Promise<boolean>} Успешность обновления
 */
async function updateElementPosition(
  telegramUserId,
  elementId,
  positionX,
  positionY
) {
  try {
    console.log(
      `🗄️ Updating element position in Supabase for user ${telegramUserId}:`,
      {
        elementId,
        positionX,
        positionY,
      }
    )

    // 🗄️ SUPABASE для всех окружений
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Динамический импорт для совместимости
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // Обновляем позицию элемента в базе данных
        // ⚠️ ВАЖНО: Перед включением updated_at нужно выполнить миграцию
        // из файла docs/add_updated_at_to_garden_elements.sql
        const { data, error } = await supabase
          .from('garden_elements')
          .update({
            position_x: positionX,
            position_y: positionY,
            updated_at: new Date().toISOString(), // 🔄 Включить после миграции
          })
          .eq('telegram_id', telegramUserId)
          .eq('id', elementId)
          .select()

        if (error) {
          throw new Error(`Supabase position update failed: ${error.message}`)
        }

        if (!data || data.length === 0) {
          throw new Error(
            `Element with ID ${elementId} not found for user ${telegramUserId}`
          )
        }

        console.log(
          `✅ Element position updated in Supabase for user ${telegramUserId}`
        )
        return true
      } catch (supabaseError) {
        console.error(
          `❌ Supabase position update failed:`,
          supabaseError.message
        )
        return false
      }
    }

    // 🔄 Fallback: просто логируем для разработки
    console.log(`📝 Element position updated (no database):`, {
      telegramUserId,
      elementId,
      positionX,
      positionY,
    })

    return true
  } catch (error) {
    console.error('Error updating element position:', error)
    return false
  }
}

/**
 * API handler для обновления позиции элемента
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // 🔍 ОТЛАДКА: Логируем все входящие запросы
  console.log('🔍 API /garden/update-position called:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString(),
  })

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramUserId, elementId, position } = req.body

    // Валидация входных данных
    if (!telegramUserId || typeof telegramUserId !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'telegramUserId (number) is required',
      })
    }

    if (!elementId || typeof elementId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'elementId (string) is required',
      })
    }

    if (
      !position ||
      typeof position.x !== 'number' ||
      typeof position.y !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        error: 'position object with x and y numbers is required',
      })
    }

    console.log(
      `Updating element position for Telegram user ${telegramUserId}:`,
      {
        elementId,
        position,
      }
    )

    // Обновляем позицию элемента
    const updated = await updateElementPosition(
      telegramUserId,
      elementId,
      position.x,
      position.y
    )

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update element position',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        telegramUserId,
        elementId,
        position,
        updated: true,
      },
      message: 'Element position updated successfully',
    })
  } catch (error) {
    console.error('Error updating element position:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

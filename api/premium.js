/**
 * API эндпоинт для активации премиум функций
 * POST /api/premium/activate
 * Body: { telegramUserId: number, featureId: string }
 */

/**
 * 🗄️ SUPABASE: Активирует премиум функцию для пользователя в базе данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} featureId - ID премиум функции
 * @param {string} transactionId - ID транзакции (опционально)
 * @param {string} jwt - JWT токен для RLS (опционально)
 * @returns {Promise<boolean>} Успешность активации
 */
async function activatePremiumFeature(
  telegramUserId,
  featureId,
  transactionId = null,
  jwt = null
) {
  try {
    console.log(
      `🗄️ Activating premium feature in Supabase for user ${telegramUserId}:`,
      {
        featureId,
        transactionId,
        activatedAt: new Date().toISOString(),
      }
    )

    // 🔒 Получаем Supabase клиент с JWT
    if (process.env.SUPABASE_URL) {
      try {
        let supabase

        // ✅ ПРИОРИТЕТ: Используем JWT для RLS-защищенных запросов
        if (jwt) {
          const { createAuthenticatedSupabaseClient } = await import(
            './_jwt.js'
          )
          console.log(
            '✅ Using JWT-authenticated Supabase client (RLS enabled)'
          )
          supabase = await createAuthenticatedSupabaseClient(jwt)
        } else {
          // ⚠️ FALLBACK: SERVICE_ROLE_KEY для админских операций
          if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase credentials not configured')
          }
          console.warn('⚠️ Using SERVICE_ROLE_KEY (bypasses RLS)')
          const { createClient } = await import('@supabase/supabase-js')
          supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
        }

        // Подготавливаем запись об активации
        const activationRecord = {
          telegram_id: telegramUserId,
          feature_id: featureId,
          transaction_id: transactionId,
          activated_at: new Date().toISOString(),
          expires_at: null, // Премиум функции не истекают (пока)
        }

        // Сохраняем активацию в базу данных (upsert для избежания дублей)
        const { data, error } = await supabase
          .from('premium_features')
          .upsert(activationRecord, {
            onConflict: 'telegram_id,feature_id',
          })
          .select()

        if (error) {
          throw new Error(
            `Supabase premium activation failed: ${error.message}`
          )
        }

        // Логируем что именно активировали
        switch (featureId) {
          case 'rare_elements':
            console.log(
              `✅ REALLY unlocked rare elements for user ${telegramUserId}`
            )
            break

          case 'seasonal_themes':
            console.log(
              `✅ REALLY unlocked seasonal themes for user ${telegramUserId}`
            )
            break

          case 'analytics':
            console.log(
              `✅ REALLY unlocked analytics for user ${telegramUserId}`
            )
            break

          case 'premium_bundle':
            console.log(
              `✅ REALLY unlocked premium bundle (ALL features) for user ${telegramUserId}`
            )

            // Для premium_bundle активируем все премиум функции
            const allFeatures = [
              'rare_elements',
              'seasonal_themes',
              'analytics',
            ]
            const bundlePromises = allFeatures.map(feature =>
              supabase.from('premium_features').upsert(
                {
                  telegram_id: telegramUserId,
                  feature_id: feature,
                  transaction_id: transactionId,
                  activated_at: new Date().toISOString(),
                  expires_at: null,
                },
                {
                  onConflict: 'telegram_id,feature_id',
                }
              )
            )

            const bundleResults = await Promise.allSettled(bundlePromises)
            const failedFeatures = bundleResults.filter(
              result => result.status === 'rejected'
            )

            if (failedFeatures.length > 0) {
              console.warn(
                `⚠️ Some bundle features failed to activate:`,
                failedFeatures
              )
            } else {
              console.log(
                `✅ All bundle features activated for user ${telegramUserId}`
              )
            }
            break

          default:
            console.error(`Unknown feature ID: ${featureId}`)
            return false
        }

        console.log(
          `✅ Premium feature ${featureId} saved to Supabase for user ${telegramUserId}`
        )
        return true
      } catch (supabaseError) {
        console.error(
          `❌ Supabase premium activation failed:`,
          supabaseError.message
        )
        return false
      }
    }

    // 🔄 Fallback: просто логируем для разработки
    console.log(`📝 Premium feature activated (no database):`, {
      telegramUserId,
      featureId,
      transactionId,
      activatedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error activating premium feature:', error)
    return false
  }
}

// Импортируем middleware аутентификации
import { withAuth, verifyTelegramId } from './_auth.js'

/**
 * Защищенный API handler для активации премиум функций
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
async function protectedHandler(req, res) {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramUserId, featureId } = req.body

    // Валидация входных данных
    if (!telegramUserId || typeof telegramUserId !== 'number') {
      return res
        .status(400)
        .json({ error: 'telegramUserId (number) is required' })
    }

    if (!featureId || typeof featureId !== 'string') {
      return res.status(400).json({ error: 'featureId (string) is required' })
    }

    // 🔐 Проверяем что пользователь активирует функции для себя
    if (!verifyTelegramId(telegramUserId, req.auth.telegramId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only activate features for yourself',
      })
    }

    // Проверяем валидность премиум функции
    const validFeatures = ['rare_elements', 'seasonal_themes', 'premium_bundle']
    if (!validFeatures.includes(featureId)) {
      return res.status(400).json({
        error: 'Invalid feature ID',
        validFeatures: validFeatures,
      })
    }

    console.log(
      `Processing premium activation request for user ${telegramUserId}, feature: ${featureId}`
    )

    // Активируем премиум функцию с JWT
    const activated = await activatePremiumFeature(
      telegramUserId,
      featureId,
      null,
      req.auth?.jwt
    )

    if (!activated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to activate premium feature',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        telegramUserId,
        featureId,
        activated: true,
        activatedAt: new Date(),
      },
      message: 'Premium feature activated successfully',
    })
  } catch (error) {
    console.error('Error activating premium feature:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

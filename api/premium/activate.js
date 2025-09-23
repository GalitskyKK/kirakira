/**
 * API эндпоинт для активации премиум функций
 * POST /api/premium/activate
 * Body: { telegramUserId: number, featureId: string }
 */

/**
 * Активирует премиум функцию для пользователя
 * В продакшене здесь был бы запрос к базе данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} featureId - ID премиум функции
 * @returns {Promise<boolean>} Успешность активации
 */
async function activatePremiumFeature(telegramUserId, featureId) {
  try {
    console.log(
      `Activating premium feature for Telegram user ${telegramUserId}:`,
      {
        featureId,
        activatedAt: new Date().toISOString(),
      }
    )

    // В реальном приложении здесь был бы запрос к базе данных
    // await db.premiumFeatures.create({
    //   telegramUserId,
    //   featureId,
    //   activatedAt: new Date(),
    //   isActive: true
    // })

    // Дополнительная логика в зависимости от типа функции
    switch (featureId) {
      case 'rare_elements':
        console.log(`Unlocked rare elements for user ${telegramUserId}`)
        break
      case 'seasonal_themes':
        console.log(`Unlocked seasonal themes for user ${telegramUserId}`)
        break
      case 'premium_bundle':
        console.log(`Unlocked premium bundle for user ${telegramUserId}`)
        // Активируем все премиум функции
        break
    }

    return true
  } catch (error) {
    console.error('Error activating premium feature:', error)
    return false
  }
}

/**
 * API handler для активации премиум функций
 * @param {Object} req - Next.js API request object
 * @param {Object} res - Next.js API response object
 */
export default async function handler(req, res) {
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

    // Активируем премиум функцию
    const activated = await activatePremiumFeature(telegramUserId, featureId)

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

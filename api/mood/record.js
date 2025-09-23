/**
 * API эндпоинт для записи настроения пользователя
 * POST /api/mood/record
 * Body: { telegramUserId: number, mood: string, date: string }
 */

/**
 * Сохраняет настроение пользователя
 * В продакшене здесь был бы запрос к базе данных
 * @param {number} telegramUserId - ID пользователя в Telegram
 * @param {string} mood - Настроение пользователя
 * @param {Date} date - Дата записи
 * @returns {Promise<boolean>} Успешность сохранения
 */
async function saveMoodRecord(telegramUserId, mood, date) {
  try {
    // В реальном приложении здесь был бы запрос к базе данных
    console.log(`Saving mood record for user ${telegramUserId}:`, {
      mood,
      date: date.toISOString(),
    })

    // Симулируем сохранение в базу данных
    // await db.moodRecords.create({
    //   telegramUserId,
    //   mood,
    //   date,
    //   createdAt: new Date()
    // })

    return true
  } catch (error) {
    console.error('Error saving mood record:', error)
    return false
  }
}

/**
 * API handler для записи настроения пользователя
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramUserId, mood, date } = req.body

    // Валидация входных данных
    if (!telegramUserId || typeof telegramUserId !== 'number') {
      return res
        .status(400)
        .json({ error: 'telegramUserId (number) is required' })
    }

    if (!mood || typeof mood !== 'string') {
      return res.status(400).json({ error: 'mood (string) is required' })
    }

    // Проверяем валидность настроения
    const validMoods = ['joy', 'calm', 'stress', 'sadness', 'anger', 'anxiety']
    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        error: 'Invalid mood value',
        validMoods: validMoods,
      })
    }

    // Получаем дату записи
    const recordDate = date ? new Date(date) : new Date()

    // Проверяем валидность даты
    if (isNaN(recordDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    console.log(`Recording mood for Telegram user ${telegramUserId}:`, {
      mood,
      date: recordDate.toISOString(),
    })

    // Сохраняем запись настроения
    const saved = await saveMoodRecord(telegramUserId, mood, recordDate)

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save mood record',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        telegramUserId,
        mood,
        date: recordDate,
        recorded: true,
      },
      message: 'Mood recorded successfully',
    })
  } catch (error) {
    console.error('Error recording mood:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    })
  }
}

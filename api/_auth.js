/**
 * 🔐 TELEGRAM AUTHENTICATION MIDDLEWARE
 * Проверяет подлинность запросов от Telegram Mini Apps
 */

import crypto from 'crypto'

/**
 * Валидирует initData от Telegram WebApp
 * @param {string} initData - Строка initData от Telegram
 * @param {string} botToken - Токен бота
 * @returns {{ isValid: boolean, user: object | null }} Результат валидации
 */
export function validateTelegramInitData(initData, botToken) {
  try {
    if (!initData || !botToken) {
      return { isValid: false, user: null }
    }

    const params = new URLSearchParams(initData)
    const hash = params.get('hash')

    if (!hash) {
      return { isValid: false, user: null }
    }

    params.delete('hash')

    // Важно: сортируем ключи в алфавитном порядке
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Создаем секретный ключ из токена бота
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // Проверяем совпадение хешей
    if (calculatedHash === hash) {
      const user = JSON.parse(params.get('user') || '{}')
      return { isValid: true, user }
    }

    return { isValid: false, user: null }
  } catch (error) {
    console.error('❌ Telegram init data validation error:', error)
    return { isValid: false, user: null }
  }
}

/**
 * Middleware для защиты API эндпоинтов
 * Проверяет Authorization header с Telegram initData
 * И генерирует JWT токен для работы с Supabase RLS
 *
 * @param {Request} req - Vercel Functions request
 * @returns {{ authorized: boolean, telegramId: number | null, userData: object | null, jwt: string | null }} Результат авторизации
 */
export async function authenticateTelegramUser(req) {
  try {
    // Получаем Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader || !authHeader.startsWith('tma ')) {
      console.warn('⚠️ Missing or invalid Authorization header')
      return { authorized: false, telegramId: null, userData: null, jwt: null }
    }

    // Извлекаем initData
    const initData = authHeader.replace('tma ', '')

    const BOT_TOKEN =
      process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured')
      return { authorized: false, telegramId: null, userData: null, jwt: null }
    }

    // Валидируем initData
    const { isValid, user } = validateTelegramInitData(initData, BOT_TOKEN)

    if (!isValid || !user || !user.id) {
      console.warn('⚠️ Invalid Telegram initData')
      return { authorized: false, telegramId: null, userData: null, jwt: null }
    }

    // Генерируем JWT токен для Supabase RLS
    let jwt = null
    try {
      const { generateSupabaseJWT } = await import('./_jwt.js')
      jwt = generateSupabaseJWT(user.id, {
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
      })
      console.log(`🔑 Generated JWT for user ${user.id}`)
    } catch (jwtError) {
      console.error('⚠️ JWT generation failed:', jwtError)
      // Не критично - продолжаем без JWT (используется SERVICE_ROLE_KEY fallback)
    }

    // Успешная авторизация
    console.log(
      `✅ User authenticated: ${user.id} (${user.first_name || 'Unknown'})`
    )

    return {
      authorized: true,
      telegramId: user.id,
      userData: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        languageCode: user.language_code,
        photoUrl: user.photo_url,
      },
      jwt,
    }
  } catch (error) {
    console.error('❌ Authentication error:', error)
    return { authorized: false, telegramId: null, userData: null, jwt: null }
  }
}

/**
 * Обертка для защищенных API обработчиков
 * Автоматически проверяет аутентификацию перед выполнением handler
 *
 * @param {Function} handler - API handler функция
 * @returns {Function} Защищенный handler
 */
export function withAuth(handler) {
  return async (req, res) => {
    // 🔒 CORS headers - строгая политика (устанавливаем до проверки авторизации)
    const allowedOrigin =
      process.env.VITE_APP_URL || 'https://kirakira-theta.vercel.app'

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    )
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Admin-Key, X-Bot-Secret'
    )
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age', '86400')

    // Обрабатываем OPTIONS запрос
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // 🔑 СПЕЦИАЛЬНЫЙ СЛУЧАЙ: Проверяем запросы от бота
    const botSecret = req.headers['x-bot-secret']
    const EXPECTED_BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

    console.log(
      `🔍 Middleware bot check: received=${botSecret ? 'SET' : 'MISSING'}, expected=${EXPECTED_BOT_SECRET ? 'SET' : 'MISSING'}`
    )
    console.log(`🔍 Bot secret match: ${botSecret === EXPECTED_BOT_SECRET}`)

    if (botSecret === EXPECTED_BOT_SECRET) {
      console.log(
        '🤖 Bot request detected in middleware, bypassing authentication'
      )
      // Для бота создаем фиктивную аутентификацию
      req.auth = {
        authorized: true,
        telegramId: null, // Будет определен в handler
        userData: null,
        jwt: null,
      }
      return handler(req, res)
    }

    // Проверяем аутентификацию для обычных пользователей
    const auth = await authenticateTelegramUser(req)

    if (!auth.authorized) {
      console.warn(
        `⚠️ Unauthorized access attempt from ${req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown'}`
      )
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing Telegram authentication',
      })
    }

    // Добавляем данные авторизации в request для использования в handler
    req.auth = auth

    // Вызываем оригинальный handler
    return handler(req, res)
  }
}

/**
 * Проверяет, что telegramId из запроса совпадает с аутентифицированным пользователем
 * Защита от попыток доступа к чужим данным
 *
 * @param {number} requestedTelegramId - telegramId из параметров запроса
 * @param {number} authenticatedTelegramId - telegramId аутентифицированного пользователя
 * @returns {boolean} true если IDs совпадают
 */
export function verifyTelegramId(requestedTelegramId, authenticatedTelegramId) {
  const requested = parseInt(requestedTelegramId)
  const authenticated = parseInt(authenticatedTelegramId)

  if (requested !== authenticated) {
    console.warn(
      `⚠️ Telegram ID mismatch: requested ${requested}, authenticated ${authenticated}`
    )
    return false
  }

  return true
}

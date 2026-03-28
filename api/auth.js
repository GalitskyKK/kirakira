/**
 * 🔐 BROWSER AUTHENTICATION ENDPOINT
 * Обрабатывает авторизацию через Telegram Login Widget для браузерной версии
 * Валидирует данные от виджета и возвращает JWT токен для дальнейшей работы
 */

import { authenticateJWT, validateTelegramLoginWidget } from './_auth.js'
import { generateSupabaseJWT } from './_jwt.js'

export default async function handler(req, res) {
  // 🔒 CORS headers
  const allowedOrigins = [
    'https://kirakiragarden.ru',
    'https://www.kirakiragarden.ru',
    'https://kirakira-theta.vercel.app',
    'http://localhost:3000', // Для локальной разработки
    'http://localhost:5173', // Vite дефолтный порт
  ]
  const origin = req.headers.origin
  const defaultOrigin = process.env.VITE_APP_URL || 'https://kirakiragarden.ru'

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (defaultOrigin) {
    res.setHeader('Access-Control-Allow-Origin', defaultOrigin)
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Обрабатываем OPTIONS запрос
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // action в query (норма) или в JSON-теле — если прокси/CDN обрезал ?action=
  const action =
    (typeof req.query?.action === 'string' && req.query.action.length > 0
      ? req.query.action
      : null) ||
    (req.body &&
    typeof req.body === 'object' &&
    typeof req.body.action === 'string' &&
    req.body.action.length > 0
      ? req.body.action
      : null) ||
    'login'

  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are allowed',
    })
  }

  if (action === 'refresh') {
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const auth = await authenticateJWT(token)

    if (!auth.authorized || !auth.telegramId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
    }

    const jwt = generateSupabaseJWT(auth.telegramId, {
      firstName: auth.userData?.firstName,
      lastName: auth.userData?.lastName,
      username: auth.userData?.username,
    })

    return res.status(200).json({
      success: true,
      data: {
        token: jwt,
        telegramId: auth.telegramId,
      },
    })
  }

  if (action === 'supabase_exchange') {
    try {
      const accessToken =
        typeof req.body?.accessToken === 'string'
          ? req.body.accessToken
          : typeof req.body?.access_token === 'string'
            ? req.body.access_token
            : null

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Missing accessToken',
          message: 'Supabase session access_token is required',
        })
      }

      const { exchangeSupabaseAccessTokenForKirakiraJWT } = await import(
        './_supabaseAuthExchange.js'
      )
      const { token, telegramId } =
        await exchangeSupabaseAccessTokenForKirakiraJWT(accessToken)

      return res.status(200).json({
        success: true,
        data: {
          token,
          telegramId,
        },
      })
    } catch (exchangeError) {
      const message =
        exchangeError instanceof Error
          ? exchangeError.message
          : 'Exchange failed'
      if (message === 'INVALID_SUPABASE_TOKEN') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Invalid or unsupported Supabase access token',
        })
      }
      console.error('❌ supabase_exchange:', exchangeError)
      return res.status(500).json({
        success: false,
        error: 'Exchange failed',
        message,
      })
    }
  }

  if (action === 'recovery_request' || action === 'recovery_confirm') {
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const auth = await authenticateJWT(token)

    const { recoveryRequestHandler, recoveryConfirmHandler } = await import(
      './_telegramRecovery.js'
    )

    const result =
      action === 'recovery_request'
        ? await recoveryRequestHandler(auth, req.body)
        : await recoveryConfirmHandler(auth, req.body)

    return res.status(result.status).json(result.body)
  }

  try {
    const { loginData } = req.body

    if (!loginData) {
      return res.status(400).json({
        success: false,
        error: 'Missing login data',
        message: 'Telegram login data is required',
      })
    }

    const BOT_TOKEN =
      process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured')
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'Telegram bot token not configured',
      })
    }

    // Валидируем данные от Telegram Login Widget
    const { isValid, user } = validateTelegramLoginWidget(loginData, BOT_TOKEN)

    if (!isValid || !user || !user.id) {
      console.warn('⚠️ Invalid Telegram Login Widget data')
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication',
        message: 'Telegram login data validation failed',
      })
    }

    // Генерируем JWT токен
    let jwt = null
    try {
      jwt = generateSupabaseJWT(user.id, {
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
      })
      console.log(`🔑 Generated JWT for user ${user.id}`)
    } catch (jwtError) {
      console.error('⚠️ JWT generation failed:', jwtError)
      return res.status(500).json({
        success: false,
        error: 'JWT generation failed',
        message: 'Failed to generate authentication token',
      })
    }

    // Успешная авторизация
    console.log(
      `✅ User authenticated via Login Widget: ${user.id} (${user.first_name || 'Unknown'})`
    )

    return res.status(200).json({
      success: true,
      data: {
        token: jwt,
        telegramId: user.id,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          photoUrl: user.photo_url,
          languageCode: user.language_code,
        },
      },
    })
  } catch (error) {
    console.error('❌ Authentication endpoint error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    })
  }
}

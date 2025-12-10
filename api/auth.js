/**
 * 🔐 BROWSER AUTHENTICATION ENDPOINT
 * Обрабатывает авторизацию через Telegram Login Widget для браузерной версии
 * Валидирует данные от виджета и возвращает JWT токен для дальнейшей работы
 */

import { validateTelegramLoginWidget } from './_auth.js'
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

  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are allowed',
    })
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

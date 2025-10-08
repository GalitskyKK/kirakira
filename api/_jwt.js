/**
 * 🔑 JWT GENERATION FOR SUPABASE RLS
 * Генерирует JWT токены для аутентификации пользователей в Supabase
 * с поддержкой Row Level Security (RLS)
 */

import crypto from 'crypto'
import { Buffer } from 'buffer'

/**
 * Генерирует JWT токен для пользователя Telegram
 * @param {number} telegramId - ID пользователя в Telegram
 * @param {object} userData - Дополнительные данные пользователя
 * @returns {string} JWT токен
 */
export function generateSupabaseJWT(telegramId, userData = {}) {
  const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

  if (!JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET not configured')
  }

  // Создаем payload для JWT
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 60 * 60 * 24 // 24 часа

  const payload = {
    // Стандартные claims
    iss: 'kirakira-api', // issuer
    sub: `telegram-${telegramId}`, // subject (уникальный ID)
    aud: 'authenticated', // audience
    exp: now + expiresIn, // expiration time
    iat: now, // issued at

    // Кастомные claims для RLS
    telegram_id: telegramId,
    role: 'authenticated',

    // Метаданные пользователя
    user_metadata: {
      telegram_id: telegramId,
      first_name: userData.firstName || null,
      last_name: userData.lastName || null,
      username: userData.username || null,
    },
  }

  // Создаем JWT: header.payload.signature
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Base64 URL encoding (без padding)
 * @param {string} str - Строка для кодирования
 * @returns {string} Base64 URL encoded строка
 */
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url')
}

/**
 * Верифицирует JWT токен
 * @param {string} token - JWT токен
 * @returns {object|null} Декодированный payload или null если невалидный
 */
export function verifySupabaseJWT(token) {
  try {
    const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

    if (!JWT_SECRET) {
      console.error('SUPABASE_JWT_SECRET not configured')
      return null
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [encodedHeader, encodedPayload, signature] = parts

    // Проверяем подпись
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    if (signature !== expectedSignature) {
      console.warn('JWT signature mismatch')
      return null
    }

    // Декодируем payload
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf-8')
    )

    // Проверяем expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      console.warn('JWT expired')
      return null
    }

    return payload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

/**
 * Создает Supabase клиента с JWT аутентификацией пользователя
 * @param {string} jwt - JWT токен пользователя
 * @returns {Promise<object>} Supabase клиент
 */
export async function createAuthenticatedSupabaseClient(jwt) {
  const { createClient } = await import('@supabase/supabase-js')

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables not configured')
  }

  // Создаем клиент с ANON_KEY и JWT пользователя
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Создает Supabase клиента с SERVICE_ROLE_KEY (для административных операций)
 * ⚠️ ВНИМАНИЕ: Использовать только для операций, не связанных с пользовательскими данными
 * @returns {Promise<object>} Supabase клиент с полным доступом
 */
export async function createAdminSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin credentials not configured')
  }

  console.warn(
    '⚠️ Creating admin Supabase client (bypasses RLS) - use only for system operations'
  )

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

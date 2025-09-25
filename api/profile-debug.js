/**
 * ===========================================
 * PROFILE API DEBUG - Диагностическая версия
 * ===========================================
 * Отладочная версия API для диагностики проблем
 */

import { createClient } from '@supabase/supabase-js'

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Profile Debug API - Environment check:')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  supabaseServiceKey ? '✅ Set' : '❌ Missing'
)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  throw new Error('Missing Supabase credentials in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Получает или создает пользователя в БД
 */
async function ensureUser(telegramId, userData = {}) {
  console.log('🔍 ensureUser called with telegramId:', telegramId)

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Database error in ensureUser:', fetchError)
      throw new Error(`Database error: ${fetchError.message}`)
    }

    if (existingUser) {
      console.log('✅ User found:', {
        id: existingUser.id,
        telegram_id: existingUser.telegram_id,
      })
      return existingUser
    }

    console.log('👤 Creating new user...')
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramId,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        username: userData.username || '',
        photo_url: userData.photo_url || '',
        registration_date: new Date().toISOString(),
        experience: 0,
        level: 1,
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create user:', createError)
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    console.log('✅ New user created:', {
      id: newUser.id,
      telegram_id: newUser.telegram_id,
    })
    return newUser
  } catch (error) {
    console.error('💥 ensureUser failed:', error)
    throw error
  }
}

/**
 * Проверяет доступность PostgreSQL функций
 */
async function checkDatabaseFunctions() {
  console.log('🔧 Checking database functions...')

  try {
    // Проверяем наличие функций
    const { data: functions, error } = await supabase.rpc(
      'check_and_unlock_achievements',
      { p_telegram_id: 12345 }
    )

    if (error) {
      console.log(
        '❌ Function check_and_unlock_achievements not available:',
        error.message
      )
      return false
    }

    console.log('✅ PostgreSQL functions are available')
    return true
  } catch (error) {
    console.log('❌ PostgreSQL functions check failed:', error.message)
    return false
  }
}

/**
 * Проверяет схему БД
 */
async function checkDatabaseSchema() {
  console.log('🗄️ Checking database schema...')

  try {
    // Проверяем основные таблицы
    const tables = [
      'users',
      'mood_entries',
      'garden_elements',
      'achievements',
      'user_achievements',
      'gardener_levels',
    ]

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1)

      if (error) {
        console.log(`❌ Table ${table} not accessible:`, error.message)
        return false
      } else {
        console.log(`✅ Table ${table} accessible`)
      }
    }

    return true
  } catch (error) {
    console.log('❌ Database schema check failed:', error.message)
    return false
  }
}

/**
 * Главная функция обработки API запросов
 */
export default async function handler(req, res) {
  console.log('🚀 Profile Debug API called:', req.method, req.url)
  console.log('Query params:', req.query)
  console.log('Body:', req.body)

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action } = req.query

    // Специальный action для диагностики
    if (action === 'debug') {
      console.log('🔍 Running full diagnostics...')

      const checks = {
        environment: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseServiceKey,
        },
        database: {
          schema: await checkDatabaseSchema(),
          functions: await checkDatabaseFunctions(),
        },
      }

      return res.status(200).json({
        success: true,
        message: 'Debug information',
        checks,
        timestamp: new Date().toISOString(),
      })
    }

    switch (action) {
      case 'get_profile': {
        if (req.method !== 'GET') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId } = req.query
        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        console.log('📊 Getting profile for telegramId:', telegramId)

        // Получаем пользователя
        const user = await ensureUser(parseInt(telegramId))
        console.log('✅ User obtained:', user.id)

        return res.status(200).json({
          success: true,
          message: 'Profile loaded successfully (debug mode)',
          data: {
            user,
            stats: {
              totalMoodEntries: 0,
              currentStreak: 0,
              longestStreak: 0,
              totalElements: 0,
              rareElementsFound: 0,
              totalDays: 1,
              gardensShared: 0,
              experience: 0,
              level: 1,
            },
            achievements: [],
            newlyUnlocked: [],
          },
        })
      }

      case 'update_privacy': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, privacySettings } = req.body
        if (!telegramId || !privacySettings) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing required fields' })
        }

        console.log('🔒 Updating privacy for telegramId:', telegramId)
        console.log('Privacy settings:', privacySettings)

        const user = await ensureUser(parseInt(telegramId))

        const { data, error } = await supabase
          .from('users')
          .update({ privacy_settings: privacySettings })
          .eq('id', user.id)
          .select()
          .single()

        if (error) {
          console.error('❌ Privacy update error:', error)
          return res
            .status(500)
            .json({
              success: false,
              error: 'Database error',
              details: error.message,
            })
        }

        console.log('✅ Privacy updated successfully')
        return res.status(200).json({
          success: true,
          message: 'Privacy settings updated successfully (debug mode)',
          data: { privacy_settings: data.privacy_settings },
        })
      }

      case 'get_friend_profile': {
        if (req.method !== 'GET') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, friendTelegramId } = req.query
        if (!telegramId || !friendTelegramId) {
          return res
            .status(400)
            .json({
              success: false,
              error: 'Missing telegramId or friendTelegramId',
            })
        }

        console.log('👥 Getting friend profile:', {
          telegramId,
          friendTelegramId,
        })

        // Проверяем, что пользователи - друзья
        const { data: friendship, error: friendshipError } = await supabase
          .from('friendships')
          .select('*')
          .or(
            `requester_telegram_id.eq.${telegramId},accepter_telegram_id.eq.${telegramId}`
          )
          .or(
            `requester_telegram_id.eq.${friendTelegramId},accepter_telegram_id.eq.${friendTelegramId}`
          )
          .eq('status', 'accepted')
          .single()

        if (friendshipError || !friendship) {
          console.log(
            '❌ Friendship check failed:',
            friendshipError?.message || 'No friendship found'
          )
          return res
            .status(403)
            .json({
              success: false,
              error: 'Not friends or friendship not found',
            })
        }

        console.log('✅ Friendship confirmed:', friendship.id)

        // Получаем данные друга
        const friend = await ensureUser(parseInt(friendTelegramId))

        const privacySettings = friend.privacy_settings || { showProfile: true }
        if (!privacySettings.showProfile) {
          console.log('🔒 Friend profile is private')
          return res
            .status(403)
            .json({ success: false, error: 'Profile is private' })
        }

        console.log('✅ Friend profile accessible')
        return res.status(200).json({
          success: true,
          message: 'Friend profile loaded successfully (debug mode)',
          data: {
            user: {
              id: friend.id,
              telegram_id: friend.telegram_id,
              first_name: friend.first_name,
              last_name: friend.last_name,
              username: friend.username,
              photo_url: friend.photo_url,
              level: friend.level || 1,
              registration_date: friend.registration_date,
            },
            stats: null,
            achievements: [],
            privacy: privacySettings,
          },
        })
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('💥 Profile Debug API Error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

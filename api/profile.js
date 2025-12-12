/**
 * ===========================================
 * PROFILE API - Управление профилями пользователей
 * ===========================================
 * Обрабатывает запросы для:
 * - Получения профиля пользователя
 * - Обновления настроек приватности
 * - Управления достижениями
 * - Работы с системой уровней
 */

import { createClient } from '@supabase/supabase-js'
import { createAdminSupabaseClient } from './_jwt.js'

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Validates Telegram WebApp init data
 */
function validateTelegramWebAppData(initData) {
  // Простая проверка - в продакшене нужна полная валидация
  try {
    const urlParams = new URLSearchParams(initData)
    const user = urlParams.get('user')
    if (!user) return null

    return JSON.parse(user)
  } catch (error) {
    console.error('Invalid Telegram data:', error)
    return null
  }
}

/**
 * Получает или создает пользователя в БД
 */
async function ensureUser(telegramId, userData = {}) {
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Database error: ${fetchError.message}`)
  }

  if (existingUser) {
    const updates = {}

    // ВСЕГДА обновляем last_visit_date при любом обращении к API
    updates.last_visit_date = new Date().toISOString()
    updates.updated_at = new Date().toISOString()

    // Если есть новые данные пользователя - добавляем их к обновлениям
    if (userData && Object.keys(userData).length > 0) {
      // 🔥 ИСПРАВЛЕНИЕ: Обновляем поля если они переданы, даже если уже заполнены
      // Это важно для исправления неправильных данных (например, "User" вместо реального имени)
      if (userData.first_name != null && userData.first_name !== '') {
        updates.first_name = userData.first_name
      }
      if (userData.last_name != null && userData.last_name !== '') {
        updates.last_name = userData.last_name
      }
      if (userData.username != null && userData.username !== '') {
        updates.username = userData.username
      }
      if (userData.photo_url != null && userData.photo_url !== '') {
        updates.photo_url = userData.photo_url
      }
      if (userData.language_code != null && userData.language_code !== '') {
        updates.language_code = userData.language_code
      }
    }

    console.log(
      `📝 Updating user ${telegramId} (including last_visit_date):`,
      updates
    )

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('telegram_id', telegramId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update user:', updateError)
      return existingUser // Возвращаем старые данные в случае ошибки
    }

    console.log(
      `✅ User ${telegramId} updated successfully with last_visit_date`
    )
    return updatedUser
  }

  // Создаем нового пользователя
  console.log(`🆕 Creating new user ${telegramId} with data:`, userData)

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      user_id: `tg_${telegramId}`, // ИСПРАВЛЕНО: добавлено обязательное поле user_id
      // 🔥 ИСПРАВЛЕНИЕ: Используем данные из userData, если они есть
      first_name:
        userData?.first_name != null && userData.first_name !== ''
          ? userData.first_name
          : null,
      last_name:
        userData?.last_name != null && userData.last_name !== ''
          ? userData.last_name
          : null,
      username:
        userData?.username != null && userData.username !== ''
          ? userData.username
          : null,
      photo_url:
        userData?.photo_url != null && userData.photo_url !== ''
          ? userData.photo_url
          : null,
      language_code:
        userData?.language_code != null && userData.language_code !== ''
          ? userData.language_code
          : 'ru',
      // registration_date будет равна created_at (автоматически в БД)
      experience: 0,
      level: 1,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`)
  }

  return newUser
}

/**
 * Вычисляет статистику пользователя
 */
async function calculateUserStats(user) {
  try {
    // Параллельные запросы для оптимизации
    const [
      { data: moodEntries, error: moodError },
      { data: gardenElements, error: gardenError },
    ] = await Promise.all([
      supabase
        .from('mood_entries')
        .select('mood_date, mood')
        .eq('telegram_id', user.telegram_id)
        .order('mood_date', { ascending: false }),

      supabase
        .from('garden_elements')
        .select('rarity, unlock_date')
        .eq('telegram_id', user.telegram_id),
    ])

    const userStats = user

    if (moodError || gardenError) {
      console.error('Stats calculation error:', {
        moodError,
        gardenError,
      })
      return null
    }

    // 🔥 V3: Стрик полностью управляется на бэкенде через streak_last_checkin
    // Мы НЕ пересчитываем его из истории настроений, а берем ТОЛЬКО из БД
    const currentStreak = userStats?.current_streak || 0
    const longestStreak = userStats?.longest_streak || 0

    console.log(
      `📊 STREAK [V3 Profile]: Using server-managed streak from DB: current=${currentStreak}, longest=${longestStreak}`
    )

    // Подсчет редких элементов
    const rareElementsCount = gardenElements
      ? gardenElements.filter(el =>
          ['rare', 'epic', 'legendary'].includes(el.rarity)
        ).length
      : 0

    // Дни с регистрации
    const registrationDate = user.created_at || user.registration_date
    const daysSinceRegistration = registrationDate
      ? Math.floor(
          (Date.now() - new Date(registrationDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    // 🔥 V3: Стрики ТОЛЬКО из БД, никаких пересчетов
    const finalStats = {
      totalMoodEntries: moodEntries?.length || 0,
      currentStreak, // Из БД (строка 156)
      longestStreak, // Из БД (строка 157)
      totalElements: userStats?.total_elements || gardenElements?.length || 0,
      rareElementsFound: userStats?.rare_elements_found || rareElementsCount,
      totalDays: Math.max(
        userStats?.total_days || 0,
        daysSinceRegistration + 1
      ),
      gardensShared: userStats?.gardens_shared || 0,
      experience: userStats?.experience || 0,
      level: userStats?.level || 1,
    }

    // 🔍 ОТЛАДКА: Показываем откуда берутся данные
    console.log('📊 Stats Sources [V3]:', {
      telegramId: user.telegram_id,
      registrationDate: registrationDate
        ? new Date(registrationDate).toISOString().split('T')[0]
        : 'unknown',
      dbStats: {
        total_days: userStats?.total_days,
        current_streak: userStats?.current_streak,
        longest_streak: userStats?.longest_streak,
        total_elements: userStats?.total_elements,
      },
      calculatedStats: {
        daysSinceRegistration,
        daysSinceRegistrationPlus1: daysSinceRegistration + 1,
        totalElements: gardenElements?.length,
        rareElements: rareElementsCount,
      },
      finalStats,
      streakSource: 'DB only (no recalculation)',
      totalDaysLogic: `Math.max(${userStats?.total_days || 0}, ${daysSinceRegistration + 1}) = ${Math.max(userStats?.total_days || 0, daysSinceRegistration + 1)}`,
    })

    return finalStats
  } catch (error) {
    console.error('Error calculating user stats:', error)
    return null
  }
}

/**
 * Проверяет и обновляет достижения пользователя
 */
async function checkAndUpdateAchievements(telegramId) {
  try {
    const { data, error } = await supabase.rpc(
      'check_and_unlock_achievements',
      { p_telegram_id: telegramId }
    )

    if (error) {
      console.error('Error checking achievements:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Achievement check failed:', error)
    return []
  }
}

/**
 * Обновляет опыт пользователя
 */
async function addExperience(telegramId, experiencePoints) {
  try {
    const { data, error } = await supabase.rpc('add_user_experience', {
      p_telegram_id: telegramId,
      p_experience_points: experiencePoints,
    })

    if (error) {
      console.error('Error adding experience:', error)
      return null
    }

    return data[0] || null
  } catch (error) {
    console.error('Experience update failed:', error)
    return null
  }
}

// Импортируем middleware аутентификации
import { withAuth, verifyTelegramId } from './_auth.js'

const LEADERBOARD_CATEGORIES = ['level', 'streak', 'elements']
const LEADERBOARD_PERIODS = ['all_time', 'monthly']
const DEFAULT_LEADERBOARD_LIMIT = 20
const MAX_LEADERBOARD_LIMIT = 50
const LEADERBOARD_VISIBILITY_FILTER =
  'privacy_settings->>showProfile.eq.true,privacy_settings.is.null'

function parseBooleanParam(value, defaultValue) {
  if (value === undefined) {
    return defaultValue
  }
  if (typeof value === 'boolean') {
    return value
  }
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true' || normalized === '1') {
    return true
  }
  if (normalized === 'false' || normalized === '0') {
    return false
  }
  return defaultValue
}

function parseIntegerParam(value, defaultValue, min, max) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }
  return Math.min(Math.max(parsed, min), max)
}

function normalizePrivacySettings(rawValue) {
  if (!rawValue) {
    return {}
  }
  if (typeof rawValue === 'string') {
    try {
      return JSON.parse(rawValue) ?? {}
    } catch {
      return {}
    }
  }
  if (typeof rawValue === 'object') {
    return rawValue
  }
  return {}
}

function getPeriodStart(period) {
  if (period !== 'monthly') {
    return null
  }
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

const LEADERBOARD_METRICS = {
  level: {
    primaryField: 'level',
    secondaryField: 'experience',
    scoreFromRecord: record => Number(record?.level ?? 0),
    tieBreaker: record => Number(record?.experience ?? 0),
  },
  streak: {
    primaryField: 'current_streak',
    secondaryField: 'longest_streak',
    scoreFromRecord: record => Number(record?.current_streak ?? 0),
    tieBreaker: record => Number(record?.longest_streak ?? 0),
  },
  elements: {
    primaryField: 'total_elements',
    secondaryField: 'rare_elements_found',
    scoreFromRecord: record => Number(record?.total_elements ?? 0),
    tieBreaker: record => Number(record?.rare_elements_found ?? 0),
  },
}

function mapLeaderboardEntry(record, category, period, rank) {
  const privacySettings = normalizePrivacySettings(record.privacy_settings)
  const metricConfig = LEADERBOARD_METRICS[category]
  const score = metricConfig.scoreFromRecord(record)
  const tieScore = metricConfig.tieBreaker(record)

  const sanitizedUser = {
    telegram_id: record.telegram_id,
    first_name: record.first_name ?? null,
    last_name: record.last_name ?? null,
    username: record.username ?? null,
    photo_url: record.photo_url ?? null,
    level: Number.isFinite(Number(record.level)) ? Number(record.level) : 0,
    garden_theme: record.garden_theme ?? 'light',
    privacy_settings: {
      showProfile: privacySettings.showProfile !== false,
      shareGarden: privacySettings.shareGarden !== false,
      shareAchievements: privacySettings.shareAchievements !== false,
    },
  }

  return {
    rank,
    score,
    category,
    period,
    visibility: {
      isProfileHidden: privacySettings.showProfile === false,
      isGardenHidden: privacySettings.shareGarden === false,
      isAchievementsHidden: privacySettings.shareAchievements === false,
    },
    user: sanitizedUser,
    stats: {
      level: Number.isFinite(Number(record.level)) ? Number(record.level) : 0,
      experience: Number.isFinite(Number(record.experience))
        ? Number(record.experience)
        : 0,
      current_streak: Number.isFinite(Number(record.current_streak))
        ? Number(record.current_streak)
        : 0,
      longest_streak: Number.isFinite(Number(record.longest_streak))
        ? Number(record.longest_streak)
        : 0,
      total_elements: Number.isFinite(Number(record.total_elements))
        ? Number(record.total_elements)
        : 0,
      rare_elements_found: Number.isFinite(Number(record.rare_elements_found))
        ? Number(record.rare_elements_found)
        : 0,
      tieScore,
    },
  }
}

function sortLeaderboardRecords(records, category) {
  const config = LEADERBOARD_METRICS[category]
  return [...records].sort((a, b) => {
    const primaryDiff =
      (Number(b[config.primaryField]) || 0) -
      (Number(a[config.primaryField]) || 0)
    if (primaryDiff !== 0) {
      return primaryDiff
    }
    const secondaryDiff =
      (Number(b[config.secondaryField]) || 0) -
      (Number(a[config.secondaryField]) || 0)
    if (secondaryDiff !== 0) {
      return secondaryDiff
    }
    return (Number(a.telegram_id) || 0) - (Number(b.telegram_id) || 0)
  })
}

function applyPeriodFilter(query, category, period, periodStart) {
  if (period !== 'monthly' || !periodStart) {
    return query
  }
  const isoString = periodStart.toISOString()
  const isoDate = isoString.slice(0, 10)

  switch (category) {
    case 'level':
      return query.gte('last_visit_date', isoString)
    case 'streak':
      return query.gte('streak_last_checkin', isoDate)
    case 'elements':
      return query.gte('last_visit_date', isoString)
    default:
      return query
  }
}

async function fetchLeaderboardEntries({
  supabaseClient,
  category,
  period,
  limit,
  periodStart,
}) {
  const metricConfig = LEADERBOARD_METRICS[category]
  const selectColumns = `
    telegram_id,
    first_name,
    last_name,
    username,
    photo_url,
    level,
    experience,
    current_streak,
    longest_streak,
    total_elements,
    rare_elements_found,
    privacy_settings,
    garden_theme,
    streak_last_checkin,
    last_visit_date,
    updated_at
  `

  const fetchLimit = Math.min(limit * 3, 150)

  let query = supabaseClient
    .from('users')
    .select(selectColumns)
    .order(metricConfig.primaryField, { ascending: false, nullsFirst: false })
    .order(metricConfig.secondaryField, { ascending: false, nullsFirst: false })
    .limit(fetchLimit)

  query = applyPeriodFilter(query, category, period, periodStart)

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch leaderboard data: ${error.message}`)
  }

  const sortedRecords = sortLeaderboardRecords(data ?? [], category)

  const entries = []
  for (const record of sortedRecords) {
    const mapped = mapLeaderboardEntry(
      record,
      category,
      period,
      entries.length + 1
    )

    const score = LEADERBOARD_METRICS[category].scoreFromRecord(record)
    if (!Number.isFinite(score)) {
      continue
    }
    entries.push(mapped)
    if (entries.length >= limit) {
      break
    }
  }

  return entries
}

async function fetchViewerLeaderboardPosition({
  supabaseClient,
  category,
  period,
  periodStart,
  viewerTelegramId,
}) {
  if (!viewerTelegramId) {
    return null
  }

  const metricConfig = LEADERBOARD_METRICS[category]
  const selectColumns = `
    telegram_id,
    first_name,
    last_name,
    username,
    photo_url,
    level,
    experience,
    current_streak,
    longest_streak,
    total_elements,
    rare_elements_found,
    privacy_settings,
    garden_theme,
    streak_last_checkin,
    last_visit_date,
    updated_at
  `

  let viewerQuery = supabaseClient
    .from('users')
    .select(selectColumns)
    .eq('telegram_id', viewerTelegramId)
    .limit(1)

  viewerQuery = applyPeriodFilter(viewerQuery, category, period, periodStart)

  const { data: viewerRows, error: viewerError } = await viewerQuery

  if (viewerError) {
    throw new Error(`Failed to fetch viewer data: ${viewerError.message}`)
  }

  const viewerRecord = viewerRows?.[0]
  if (!viewerRecord) {
    return null
  }

  const viewerScore = metricConfig.scoreFromRecord(viewerRecord)
  if (!Number.isFinite(viewerScore)) {
    return null
  }

  const viewerTieScore = metricConfig.tieBreaker(viewerRecord)

  const higherPrimaryQuery = applyPeriodFilter(
    supabaseClient
      .from('users')
      .select('telegram_id', { count: 'exact', head: true })
      .or(LEADERBOARD_VISIBILITY_FILTER)
      .neq('telegram_id', viewerTelegramId)
      .gt(metricConfig.primaryField, viewerScore),
    category,
    period,
    periodStart
  )

  const { count: higherPrimaryCount, error: higherPrimaryError } =
    await higherPrimaryQuery

  if (higherPrimaryError) {
    throw new Error(
      `Failed to count higher ranks: ${higherPrimaryError.message}`
    )
  }

  let higherTieCount = 0
  if (metricConfig.secondaryField) {
    const higherTieQuery = applyPeriodFilter(
      supabaseClient
        .from('users')
        .select('telegram_id', { count: 'exact', head: true })
        .or(LEADERBOARD_VISIBILITY_FILTER)
        .neq('telegram_id', viewerTelegramId)
        .eq(metricConfig.primaryField, viewerScore)
        .gt(metricConfig.secondaryField, viewerTieScore),
      category,
      period,
      periodStart
    )

    const { count: tieCount, error: tieError } = await higherTieQuery

    if (tieError) {
      throw new Error(`Failed to count tie ranks: ${tieError.message}`)
    }

    higherTieCount = tieCount ?? 0
  }

  const rank = (higherPrimaryCount ?? 0) + higherTieCount + 1

  return mapLeaderboardEntry(viewerRecord, category, period, rank)
}

/**
 * 🔒 Функция для получения Supabase клиента с JWT (RLS-защищенный)
 */
async function getSupabaseClient(jwt = null) {
  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL not configured')
  }

  // ✅ ПРИОРИТЕТ: Используем JWT для RLS-защищенных запросов
  if (jwt) {
    try {
      const { createAuthenticatedSupabaseClient } = await import('./_jwt.js')
      console.log('✅ Using JWT-authenticated Supabase client (RLS enabled)')
      return await createAuthenticatedSupabaseClient(jwt)
    } catch (error) {
      console.error('❌ Failed to create JWT client:', error)
      // Fallback на SERVICE_ROLE_KEY ниже
    }
  }

  // ⚠️ FALLBACK: SERVICE_ROLE_KEY (минует RLS, использовать только для admin операций)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured')
  }

  console.warn('⚠️ Using SERVICE_ROLE_KEY (bypasses RLS) - migrate to JWT!')
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/**
 * Защищенная функция обработки API запросов
 */
async function protectedHandler(req, res) {
  try {
    const { action } = req.query

    // 🔑 СПЕЦИАЛЬНЫЙ СЛУЧАЙ: Проверяем запросы от бота
    const botSecret = req.headers['x-bot-secret']
    const EXPECTED_BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

    // Отладочная информация убрана для чистоты логов

    if (botSecret === EXPECTED_BOT_SECRET) {
      console.log('🤖 Bot request detected, bypassing authentication')

      // Для запросов от бота используем SERVICE_ROLE_KEY напрямую
      const supabase = await getSupabaseClient(null) // null = использует SERVICE_ROLE_KEY

      // Обрабатываем только get_profile для бота
      if (action === 'get_profile') {
        const telegramId = req.query.telegramId || req.body.telegramId

        if (!telegramId) {
          return res.status(400).json({
            success: false,
            error: 'Missing telegramId',
          })
        }

        // Получаем или создаем пользователя
        const user = await ensureUser(parseInt(telegramId))

        // Вычисляем статистику
        const stats = await calculateUserStats(user)

        // Проверяем достижения
        const achievementUpdates = await checkAndUpdateAchievements(
          user.telegram_id
        )

        // Получаем актуальные достижения пользователя
        const { data: userAchievements, error: achievementsError } =
          await supabase
            .from('user_achievements')
            .select(
              `
            achievement_id,
            is_unlocked,
            progress,
            unlocked_at,
            achievements!inner (
              name,
              description,
              emoji,
              category,
              rarity
            )
          `
            )
            .eq('telegram_id', user.telegram_id)

        if (achievementsError) {
          console.error('Error fetching achievements:', achievementsError)
        }

        return res.status(200).json({
          success: true,
          data: {
            user: {
              ...user,
              registration_date: user.registration_date || user.created_at,
            },
            stats,
            achievements: userAchievements || [],
            newlyUnlocked: achievementUpdates.filter(a => a.newly_unlocked),
          },
        })
      }

      // Для других действий от бота возвращаем ошибку
      return res.status(403).json({
        success: false,
        error: 'Bot can only access get_profile action',
      })
    }

    // Для большинства действий проверяем что пользователь работает со своими данными
    const requestedTelegramId = req.query.telegramId || req.body.telegramId
    const authenticatedTelegramId = req.auth.telegramId

    // Исключения: get_friend_profile разрешает просмотр профилей друзей
    const allowedActionsWithDifferentId = ['get_friend_profile']

    if (
      requestedTelegramId &&
      !allowedActionsWithDifferentId.includes(action)
    ) {
      if (!verifyTelegramId(requestedTelegramId, authenticatedTelegramId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only access your own data',
        })
      }
    }

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    switch (action) {
      case 'get_profile': {
        if (req.method !== 'GET' && req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        let telegramId, userData

        if (req.method === 'GET') {
          telegramId = req.query.telegramId
        } else {
          // POST метод позволяет передать userData при создании
          telegramId = req.body.telegramId
          userData = req.body.userData
        }

        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        // 🔥 ИСПРАВЛЕНИЕ: Используем данные из req.auth.userData если они не переданы в body
        // Это особенно важно при GET запросах и первой авторизации
        if (!userData && req.auth?.userData) {
          // Преобразуем camelCase (req.auth.userData) в snake_case (для БД)
          userData = {
            first_name: req.auth.userData.firstName,
            last_name: req.auth.userData.lastName,
            username: req.auth.userData.username,
            photo_url: req.auth.userData.photoUrl,
            language_code: req.auth.userData.languageCode,
          }
          console.log(`📝 Using auth data for user ${telegramId}:`, userData)
        }

        // Получаем или создаем пользователя с данными Telegram
        const user = await ensureUser(parseInt(telegramId), userData)

        // Вычисляем статистику
        const stats = await calculateUserStats(user)

        // Проверяем достижения
        const achievementUpdates = await checkAndUpdateAchievements(
          user.telegram_id
        )

        // Получаем актуальные достижения пользователя
        const { data: userAchievements, error: achievementsError } =
          await supabase
            .from('user_achievements')
            .select(
              `
            achievement_id,
            is_unlocked,
            progress,
            unlocked_at,
            achievements!inner (
              name,
              description,
              emoji,
              category,
              rarity
            )
          `
            )
            .eq('telegram_id', user.telegram_id)

        if (achievementsError) {
          console.error('Error fetching achievements:', achievementsError)
        }

        return res.status(200).json({
          success: true,
          data: {
            user: {
              ...user,
              registration_date: user.registration_date || user.created_at, // Используем created_at как fallback
            },
            stats,
            achievements: userAchievements || [],
            newlyUnlocked: achievementUpdates.filter(a => a.newly_unlocked),
          },
        })
      }

      case 'get_leaderboard': {
        if (req.method !== 'GET') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const rawCategory = String(req.query.category ?? '').toLowerCase()
        const rawPeriod = String(req.query.period ?? '').toLowerCase()

        if (!LEADERBOARD_CATEGORIES.includes(rawCategory)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid category',
          })
        }

        if (!LEADERBOARD_PERIODS.includes(rawPeriod)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid period',
          })
        }

        const limit = parseIntegerParam(
          req.query.limit,
          DEFAULT_LEADERBOARD_LIMIT,
          1,
          MAX_LEADERBOARD_LIMIT
        )

        const includeViewer = parseBooleanParam(req.query.includeViewer, true)

        const viewerTelegramIdRaw = req.query.viewerTelegramId
        let viewerTelegramId = null
        if (viewerTelegramIdRaw !== undefined) {
          viewerTelegramId = Number.parseInt(viewerTelegramIdRaw, 10)
          if (Number.isNaN(viewerTelegramId)) {
            return res.status(400).json({
              success: false,
              error: 'viewerTelegramId must be a number',
            })
          }
        }

        try {
          const adminSupabase = await getSupabaseClient(null)
          const periodStart = getPeriodStart(rawPeriod)

          const entries = await fetchLeaderboardEntries({
            supabaseClient: adminSupabase,
            category: rawCategory,
            period: rawPeriod,
            limit,
            periodStart,
          })

          let viewerPosition = null
          if (includeViewer && viewerTelegramId) {
            const existing = entries.find(
              entry => entry.user.telegram_id === viewerTelegramId
            )

            if (existing) {
              viewerPosition = existing
            } else {
              viewerPosition = await fetchViewerLeaderboardPosition({
                supabaseClient: adminSupabase,
                category: rawCategory,
                period: rawPeriod,
                periodStart,
                viewerTelegramId,
              })
            }
          }

          return res.status(200).json({
            success: true,
            data: {
              entries,
              viewerPosition: viewerPosition ?? null,
              category: rawCategory,
              period: rawPeriod,
              timestamp: new Date().toISOString(),
            },
          })
        } catch (leaderboardError) {
          console.error('Leaderboard error:', leaderboardError)
          return res.status(500).json({
            success: false,
            error: 'Failed to load leaderboard',
          })
        }
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

        const user = await ensureUser(parseInt(telegramId))

        const { data, error } = await supabase
          .from('users')
          .update({ privacy_settings: privacySettings })
          .eq('telegram_id', user.telegram_id)
          .select()
          .single()

        if (error) {
          console.error('Privacy update error:', error)
          return res
            .status(500)
            .json({ success: false, error: 'Database error' })
        }

        return res.status(200).json({
          success: true,
          data: { privacy_settings: data.privacy_settings },
        })
      }

      case 'add_experience': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, experiencePoints, reason } = req.body
        if (!telegramId || !experiencePoints) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing required fields' })
        }

        const user = await ensureUser(parseInt(telegramId))

        // Добавляем опыт
        const experienceResult = await addExperience(
          user.telegram_id,
          experiencePoints
        )

        // Проверяем новые достижения
        const achievementUpdates = await checkAndUpdateAchievements(
          user.telegram_id
        )

        return res.status(200).json({
          success: true,
          data: {
            experience: experienceResult.new_experience,
            level: experienceResult.new_level,
            leveledUp: experienceResult.level_up || false,
            // 🆕 Награды за level up (Этап 2)
            sproutReward: experienceResult.sprout_reward || 0,
            gemReward: experienceResult.gem_reward || 0,
            specialUnlock: experienceResult.special_unlock || null,
            // Достижения
            newAchievements: achievementUpdates.filter(a => a.newly_unlocked),
            reason: reason || 'Unknown',
          },
        })
      }

      case 'recalculate_experience': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId } = req.body
        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        const user = await ensureUser(parseInt(telegramId))

        // Получаем статистику пользователя
        const stats = await calculateUserStats(user)
        if (!stats) {
          return res
            .status(500)
            .json({ success: false, error: 'Failed to calculate stats' })
        }

        // Рассчитываем опыт на основе текущих данных
        // Простая формула: 10 опыта за запись настроения + 15 за элемент сада + бонус за стрики
        const experienceFromMoods = stats.totalMoodEntries * 10
        const experienceFromElements = stats.totalElements * 15
        const experienceFromStreaks = Math.floor(stats.longestStreak / 7) * 50
        const totalCalculatedExperience =
          experienceFromMoods + experienceFromElements + experienceFromStreaks

        // Обновляем опыт в БД через RPC
        const { data, error } = await supabase.rpc('add_user_experience', {
          p_telegram_id: parseInt(telegramId),
          p_experience_points:
            totalCalculatedExperience - (stats.experience || 0), // Разница
        })

        if (error) {
          console.error('Error recalculating experience:', error)
          return res
            .status(500)
            .json({ success: false, error: 'Failed to update experience' })
        }

        // Проверяем новые достижения после обновления опыта
        const achievementUpdates = await checkAndUpdateAchievements(
          user.telegram_id
        )

        return res.status(200).json({
          success: true,
          data: {
            oldExperience: stats.experience || 0,
            newExperience: data[0]?.new_experience || totalCalculatedExperience,
            oldLevel: stats.level || 1,
            newLevel: data[0]?.new_level || 1,
            leveledUp: data[0]?.level_up || false,
            // 🆕 Награды за level up (Этап 2)
            sproutReward: data[0]?.sprout_reward || 0,
            gemReward: data[0]?.gem_reward || 0,
            specialUnlock: data[0]?.special_unlock || null,
            calculation: {
              fromMoods: experienceFromMoods,
              fromElements: experienceFromElements,
              fromStreaks: experienceFromStreaks,
              total: totalCalculatedExperience,
            },
            newAchievements: achievementUpdates.filter(a => a.newly_unlocked),
          },
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
          return res.status(400).json({
            success: false,
            error: 'Missing telegramId or friendTelegramId',
          })
        }

        const viewerTelegramId = Number.parseInt(telegramId, 10)
        const targetTelegramId = Number.parseInt(friendTelegramId, 10)

        if (
          Number.isNaN(viewerTelegramId) ||
          Number.isNaN(targetTelegramId) ||
          viewerTelegramId <= 0 ||
          targetTelegramId <= 0
        ) {
          return res.status(400).json({
            success: false,
            error: 'Invalid telegramId values',
          })
        }

        // Проверяем, что пользователи - друзья (если профиль приватный)
        // 🔓 Используем admin client для чтения данных о дружбе (обход RLS)
        const adminSupabase = await createAdminSupabaseClient()

        // 🔒 Безопасный запрос с параметризацией (защита от SQL инъекций)
        const { data: friendships, error: friendshipError } =
          await adminSupabase
            .from('friendships')
            .select('*')
            .eq('status', 'accepted')
            .or(
              `and(requester_telegram_id.eq.${viewerTelegramId},addressee_telegram_id.eq.${targetTelegramId}),and(requester_telegram_id.eq.${targetTelegramId},addressee_telegram_id.eq.${viewerTelegramId})`
            )
            .limit(1)

        const friendship = friendships?.[0] || null

        console.log('🔍 [PROFILE] Initial friendship check:', {
          viewerTelegramId,
          targetTelegramId,
          friendship: !!friendship,
          friendshipError,
        })

        // Если не друзья, проверим настройки приватности
        if (friendshipError || !friendship) {
          // Получаем данные друга для проверки приватности
          const friend = await ensureUser(targetTelegramId)
          const privacySettings = friend.privacy_settings || {}

          // Если профиль приватный - требуем дружбу
          if (!privacySettings.showProfile) {
            return res.status(403).json({
              success: false,
              error: 'Профиль недоступен или пользователь не в друзьях',
            })
          }

          // Если профиль публичный - разрешаем просмотр
          console.log(
            `✅ Public profile access granted for user ${friendTelegramId}`
          )
        }

        // Получаем данные друга
        const friend = await ensureUser(targetTelegramId)

        // Получаем настройки приватности друга
        // 🔥 ИСПРАВЛЕНИЕ: Нормализуем privacy_settings (может быть строкой или объектом)
        let privacySettings = friend.privacy_settings || {}
        if (typeof privacySettings === 'string') {
          try {
            privacySettings = JSON.parse(privacySettings)
          } catch (e) {
            console.error('Error parsing privacy_settings:', e)
            privacySettings = {}
          }
        }
        // Убеждаемся что shareAchievements - boolean
        if (privacySettings.shareAchievements === undefined) {
          privacySettings.shareAchievements = true // Значение по умолчанию
        }

        // Обновляем достижения друга (чтобы они были актуальными)
        await checkAndUpdateAchievements(friend.telegram_id)

        // Получаем публичную статистику
        const stats = await calculateUserStats(friend)

        // 🔍 ОТЛАДКА: Логируем данные друга для диагностики
        console.log('🔍 Friend Profile Debug:', {
          friendTelegramId,
          friendId: friend.id,
          registrationDate: friend.registration_date,
          daysSinceReg: stats?.totalDays,
          longestStreak: stats?.longestStreak,
          totalElements: stats?.totalElements,
          privacy: privacySettings,
          fullStats: stats,
        })

        // Достижения (если разрешены)
        let achievements = []
        if (privacySettings.shareAchievements) {
          // 🔥 ИСПРАВЛЕНИЕ: Используем SERVICE_ROLE_KEY для чтения данных друга
          // так как RLS политики могут блокировать доступ к данным других пользователей
          const friendSupabase = await getSupabaseClient(null) // null = SERVICE_ROLE_KEY

          // 🔍 ОТЛАДКА: Логируем проверку перед запросом
          console.log('🔍 Fetching friend achievements:', {
            friendTelegramId: friend.telegram_id,
            shareAchievements: privacySettings.shareAchievements,
          })

          const { data: userAchievements, error: friendAchievementsError } =
            await friendSupabase
              .from('user_achievements')
              .select(
                `
              achievement_id,
              is_unlocked,
              unlocked_at,
              achievements!inner (
                name,
                description,
                emoji,
                category
              )
            `
              )
              .eq('telegram_id', friend.telegram_id)
              .eq('is_unlocked', true)

          // 🔍 ОТЛАДКА: Логируем результат запроса
          console.log('🔍 Friend achievements query result:', {
            friendTelegramId: friend.telegram_id,
            hasError: !!friendAchievementsError,
            error: friendAchievementsError,
            achievementsCount: userAchievements?.length || 0,
            achievements: userAchievements,
          })

          if (friendAchievementsError) {
            console.error(
              'Error fetching friend achievements:',
              friendAchievementsError
            )
          }

          achievements = userAchievements || []
        } else {
          console.log(
            '🔍 Friend achievements skipped (shareAchievements = false):',
            {
              friendTelegramId: friend.telegram_id,
              shareAchievements: privacySettings.shareAchievements,
            }
          )
        }

        return res.status(200).json({
          success: true,
          data: {
            user: {
              id: friend.id,
              telegram_id: friend.telegram_id,
              first_name: friend.first_name,
              last_name: friend.last_name,
              username: friend.username,
              photo_url: friend.photo_url,
              level: friend.level,
              registration_date: friend.registration_date || friend.created_at,
            },
            stats: privacySettings.shareGarden ? stats : null,
            achievements: privacySettings.shareAchievements ? achievements : [],
            privacy: {
              showProfile: privacySettings.showProfile,
              shareGarden: privacySettings.shareGarden,
              shareAchievements: privacySettings.shareAchievements,
            },
            relationship: await (async () => {
              console.log('🔍 [PROFILE] Fetching relationship:', {
                viewerTelegramId,
                targetTelegramId,
              })

              // 🔓 Используем admin client для чтения relationship (обход RLS)
              const { data: relationRow, error: relationError } =
                await adminSupabase
                  .from('friendships')
                  .select(
                    'status, requester_telegram_id, addressee_telegram_id'
                  )
                  .or(
                    `and(requester_telegram_id.eq.${viewerTelegramId},addressee_telegram_id.eq.${targetTelegramId}),and(requester_telegram_id.eq.${targetTelegramId},addressee_telegram_id.eq.${viewerTelegramId})`
                  )
                  .maybeSingle()

              console.log('🔍 [PROFILE] Relationship query result:', {
                relationRow,
                relationError,
                hasData: !!relationRow,
              })

              if (relationError) {
                console.error(
                  '❌ [PROFILE] Failed to fetch relationship info:',
                  relationError
                )
              }

              let status = 'none'
              let canSendRequest = true
              let pendingDirection = null

              if (relationRow) {
                const requesterId = relationRow.requester_telegram_id
                const dbStatus = relationRow.status

                if (dbStatus === 'accepted') {
                  status = 'friend'
                  canSendRequest = false
                } else if (dbStatus === 'pending') {
                  canSendRequest = false
                  if (requesterId === viewerTelegramId) {
                    status = 'pending_outgoing'
                    pendingDirection = 'outgoing'
                  } else if (requesterId === targetTelegramId) {
                    status = 'pending_incoming'
                    pendingDirection = 'incoming'
                  } else {
                    status = 'pending'
                  }
                } else if (dbStatus === 'blocked') {
                  status = 'blocked'
                  canSendRequest = false
                } else if (dbStatus === 'declined') {
                  status = 'none'
                  canSendRequest = true
                }
              }

              return {
                status,
                canSendRequest,
                pendingDirection,
              }
            })(),
          },
        })
      }

      case 'update_user_stats': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId } = req.body
        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        try {
          // Вызываем функцию пересчета статистики в БД
          const { data, error } = await supabase.rpc('update_user_stats', {
            target_telegram_id: parseInt(telegramId),
          })

          if (error) {
            console.error('Error updating user stats:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update user stats',
              details: error.message,
            })
          }

          return res.status(200).json({
            success: true,
            data: {
              message: 'User stats updated successfully',
              stats: data,
            },
          })
        } catch (err) {
          console.error('Stats update error:', err)
          return res.status(500).json({
            success: false,
            error: 'Failed to update user stats',
            details: err.message,
          })
        }
      }

      case 'update_all_user_stats': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        try {
          // Вызываем функцию массового пересчета статистики
          const { data, error } = await supabase.rpc('update_all_user_stats')

          if (error) {
            console.error('Error updating all user stats:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update all user stats',
              details: error.message,
            })
          }

          return res.status(200).json({
            success: true,
            data: {
              message: 'All user stats updated successfully',
              results: data,
            },
          })
        } catch (err) {
          console.error('Bulk stats update error:', err)
          return res.status(500).json({
            success: false,
            error: 'Failed to update all user stats',
            details: err.message,
          })
        }
      }

      case 'update_notifications': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, notificationSettings } = req.body

        if (!telegramId || !notificationSettings) {
          return res.status(400).json({
            success: false,
            error:
              'Missing required parameters: telegramId, notificationSettings',
          })
        }

        try {
          console.log(
            `🔔 Updating notification settings for user ${telegramId}:`,
            notificationSettings
          )

          // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
          const supabase = await getSupabaseClient(req.auth?.jwt)

          const { data, error } = await supabase
            .from('users')
            .update({
              notification_settings: notificationSettings,
              updated_at: new Date().toISOString(),
            })
            .eq('telegram_id', telegramId)
            .select()

          if (error) {
            console.error('Failed to update notification settings:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update notification settings',
            })
          }

          console.log(`✅ Notification settings updated for user ${telegramId}`)

          return res.status(200).json({
            success: true,
            data: {
              notificationSettings,
              message: 'Notification settings updated successfully',
            },
          })
        } catch (error) {
          console.error('Update notifications error:', error)
          return res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }

      case 'import_guest': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        const { telegramId, user, garden, moodHistory, onlyIfNew } =
          req.body || {}

        if (!telegramId) {
          return res
            .status(400)
            .json({ success: false, error: 'Missing telegramId' })
        }

        try {
          // Проверяем существование пользователя
          let existingUser = null
          let existingUserError = null

          try {
            const { data, error } = await supabase
              .from('users')
              .select('telegram_id')
              .eq('telegram_id', telegramId)
              .single()
            existingUser = data
            existingUserError = error
          } catch (err) {
            if (err?.code === 'PGRST116') {
              existingUser = null
              existingUserError = null
            } else {
              existingUserError = err
            }
          }

          if (existingUserError) {
            console.error('Failed to check existing user:', existingUserError)
            return res.status(500).json({
              success: false,
              error: 'Failed to check existing user',
            })
          }

          if (existingUser && onlyIfNew) {
            return res.status(200).json({
              success: true,
              skipped: true,
              reason: 'User already exists',
            })
          }

          // Создаем пользователя, если его нет
          let ensuredUser = existingUser
          if (!existingUser) {
            const userData = user
              ? {
                  first_name: user.firstName ?? null,
                  last_name: user.lastName ?? null,
                  username: user.username ?? null,
                  photo_url: user.photoUrl ?? null,
                  language_code: user.preferences?.language ?? 'ru',
                }
              : {}

            ensuredUser = await ensureUser(parseInt(telegramId, 10), userData)
          }

          // Импортируем историю настроений (только если передана)
          let importedMoods = 0
          if (Array.isArray(moodHistory) && moodHistory.length > 0) {
            const moodRows = moodHistory.map(entry => ({
              telegram_id: telegramId,
              mood: entry.mood,
              intensity: entry.intensity,
              mood_date: entry.date
                ? new Date(entry.date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
              note: entry.note ?? null,
              created_at: entry.createdAt
                ? new Date(entry.createdAt).toISOString()
                : new Date().toISOString(),
            }))

            const { error: moodError } = await supabase
              .from('mood_entries')
              .insert(moodRows)

            if (moodError) {
              console.error('Failed to import mood history:', moodError)
            } else {
              importedMoods = moodRows.length
            }
          }

          // Импортируем сад (только если передан)
          let importedElements = 0
          if (garden?.elements?.length) {
            const elementRows = garden.elements.map(el => ({
              telegram_id: telegramId,
              element_type: el.type,
              rarity: el.rarity,
              position_x: el.position?.x ?? 0,
              position_y: el.position?.y ?? 0,
              mood_influence: el.moodInfluence,
              unlock_date: el.unlockDate
                ? new Date(el.unlockDate).toISOString()
                : new Date().toISOString(),
              seasonal_variant: el.seasonalVariant ?? null,
            }))

            const { error: gardenError } = await supabase
              .from('garden_elements')
              .insert(elementRows)

            if (gardenError) {
              console.error('Failed to import garden elements:', gardenError)
            } else {
              importedElements = elementRows.length
            }
          }

          return res.status(200).json({
            success: true,
            skipped: false,
            imported: {
              moodEntries: importedMoods,
              gardenElements: importedElements,
            },
          })
        } catch (error) {
          console.error('Import guest data error:', error)
          return res
            .status(500)
            .json({ success: false, error: 'Failed to import guest data' })
        }
      }

      // ⚠️ Административное действие - требует специальной защиты
      case 'update_all_user_stats': {
        if (req.method !== 'POST') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' })
        }

        // 🔐 Административное действие - проверяем внутренний ключ или IP
        const adminKey = req.headers['x-admin-key']
        const EXPECTED_ADMIN_KEY = process.env.ADMIN_API_KEY

        if (!EXPECTED_ADMIN_KEY || adminKey !== EXPECTED_ADMIN_KEY) {
          console.warn('⚠️ Unauthorized attempt to call administrative API')
          return res.status(403).json({
            success: false,
            error:
              'Forbidden: Administrative action requires special authorization',
          })
        }

        try {
          // Вызываем функцию массового пересчета статистики
          const { data, error } = await supabase.rpc('update_all_user_stats')

          if (error) {
            console.error('Error updating all user stats:', error)
            return res.status(500).json({
              success: false,
              error: 'Failed to update all user stats',
              details: error.message,
            })
          }

          return res.status(200).json({
            success: true,
            data: {
              message: 'All user stats updated successfully',
              results: data,
            },
          })
        } catch (err) {
          console.error('Bulk stats update error:', err)
          return res.status(500).json({
            success: false,
            error: 'Failed to update all user stats',
            details: err.message,
          })
        }
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Profile API Error:', error)
    console.error('Stack trace:', error.stack)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

/**
 * Обмен Supabase Auth access token → Kirakira JWT (с telegram_id для RLS и API).
 */

import { verifySupabaseJWT, generateSupabaseJWT } from './_jwt.js'

/**
 * @param {Record<string, unknown>} payload
 * @returns {boolean}
 */
export function isSupabaseAuthAccessPayload(payload) {
  if (!payload || typeof payload !== 'object') return false
  const iss = payload.iss
  if (typeof iss !== 'string' || !iss.includes('supabase.co')) return false
  if (payload.telegram_id != null && payload.telegram_id !== '') return false
  const role = payload.role
  if (role !== 'authenticated') return false
  const sub = payload.sub
  return typeof sub === 'string' && isUuid(sub)
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} authUserId
 * @returns {Promise<number|null>}
 */
async function findTelegramIdByAuthUserId(admin, authUserId) {
  const { data, error } = await admin
    .from('users')
    .select('telegram_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    console.error('findTelegramIdByAuthUserId:', error.message)
    return null
  }
  if (data && typeof data.telegram_id === 'number') {
    return data.telegram_id
  }
  return null
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {string}
 */
function pickEmailFromPayload(payload) {
  const direct = payload.email
  if (typeof direct === 'string' && direct.length > 0) return direct
  const um = payload.user_metadata
  if (um && typeof um === 'object' && 'email' in um) {
    const e = /** @type {{ email?: unknown }} */ (um).email
    if (typeof e === 'string' && e.length > 0) return e
  }
  return ''
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {Record<string, unknown>} payload
 * @returns {Promise<number>}
 */
async function createWebOnlyUserRow(admin, payload) {
  const authUserId = /** @type {string} */ (payload.sub)
  const email = pickEmailFromPayload(payload)
  const localPart =
    email.includes('@') ? email.split('@')[0] : email || 'player'

  const { data: telegramIdRaw, error: rpcError } = await admin.rpc(
    'next_kirakira_internal_telegram_id'
  )

  if (rpcError) {
    throw new Error(
      `RPC next_kirakira_internal_telegram_id: ${rpcError.message}. Выполните SQL-миграцию docs/migrations/20260328_auth_user_id_internal_telegram.sql`
    )
  }

  const telegramId =
    typeof telegramIdRaw === 'number'
      ? telegramIdRaw
      : typeof telegramIdRaw === 'string'
        ? parseInt(telegramIdRaw, 10)
        : NaN

  if (!Number.isFinite(telegramId)) {
    throw new Error('Invalid telegram id from sequence RPC')
  }

  const row = {
    telegram_id: telegramId,
    auth_user_id: authUserId,
    user_id: authUserId,
    username: localPart.slice(0, 64) || 'player',
    first_name: localPart.slice(0, 64) || 'Игрок',
    is_anonymous: false,
  }

  const { error: insertError } = await admin.from('users').insert(row)

  if (insertError) {
    if (insertError.code === '23505') {
      const existingTid = await findTelegramIdByAuthUserId(admin, authUserId)
      if (existingTid != null) return existingTid
    }
    throw new Error(`Insert users: ${insertError.message}`)
  }

  return telegramId
}

/**
 * @param {string} accessToken
 * @returns {Promise<{ token: string, telegramId: number }>}
 */
export async function exchangeSupabaseAccessTokenForKirakiraJWT(accessToken) {
  const payload = verifySupabaseJWT(accessToken)
  if (!payload || !isSupabaseAuthAccessPayload(payload)) {
    throw new Error('INVALID_SUPABASE_TOKEN')
  }

  const authUserId = /** @type {string} */ (payload.sub)
  const { createAdminSupabaseClient } = await import('./_jwt.js')
  const admin = await createAdminSupabaseClient()

  let telegramId = await findTelegramIdByAuthUserId(admin, authUserId)
  if (telegramId == null) {
    telegramId = await createWebOnlyUserRow(admin, payload)
  }

  const email = pickEmailFromPayload(payload)
  const localPart =
    email.includes('@') ? email.split('@')[0] : email || undefined

  const token = generateSupabaseJWT(telegramId, {
    firstName: localPart ?? undefined,
    lastName: undefined,
    username: localPart,
  })

  return { token, telegramId }
}

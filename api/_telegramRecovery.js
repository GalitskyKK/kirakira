/**
 * Восстановление: привязка текущего входа по почте (synthetic telegram_id + auth_user_id)
 * к существующему профилю Telegram по username и коду из лички бота.
 */

import crypto from 'crypto'

const CODE_TTL_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_REQUESTS_PER_HOUR = 5

/**
 * @param {string} code
 * @returns {string}
 */
function hashRecoveryCode(code) {
  const pepper =
    process.env.RECOVERY_CODE_PEPPER ||
    process.env.TELEGRAM_BOT_SECRET ||
    'fallback-pepper-set-env'
  return crypto.createHmac('sha256', pepper).update(code).digest('hex')
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeTelegramUsername(raw) {
  if (typeof raw !== 'string') return ''
  let s = raw.trim()
  if (s.startsWith('@')) s = s.slice(1)
  return s.toLowerCase()
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} usernameNormalized
 * @returns {Promise<{ telegram_id: number, auth_user_id: string | null, username: string | null } | null>}
 */
async function findUserByUsername(admin, usernameNormalized) {
  if (!usernameNormalized) return null

  const { data, error } = await admin
    .from('users')
    .select('telegram_id, auth_user_id, username')
    .ilike('username', usernameNormalized)
    .limit(5)

  if (error || !data?.length) {
    return null
  }

  const exact = data.filter(
    row =>
      typeof row.username === 'string' &&
      row.username.toLowerCase() === usernameNormalized
  )

  const list = exact.length > 0 ? exact : data
  if (list.length !== 1) {
    return null
  }

  const row = list[0]
  if (row.telegram_id == null) return null

  return {
    telegram_id: Number(row.telegram_id),
    auth_user_id: row.auth_user_id ?? null,
    username: row.username ?? null,
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {number} telegramId
 * @returns {Promise<boolean>}
 */
async function requesterAccountIsMergeable(admin, telegramId) {
  const { count: gardenCount, error: gErr } = await admin
    .from('garden_elements')
    .select('id', { count: 'exact', head: true })
    .eq('telegram_id', telegramId)

  if (gErr) return false
  if ((gardenCount ?? 0) > 0) return false

  const { count: moodCount, error: mErr } = await admin
    .from('mood_entries')
    .select('id', { count: 'exact', head: true })
    .eq('telegram_id', telegramId)

  if (mErr) return false
  if ((moodCount ?? 0) > 0) return false

  const { data: currency, error: cErr } = await admin
    .from('user_currency')
    .select('sprouts, gems, total_sprouts_earned, total_gems_earned')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  if (cErr) return false
  if (currency) {
    const spentOrEarned =
      (currency.total_sprouts_earned ?? 0) > 0 ||
      (currency.total_gems_earned ?? 0) > 0 ||
      (currency.sprouts ?? 0) > 0 ||
      (currency.gems ?? 0) > 0
    if (spentOrEarned) return false
  }

  return true
}

/**
 * @param {string} botToken
 * @param {number} chatId
 * @param {string} code
 */
async function sendTelegramRecoveryCode(botToken, chatId, code) {
  const text = `KiraKira — код восстановления аккаунта: ${code}\nЕсли вы не запрашивали, проигнорируйте сообщение.`
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  )
  const result = await response.json()
  if (!result.ok) {
    throw new Error(
      typeof result.description === 'string'
        ? result.description
        : 'telegram_send_failed'
    )
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {number} telegramId
 */
async function deleteUserCascade(admin, telegramId) {
  const { data: elements } = await admin
    .from('garden_elements')
    .select('id')
    .eq('telegram_id', telegramId)

  const elementIds = (elements ?? [])
    .map(row => row.id)
    .filter(id => typeof id === 'string')

  if (elementIds.length > 0) {
    await admin.from('element_upgrades').delete().in('element_id', elementIds)
  }

  await admin.from('garden_elements').delete().eq('telegram_id', telegramId)
  await admin.from('mood_entries').delete().eq('telegram_id', telegramId)
  await admin.from('daily_quests').delete().eq('telegram_id', telegramId)

  const { data: participants } = await admin
    .from('challenge_participants')
    .select('id')
    .eq('telegram_id', telegramId)

  const participantIds = (participants ?? [])
    .map(row => row.id)
    .filter(id => typeof id === 'string')

  if (participantIds.length > 0) {
    await admin
      .from('challenge_daily_progress')
      .delete()
      .in('participant_id', participantIds)
  }

  await admin.from('challenge_participants').delete().eq('telegram_id', telegramId)
  await admin
    .from('challenges')
    .update({ created_by: null })
    .eq('created_by', telegramId)
  await admin.from('currency_transactions').delete().eq('telegram_id', telegramId)
  await admin.from('currency_transactions').delete().eq('related_user_id', telegramId)
  await admin
    .from('friendships')
    .delete()
    .or(
      `requester_telegram_id.eq.${telegramId},addressee_telegram_id.eq.${telegramId}`
    )
  await admin.from('premium_features').delete().eq('telegram_id', telegramId)
  await admin.from('shop_purchases').delete().eq('telegram_id', telegramId)
  await admin.from('user_achievements').delete().eq('telegram_id', telegramId)
  await admin.from('user_currency').delete().eq('telegram_id', telegramId)
  await admin.from('user_referral_codes').delete().eq('telegram_id', telegramId)

  await admin.from('recovery_challenges').delete().eq('requester_telegram_id', telegramId)
  await admin.from('recovery_challenges').delete().eq('target_telegram_id', telegramId)

  await admin.from('users').delete().eq('telegram_id', telegramId)
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {number} requesterTelegramId
 * @returns {Promise<boolean>}
 */
async function rateLimitOk(admin, requesterTelegramId) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error } = await admin
    .from('recovery_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('requester_telegram_id', requesterTelegramId)
    .gte('created_at', since)

  if (error) return false
  return (count ?? 0) < MAX_REQUESTS_PER_HOUR
}

/**
 * @param {{ authorized: boolean, telegramId: number | null }} auth
 * @param {object} body
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function recoveryRequestHandler(auth, body) {
  if (!auth.authorized || auth.telegramId == null) {
    return {
      status: 401,
      body: { success: false, error: 'Unauthorized', message: 'Нужна авторизация' },
    }
  }

  const requesterTid = auth.telegramId
  const rawUsername =
    typeof body?.telegramUsername === 'string'
      ? body.telegramUsername
      : typeof body?.username === 'string'
        ? body.username
        : ''

  const usernameNorm = normalizeTelegramUsername(rawUsername)
  if (!usernameNorm) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Bad request',
        message: 'Укажите Telegram username (без @ или с @)',
      },
    }
  }

  const { createAdminSupabaseClient } = await import('./_jwt.js')
  const admin = await createAdminSupabaseClient()

  const { data: requesterRow, error: reqErr } = await admin
    .from('users')
    .select('telegram_id, auth_user_id')
    .eq('telegram_id', requesterTid)
    .maybeSingle()

  if (reqErr || !requesterRow?.auth_user_id) {
    return {
      status: 403,
      body: {
        success: false,
        error: 'Forbidden',
        message:
          'Восстановление доступно только после входа по почте. Сначала войдите через email.',
      },
    }
  }

  const mergeable = await requesterAccountIsMergeable(admin, requesterTid)
  if (!mergeable) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Conflict',
        message:
          'На новом аккаунте уже есть данные сада или настроений. Для переноса обратитесь в поддержку.',
      },
    }
  }

  const target = await findUserByUsername(admin, usernameNorm)
  if (!target) {
    return {
      status: 404,
      body: {
        success: false,
        error: 'Not found',
        message: 'Пользователь с таким username не найден в базе приложения.',
      },
    }
  }

  if (target.telegram_id === requesterTid) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Bad request',
        message: 'Это уже ваш текущий аккаунт.',
      },
    }
  }

  if (target.auth_user_id != null) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Conflict',
        message: 'Этот Telegram-аккаунт уже привязан к другому входу.',
      },
    }
  }

  const okRate = await rateLimitOk(admin, requesterTid)
  if (!okRate) {
    return {
      status: 429,
      body: {
        success: false,
        error: 'Too many requests',
        message: 'Слишком много запросов. Попробуйте через час.',
      },
    }
  }

  const botToken =
    process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return {
      status: 500,
      body: {
        success: false,
        error: 'Config',
        message: 'Бот не настроен на сервере.',
      },
    }
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  const codeHash = hashRecoveryCode(code)
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString()

  await admin
    .from('recovery_challenges')
    .delete()
    .eq('requester_telegram_id', requesterTid)
    .eq('target_telegram_id', target.telegram_id)
    .eq('consumed', false)

  const { error: insErr } = await admin.from('recovery_challenges').insert({
    requester_telegram_id: requesterTid,
    target_telegram_id: target.telegram_id,
    code_hash: codeHash,
    expires_at: expiresAt,
    attempts: 0,
    consumed: false,
  })

  if (insErr) {
    console.error('recovery_challenges insert:', insErr)
    return {
      status: 500,
      body: {
        success: false,
        error: 'Database',
        message: 'Не удалось создать запрос восстановления.',
      },
    }
  }

  try {
    await sendTelegramRecoveryCode(botToken, target.telegram_id, code)
  } catch (telegramError) {
    console.error('Telegram send recovery:', telegramError)
    await admin
      .from('recovery_challenges')
      .delete()
      .eq('requester_telegram_id', requesterTid)
      .eq('target_telegram_id', target.telegram_id)
      .eq('consumed', false)

    return {
      status: 502,
      body: {
        success: false,
        error: 'Telegram',
        message: `Не удалось отправить код в Telegram. Убедитесь, что вы хотя бы раз нажали «Старт» в боте${
          process.env.VITE_TELEGRAM_BOT_USERNAME
            ? ` @${process.env.VITE_TELEGRAM_BOT_USERNAME}`
            : ''
        } и что username указан верно.`,
      },
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      data: {
        message:
          'Код отправлен в Telegram. Проверьте уведомления (можно не открывая приложение).',
        expiresInMinutes: CODE_TTL_MS / 60000,
      },
    },
  }
}

/**
 * @param {{ authorized: boolean, telegramId: number | null }} auth
 * @param {object} body
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function recoveryConfirmHandler(auth, body) {
  if (!auth.authorized || auth.telegramId == null) {
    return {
      status: 401,
      body: { success: false, error: 'Unauthorized', message: 'Нужна авторизация' },
    }
  }

  const requesterTid = auth.telegramId
  const code =
    typeof body?.code === 'string'
      ? body.code.trim().replace(/\s+/g, '')
      : ''

  if (!/^\d{6}$/.test(code)) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Bad request',
        message: 'Введите 6-значный код из Telegram.',
      },
    }
  }

  const { createAdminSupabaseClient, generateSupabaseJWT } = await import(
    './_jwt.js'
  )
  const admin = await createAdminSupabaseClient()

  const { data: requesterRow, error: reqErr } = await admin
    .from('users')
    .select('telegram_id, auth_user_id')
    .eq('telegram_id', requesterTid)
    .maybeSingle()

  if (reqErr || !requesterRow?.auth_user_id) {
    return {
      status: 403,
      body: {
        success: false,
        error: 'Forbidden',
        message: 'Подтверждение доступно только для входа по почте.',
      },
    }
  }

  const mergeable = await requesterAccountIsMergeable(admin, requesterTid)
  if (!mergeable) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Conflict',
        message: 'На аккаунте появились данные; автоматическое объединение отменено.',
      },
    }
  }

  const { data: challenges, error: chErr } = await admin
    .from('recovery_challenges')
    .select('*')
    .eq('requester_telegram_id', requesterTid)
    .eq('consumed', false)
    .order('created_at', { ascending: false })
    .limit(1)

  if (chErr || !challenges?.length) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Bad request',
        message: 'Нет активного запроса. Запросите код снова.',
      },
    }
  }

  const row = challenges[0]
  const expires = row.expires_at ? new Date(row.expires_at).getTime() : 0
  if (expires < Date.now()) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Expired',
        message: 'Код истёк. Запросите новый.',
      },
    }
  }

  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
    return {
      status: 429,
      body: {
        success: false,
        error: 'Locked',
        message: 'Слишком много неверных попыток. Запросите код заново.',
      },
    }
  }

  const expectedHash = row.code_hash
  const actualHash = hashRecoveryCode(code)
  if (expectedHash !== actualHash) {
    await admin
      .from('recovery_challenges')
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq('id', row.id)

    return {
      status: 400,
      body: {
        success: false,
        error: 'Invalid code',
        message: 'Неверный код.',
      },
    }
  }

  const targetTid = Number(row.target_telegram_id)
  const authUserId = requesterRow.auth_user_id

  const { data: targetUser, error: tErr } = await admin
    .from('users')
    .select('telegram_id, auth_user_id, first_name, username')
    .eq('telegram_id', targetTid)
    .maybeSingle()

  if (tErr || !targetUser || targetUser.auth_user_id != null) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Conflict',
        message: 'Целевой аккаунт уже привязан или недоступен.',
      },
    }
  }

  const { error: clearReqErr } = await admin
    .from('users')
    .update({ auth_user_id: null })
    .eq('telegram_id', requesterTid)

  if (clearReqErr) {
    console.error('recovery clear requester auth:', clearReqErr)
    return {
      status: 500,
      body: {
        success: false,
        error: 'Database',
        message: 'Не удалось подготовить привязку.',
      },
    }
  }

  const { error: linkErr } = await admin
    .from('users')
    .update({ auth_user_id: authUserId })
    .eq('telegram_id', targetTid)

  if (linkErr) {
    console.error('recovery link:', linkErr)
    await admin
      .from('users')
      .update({ auth_user_id: authUserId })
      .eq('telegram_id', requesterTid)
    return {
      status: 500,
      body: {
        success: false,
        error: 'Database',
        message: 'Не удалось привязать аккаунт.',
      },
    }
  }

  try {
    await deleteUserCascade(admin, requesterTid)
  } catch (delErr) {
    console.error('recovery delete requester:', delErr)
    await admin.from('users').update({ auth_user_id: null }).eq('telegram_id', targetTid)
    await admin
      .from('users')
      .update({ auth_user_id: authUserId })
      .eq('telegram_id', requesterTid)
    return {
      status: 500,
      body: {
        success: false,
        error: 'Database',
        message: 'Ошибка при удалении временного профиля. Обратитесь в поддержку.',
      },
    }
  }

  await admin.from('recovery_challenges').update({ consumed: true }).eq('id', row.id)

  const token = generateSupabaseJWT(targetTid, {
    firstName: targetUser.first_name ?? undefined,
    username: targetUser.username ?? undefined,
  })

  return {
    status: 200,
    body: {
      success: true,
      data: {
        token,
        telegramId: targetTid,
        message: 'Прогресс восстановлен. Вы вошли в прежний аккаунт.',
      },
    },
  }
}

import { parseApiResponseJson } from '@/utils/parseApiResponseJson'

export interface KirakiraExchangeResult {
  readonly token: string
  readonly telegramId: number
}

/**
 * Обменивает Supabase access_token на Kirakira JWT (telegram_id + RLS).
 */
export async function exchangeSupabaseAccessTokenForKirakiraJwt(
  accessToken: string
): Promise<KirakiraExchangeResult> {
  const response = await fetch('/api/auth?action=supabase_exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken,
      action: 'supabase_exchange',
    }),
  })

  const payload: unknown = await parseApiResponseJson(response)
  const body =
    payload && typeof payload === 'object'
      ? (payload as {
          readonly success?: boolean
          readonly data?: { readonly token?: string; readonly telegramId?: number }
          readonly message?: string
        })
      : null

  if (
    !response.ok ||
    !body?.success ||
    typeof body.data?.token !== 'string' ||
    typeof body.data?.telegramId !== 'number'
  ) {
    const message =
      typeof body?.message === 'string' ? body.message : 'Ошибка обмена токена'
    throw new Error(message)
  }

  return {
    token: body.data.token,
    telegramId: body.data.telegramId,
  }
}

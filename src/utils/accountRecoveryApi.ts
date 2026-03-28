import { authenticatedFetch } from '@/utils/apiClient'
import { parseApiResponseJson } from '@/utils/parseApiResponseJson'

export async function requestAccountRecoveryCode(
  telegramUsername: string
): Promise<{ readonly message: string; readonly expiresInMinutes: number }> {
  const response = await authenticatedFetch('/api/auth?action=recovery_request', {
    method: 'POST',
    body: JSON.stringify({
      telegramUsername,
      action: 'recovery_request',
    }),
  })

  const payload: unknown = await parseApiResponseJson(response)
  const body =
    payload && typeof payload === 'object'
      ? (payload as {
          readonly success?: boolean
          readonly data?: {
            readonly message?: string
            readonly expiresInMinutes?: number
          }
          readonly message?: string
        })
      : null

  if (
    !response.ok ||
    !body?.success ||
    typeof body.data?.message !== 'string'
  ) {
    const message =
      typeof body?.message === 'string' ? body.message : 'Ошибка запроса кода'
    throw new Error(message)
  }

  return {
    message: body.data.message,
    expiresInMinutes: body.data.expiresInMinutes ?? 15,
  }
}

export async function confirmAccountRecoveryCode(
  code: string
): Promise<{ readonly token: string; readonly telegramId: number }> {
  const response = await authenticatedFetch('/api/auth?action=recovery_confirm', {
    method: 'POST',
    body: JSON.stringify({ code, action: 'recovery_confirm' }),
  })

  const payload: unknown = await parseApiResponseJson(response)
  const body =
    payload && typeof payload === 'object'
      ? (payload as {
          readonly success?: boolean
          readonly data?: {
            readonly token?: string
            readonly telegramId?: number
          }
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
      typeof body?.message === 'string' ? body.message : 'Ошибка подтверждения'
    throw new Error(message)
  }

  return {
    token: body.data.token,
    telegramId: body.data.telegramId,
  }
}

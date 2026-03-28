import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Shield } from 'lucide-react'
import {
  AUTH_RESET_EVENT,
  setJWTToken,
} from '@/utils/apiClient'
import {
  confirmAccountRecoveryCode,
  requestAccountRecoveryCode,
} from '@/utils/accountRecoveryApi'
import { syncUserFromSupabase } from '@/api/userService'
import { isSupabaseBrowserConfigured } from '@/utils/supabaseViteEnv'

const recoveryCardClass =
  'rounded-2xl border border-neutral-200 bg-white p-4 transition-all dark:border-neutral-700 dark:bg-neutral-900'

export function AccountRecoveryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'identify' | 'code'>('identify')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequestCode = useCallback(async () => {
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const result = await requestAccountRecoveryCode(identifier.trim())
      setInfo(result.message)
      setStep('code')
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Ошибка'
      )
    } finally {
      setLoading(false)
    }
  }, [identifier])

  const handleConfirm = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const { token, telegramId } = await confirmAccountRecoveryCode(
        code.trim()
      )
      setJWTToken(token)
      window.dispatchEvent(new Event(AUTH_RESET_EVENT))
      await syncUserFromSupabase(telegramId)
      await queryClient.invalidateQueries({ queryKey: ['user'] })
      navigate('/', { replace: true })
    } catch (confirmError) {
      setError(
        confirmError instanceof Error ? confirmError.message : 'Ошибка'
      )
    } finally {
      setLoading(false)
    }
  }, [code, navigate, queryClient])

  const shellWithPadding =
    'min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 p-4 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900'
  const shellMain =
    'min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900'

  const headerClass =
    'glass-card sticky top-0 z-10 border-b border-neutral-200/50 shadow-sm backdrop-blur-md dark:border-neutral-700/50'

  if (!isSupabaseBrowserConfigured()) {
    return (
      <div className={shellWithPadding}>
        <header className={headerClass}>
          <div className="flex min-h-[56px] items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-shrink-0 rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
              aria-label="Назад"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Shield className="h-5 w-5 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
            <h1 className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Восстановление
            </h1>
          </div>
        </header>
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Вход по почте не настроен на этом окружении.
        </p>
      </div>
    )
  }

  return (
    <div className={shellMain}>
      <header className={headerClass}>
        <div className="flex min-h-[56px] items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-shrink-0 rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Shield className="h-5 w-5 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
          <h1 className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Восстановление аккаунта
          </h1>
        </div>
      </header>

      <div className="space-y-4 p-4 pb-24">
        <div className={recoveryCardClass}>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Доступно только если вы вошли по почте и на новом профиле ещё нет
            записей настроений и элементов сада. Код придёт в Telegram
            (уведомление можно прочитать без открытия приложения). Укажите{' '}
            <strong>@username</strong> или <strong>числовой ID</strong> из
            профиля старого аккаунта (Профиль → блок «Перенос прогресса»), если в
            базе нет username.
          </p>
        </div>

        {step === 'identify' ? (
          <div className={`${recoveryCardClass} space-y-4`}>
            <div>
              <label
                htmlFor="recovery-identifier"
                className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Telegram @username или ID
              </label>
              <input
                id="recovery-identifier"
                type="text"
                autoComplete="username"
                placeholder="@username, username или 123456789"
                value={identifier}
                onChange={event => setIdentifier(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                disabled={loading}
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleRequestCode()}
              disabled={loading || !identifier.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Отправка…' : 'Получить код в Telegram'}
            </button>
          </div>
        ) : (
          <div className={`${recoveryCardClass} space-y-4`}>
            {info ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {info}
              </p>
            ) : null}
            <div>
              <label
                htmlFor="recovery-code"
                className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Код из Telegram
              </label>
              <input
                id="recovery-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={event =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-lg tracking-widest text-neutral-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                disabled={loading}
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={loading || code.length !== 6}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Проверка…' : 'Подтвердить и войти в старый аккаунт'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('identify')
                setCode('')
                setError(null)
                setInfo(null)
              }}
              className="w-full text-sm text-neutral-500 underline dark:text-neutral-400"
            >
              Запросить код заново
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

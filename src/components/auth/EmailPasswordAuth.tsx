import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { useUserClientStore } from '@/hooks/index.v2'
import { syncUserFromSupabase } from '@/api/userService'
import {
  AUTH_RESET_EVENT,
  setJWTToken,
} from '@/utils/apiClient'
import { exchangeSupabaseAccessTokenForKirakiraJwt } from '@/utils/kirakiraAuthExchange'
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '@/lib/supabaseBrowserClient'
import { Card } from '@/components/ui'

interface EmailPasswordAuthProps {
  readonly onSuccess?: (() => void) | undefined
  readonly onError?: ((message: string) => void) | undefined
}

const MIN_PASSWORD_LENGTH = 8

type LoginSubView = 'normal' | 'forgot' | 'setNewPassword'

function hashLooksLikePasswordRecovery(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hash
  return h.includes('type=recovery') || h.includes('type%3Drecovery')
}

export function EmailPasswordAuth({
  onSuccess,
  onError,
}: EmailPasswordAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginSubView, setLoginSubView] = useState<LoginSubView>('normal')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const { completeOnboarding } = useUserClientStore()
  const queryClient = useQueryClient()

  const applyKirakiraSession = useCallback(
    async (accessToken: string) => {
      const { token, telegramId } =
        await exchangeSupabaseAccessTokenForKirakiraJwt(accessToken)
      setJWTToken(token)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_RESET_EVENT))
      }
      await getSupabaseBrowserClient().auth.signOut()
      await syncUserFromSupabase(telegramId)
      await queryClient.invalidateQueries({ queryKey: ['user'] })
      completeOnboarding()
      onSuccess?.()
    },
    [completeOnboarding, onSuccess, queryClient]
  )

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return

    if (hashLooksLikePasswordRecovery()) {
      setLoginSubView('setNewPassword')
      setMode('login')
    }

    const supabase = getSupabaseBrowserClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        setLoginSubView('setNewPassword')
        setMode('login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleForgotSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setErrorMessage(null)
      setInfoMessage(null)

      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        const message = 'Введите корректный email'
        setErrorMessage(message)
        onError?.(message)
        return
      }

      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const origin =
          typeof window !== 'undefined' ? window.location.origin : ''
        const { error } = await supabase.auth.resetPasswordForEmail(
          trimmedEmail,
          origin ? { redirectTo: `${origin}/auth` } : {}
        )
        if (error) throw error
        setInfoMessage(
          'Если аккаунт с таким email есть, на почту придёт ссылка для нового пароля. Проверьте папку «Спам».'
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Не удалось отправить письмо'
        setErrorMessage(message)
        onError?.(message)
      } finally {
        setIsLoading(false)
      }
    },
    [email, onError]
  )

  const handleSetNewPasswordSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setErrorMessage(null)
      setInfoMessage(null)

      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        const message = `Пароль не короче ${MIN_PASSWORD_LENGTH} символов`
        setErrorMessage(message)
        onError?.(message)
        return
      }
      if (newPassword !== confirmNewPassword) {
        const message = 'Пароли не совпадают'
        setErrorMessage(message)
        onError?.(message)
        return
      }

      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        })
        if (error) throw error

        const {
          data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token
        if (!accessToken) {
          throw new Error('Сессия не найдена. Запросите ссылку ещё раз.')
        }

        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          )
        }

        setNewPassword('')
        setConfirmNewPassword('')
        setLoginSubView('normal')
        await applyKirakiraSession(accessToken)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Не удалось сменить пароль'
        setErrorMessage(message)
        onError?.(message)
      } finally {
        setIsLoading(false)
      }
    },
    [applyKirakiraSession, confirmNewPassword, newPassword, onError]
  )

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setErrorMessage(null)
      setInfoMessage(null)

      if (!isSupabaseBrowserConfigured()) {
        const message =
          'Вход по почте не настроен (нет VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)'
        setErrorMessage(message)
        onError?.(message)
        return
      }

      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        const message = 'Введите корректный email'
        setErrorMessage(message)
        onError?.(message)
        return
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        const message = `Пароль не короче ${MIN_PASSWORD_LENGTH} символов`
        setErrorMessage(message)
        onError?.(message)
        return
      }

      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const origin =
          typeof window !== 'undefined' ? window.location.origin : ''

        if (mode === 'register') {
          const { data, error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              ...(origin ? { emailRedirectTo: `${origin}/auth` } : {}),
            },
          })

          if (error) {
            throw error
          }

          if (data.session?.access_token) {
            await applyKirakiraSession(data.session.access_token)
            return
          }

          setInfoMessage(
            'На почту отправлено письмо. Подтвердите email по ссылке, затем войдите с паролем.'
          )
          return
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })

        if (error) {
          throw error
        }

        const accessToken = data.session?.access_token
        if (!accessToken) {
          throw new Error('Нет сессии. Подтвердите email по ссылке из письма.')
        }

        await applyKirakiraSession(accessToken)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ошибка авторизации'
        setErrorMessage(message)
        onError?.(message)
      } finally {
        setIsLoading(false)
      }
    },
    [applyKirakiraSession, email, mode, onError, password]
  )

  if (!isSupabaseBrowserConfigured()) {
    return (
      <Card className="border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        Для входа по почте добавьте в сборку переменные{' '}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">
          VITE_SUPABASE_URL
        </code>{' '}
        и{' '}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">
          VITE_SUPABASE_ANON_KEY
        </code>
        .
      </Card>
    )
  }

  if (loginSubView === 'setNewPassword') {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-neutral-200/80 bg-white/60 px-4 py-3 dark:border-neutral-700/80 dark:bg-neutral-900/40">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Новый пароль
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Задайте пароль для входа по почте.
          </p>
        </div>

        <form
          onSubmit={event => void handleSetNewPasswordSubmit(event)}
          className="space-y-4 p-4"
        >
          <div>
            <label
              htmlFor="kirakira-new-password"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Новый пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="kirakira-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-neutral-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="kirakira-confirm-password"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Повтор пароля
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="kirakira-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={event => setConfirmNewPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-neutral-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          {errorMessage ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 dark:text-red-400"
            >
              {errorMessage}
            </motion.p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {isLoading ? 'Сохранение…' : 'Сохранить и войти'}
          </button>
        </form>
      </Card>
    )
  }

  if (loginSubView === 'forgot') {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-neutral-200/80 bg-white/60 px-4 py-3 dark:border-neutral-700/80 dark:bg-neutral-900/40">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Восстановление пароля
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Отправим ссылку на email, указанный при регистрации.
          </p>
        </div>

        <form
          onSubmit={event => void handleForgotSubmit(event)}
          className="space-y-4 p-4"
        >
          <div>
            <label
              htmlFor="kirakira-forgot-email"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="kirakira-forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-neutral-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {errorMessage ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 dark:text-red-400"
            >
              {errorMessage}
            </motion.p>
          ) : null}

          {infoMessage ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-emerald-700 dark:text-emerald-300"
            >
              {infoMessage}
            </motion.p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {isLoading ? 'Отправка…' : 'Отправить ссылку'}
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginSubView('normal')
              setErrorMessage(null)
              setInfoMessage(null)
            }}
            className="w-full text-sm text-neutral-500 underline dark:text-neutral-400"
          >
            Назад ко входу
          </button>
        </form>
      </Card>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-neutral-200/80 bg-white/60 px-4 py-3 dark:border-neutral-700/80 dark:bg-neutral-900/40">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Вход по почте
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Пароль сохраняется — повторно открывать почту при каждом входе не
          нужно.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="flex gap-2 rounded-xl bg-neutral-100/90 p-1 dark:bg-neutral-800/90">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setErrorMessage(null)
              setInfoMessage(null)
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              mode === 'login'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Вход
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setErrorMessage(null)
              setInfoMessage(null)
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              mode === 'register'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Регистрация
          </button>
        </div>

        <div>
          <label
            htmlFor="kirakira-email"
            className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              id="kirakira-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-neutral-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="kirakira-password"
            className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >
            Пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              id="kirakira-password"
              type="password"
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-neutral-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setLoginSubView('forgot')
                setErrorMessage(null)
                setInfoMessage(null)
              }}
              className="mt-2 text-xs text-emerald-700 underline dark:text-emerald-300"
            >
              Забыли пароль?
            </button>
          ) : null}
        </div>

        {errorMessage ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errorMessage}
          </motion.p>
        ) : null}

        {infoMessage ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-emerald-700 dark:text-emerald-300"
          >
            {infoMessage}
          </motion.p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
        >
          {isLoading ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>
    </Card>
  )
}

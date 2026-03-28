import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { useUserClientStore } from '@/hooks/index.v2'
import { syncUserFromSupabase } from '@/api'
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

export function EmailPasswordAuth({
  onSuccess,
  onError,
}: EmailPasswordAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

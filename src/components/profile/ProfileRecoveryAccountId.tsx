import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface ProfileRecoveryAccountIdProps {
  readonly telegramId: number
  readonly username: string
}

/**
 * ID аккаунта в БД приложения — для восстановления прогресса на почту, если нет @username.
 */
export function ProfileRecoveryAccountId({
  telegramId,
  username,
}: ProfileRecoveryAccountIdProps) {
  const t = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = String(telegramId)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [telegramId])

  if (!Number.isFinite(telegramId) || telegramId <= 0) {
    return null
  }

  const hasUsername = Boolean(username?.trim())

  return (
    <motion.div
      className="glass-card rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/25"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
        {t.profile.recoveryAccountTitle}
      </p>
      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
        {hasUsername
          ? t.profile.recoveryAccountWithUsername
          : t.profile.recoveryAccountNoUsername}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t.profile.recoveryTelegramId}
        </span>
        <code className="rounded-lg bg-white/90 px-2 py-1 font-mono text-sm text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100">
          {telegramId}
        </code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-emerald-800 transition hover:bg-white dark:border-emerald-700 dark:bg-neutral-800 dark:text-emerald-200 dark:hover:bg-neutral-700"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t.profile.recoveryCopied}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {t.profile.recoveryCopyId}
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { TelegramAuth } from '@/components/auth'

interface AuthPageProps {
  onSuccess?: (() => void) | undefined
  onError?: ((error: string) => void) | undefined
}

export function AuthPage({ onSuccess, onError }: AuthPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <TelegramAuth onSuccess={onSuccess} onError={onError} />
        </motion.div>
      </div>
    </div>
  )
}

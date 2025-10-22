#!/usr/bin/env node

/**
 * Генератор секретного ключа для Telegram бота
 * Используется для аутентификации запросов от бота к API
 */

import crypto from 'crypto'

function generateBotSecret() {
  // Генерируем случайный 32-байтный ключ в hex формате
  const secret = crypto.randomBytes(32).toString('hex')

  console.log('🔑 Сгенерированный секретный ключ для Telegram бота:')
  console.log('')
  console.log(secret)
  console.log('')
  console.log('📋 Инструкции по настройке:')
  console.log('1. Скопируйте ключ выше')
  console.log('2. Добавьте переменную окружения TELEGRAM_BOT_SECRET в Vercel')
  console.log('3. Перезапустите деплой')
  console.log('')
  console.log('⚠️  ВАЖНО: Этот ключ должен быть одинаковым в боте и API!')

  return secret
}

// Запускаем генерацию
generateBotSecret()

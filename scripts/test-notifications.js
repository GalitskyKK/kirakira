#!/usr/bin/env node

/**
 * 🧪 ТЕСТИРОВАНИЕ СИСТЕМЫ УВЕДОМЛЕНИЙ
 *
 * Скрипт для тестирования всех компонентов системы уведомлений
 */

import fetch from 'node-fetch'

const API_BASE = process.env.VITE_APP_URL || 'http://localhost:3000'

async function testNotificationSystem() {
  console.log('🧪 Тестирование системы уведомлений KiraKira...\n')

  const results = {
    apiStatus: false,
    smartNotifications: false,
    webhookStatus: false,
    errors: [],
  }

  // 1. Проверяем статус основного API уведомлений
  try {
    console.log('📊 Проверяем статус API уведомлений...')
    const response = await fetch(`${API_BASE}/api/notifications`)
    const data = await response.json()

    if (response.ok && data.status) {
      console.log('✅ API уведомлений работает')
      console.log(`   Статус: ${data.status}`)
      console.log(`   Бот настроен: ${data.botConfigured}`)
      console.log(`   Время МСК: ${data.moscowTime}`)
      results.apiStatus = true
    } else {
      throw new Error(`API вернул ошибку: ${response.status}`)
    }
  } catch (error) {
    console.log('❌ API уведомлений недоступен:', error.message)
    results.errors.push(`API status: ${error.message}`)
  }

  console.log('')

  // 2. Проверяем умные уведомления (объединенный endpoint)
  try {
    console.log('🧠 Проверяем умные уведомления...')
    const response = await fetch(`${API_BASE}/api/notifications?type=smart`)
    const data = await response.json()

    if (response.ok && data.status) {
      console.log('✅ Умные уведомления работают')
      console.log(`   Статус: ${data.status}`)
      results.smartNotifications = true
    } else {
      throw new Error(`Smart API вернул ошибку: ${response.status}`)
    }
  } catch (error) {
    console.log('❌ Умные уведомления недоступны:', error.message)
    results.errors.push(`Smart notifications: ${error.message}`)
  }

  console.log('')

  // 3. Проверяем Telegram webhook
  try {
    console.log('🤖 Проверяем Telegram webhook...')
    const response = await fetch(`${API_BASE}/api/telegram`)
    const data = await response.json()

    if (response.ok && data.status) {
      console.log('✅ Telegram webhook работает')
      console.log(`   Статус: ${data.status}`)
      console.log(`   Бот настроен: ${data.botConfigured}`)
      results.webhookStatus = true
    } else {
      throw new Error(`Webhook вернул ошибку: ${response.status}`)
    }
  } catch (error) {
    console.log('❌ Telegram webhook недоступен:', error.message)
    results.errors.push(`Webhook: ${error.message}`)
  }

  console.log('')

  // 4. Тестируем отправку уведомлений (только если все API работают)
  if (results.apiStatus) {
    try {
      console.log('📤 Тестируем отправку уведомлений...')
      const response = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        console.log('✅ Тест отправки завершен')
        console.log(
          `   Обработано пользователей: ${data.results?.processed || 0}`
        )
        console.log(
          `   Ежедневных напоминаний: ${data.results?.dailyReminders || 0}`
        )
        console.log(
          `   Уведомлений о стриках: ${data.results?.streakLost || 0}`
        )
        console.log(`   О неактивности: ${data.results?.inactivity || 0}`)
        console.log(`   Мотивационных: ${data.results?.weeklyMotivation || 0}`)
        console.log(`   Ошибок: ${data.results?.errors || 0}`)
      } else {
        throw new Error(`Отправка не удалась: ${response.status}`)
      }
    } catch (error) {
      console.log('❌ Ошибка при тестовой отправке:', error.message)
      results.errors.push(`Send test: ${error.message}`)
    }
  } else {
    console.log('⏭️ Пропускаем тест отправки - API недоступен')
  }

  console.log('')

  // Итоговый отчет
  console.log('📋 ИТОГОВЫЙ ОТЧЕТ:')
  console.log(`API уведомлений: ${results.apiStatus ? '✅' : '❌'}`)
  console.log(`Умные уведомления: ${results.smartNotifications ? '✅' : '❌'}`)
  console.log(`Telegram webhook: ${results.webhookStatus ? '✅' : '❌'}`)

  if (results.errors.length > 0) {
    console.log('\n❌ Ошибки:')
    results.errors.forEach(error => console.log(`   • ${error}`))
  }

  const allWorking =
    results.apiStatus && results.smartNotifications && results.webhookStatus
  console.log(
    `\n🎯 Общий статус: ${allWorking ? '✅ ВСЕ РАБОТАЕТ' : '⚠️ ЕСТЬ ПРОБЛЕМЫ'}`
  )

  if (allWorking) {
    console.log('\n🎉 Система уведомлений готова к работе!')
    console.log('\nСледующие шаги:')
    console.log(
      '1. Примените миграцию БД: docs/database/add_notification_settings_column.sql'
    )
    console.log('2. Деплойте в Vercel: `vercel --prod`')
    console.log('3. Настройте переменные окружения в Vercel Dashboard')
    console.log('4. Cron job активируется автоматически')
  } else {
    console.log('\n🔧 Требуется настройка:')
    console.log('1. Проверьте переменные окружения')
    console.log('2. Запустите локальный сервер: `npm run dev`')
    console.log('3. Настройте Telegram бот токен')
  }

  return allWorking
}

// Запускаем тест
testNotificationSystem()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Критическая ошибка теста:', error)
    process.exit(1)
  })

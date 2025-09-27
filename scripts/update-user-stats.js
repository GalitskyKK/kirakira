#!/usr/bin/env node

/**
 * Скрипт для обновления статистики пользователей
 * Использование:
 *   node scripts/update-user-stats.js [telegram_id]
 *   node scripts/update-user-stats.js --all
 */

const API_BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

async function updateUserStats(telegramId) {
  try {
    console.log(`🔄 Обновляем статистику для пользователя ${telegramId}...`)

    const response = await fetch(
      `${API_BASE_URL}/api/profile?action=update_user_stats`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: telegramId,
        }),
      }
    )

    const result = await response.json()

    if (result.success) {
      console.log('✅ Статистика обновлена:')
      console.log(JSON.stringify(result.data.stats, null, 2))
    } else {
      console.error('❌ Ошибка:', result.error)
      if (result.details) {
        console.error('Детали:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ Ошибка запроса:', error.message)
  }
}

async function updateAllUserStats() {
  try {
    console.log('🔄 Обновляем статистику для всех пользователей...')

    const response = await fetch(
      `${API_BASE_URL}/api/profile?action=update_all_user_stats`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const result = await response.json()

    if (result.success) {
      console.log('✅ Статистика обновлена для всех пользователей:')
      console.log(
        `Обновлено пользователей: ${result.data.results.updated_users}`
      )

      if (result.data.results.results) {
        result.data.results.results.forEach((userStats, index) => {
          console.log(`\n👤 Пользователь #${index + 1}:`)
          console.log(JSON.stringify(userStats, null, 2))
        })
      }
    } else {
      console.error('❌ Ошибка:', result.error)
      if (result.details) {
        console.error('Детали:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ Ошибка запроса:', error.message)
  }
}

// Основная логика
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('📖 Использование:')
    console.log(
      '  node scripts/update-user-stats.js [telegram_id] - обновить конкретного пользователя'
    )
    console.log(
      '  node scripts/update-user-stats.js --all        - обновить всех пользователей'
    )
    console.log('')
    console.log('Примеры:')
    console.log('  node scripts/update-user-stats.js 778658013')
    console.log('  node scripts/update-user-stats.js --all')
    return
  }

  if (args[0] === '--all') {
    await updateAllUserStats()
  } else {
    const telegramId = parseInt(args[0])
    if (isNaN(telegramId)) {
      console.error('❌ Неверный telegram_id. Должно быть число.')
      return
    }
    await updateUserStats(telegramId)
  }
}

main().catch(console.error)

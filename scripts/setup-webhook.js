/**
 * 🔧 Скрипт для настройки вебхука Telegram с секретным токеном
 * ⚠️ ВАЖНО: Все секреты берутся из переменных окружения
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL =
  process.env.WEBHOOK_URL || 'https://kirakira-theta.vercel.app/api/telegram'
const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не установлен')
  console.log(
    'Используйте: TELEGRAM_BOT_TOKEN=your_token node scripts/setup-webhook.js'
  )
  process.exit(1)
}

if (!SECRET_TOKEN) {
  console.error('❌ TELEGRAM_WEBHOOK_SECRET не установлен')
  console.log(
    'Используйте: TELEGRAM_WEBHOOK_SECRET=your_secret node scripts/setup-webhook.js'
  )
  process.exit(1)
}

async function setupWebhook() {
  try {
    console.log('🔧 Настройка вебхука Telegram...')
    console.log(`📍 URL: ${WEBHOOK_URL}`)
    console.log(`🔐 Секретный токен: ${SECRET_TOKEN.substring(0, 10)}...`)

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          secret_token: SECRET_TOKEN,
        }),
      }
    )

    const result = await response.json()

    if (result.ok) {
      console.log('✅ Вебхук успешно настроен!')
      console.log('📦 Ответ:', result)
    } else {
      console.error('❌ Ошибка настройки вебхука:', result)
      process.exit(1)
    }

    // Проверяем настройки вебхука
    console.log('\n🔍 Проверка настроек вебхука...')
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    )
    const info = await infoResponse.json()

    if (info.ok) {
      console.log('✅ Информация о вебхуке:')
      console.log('   URL:', info.result.url)
      console.log('   Имеет секретный токен:', !!info.result.secret_token)
      console.log('   Ожидающих обновлений:', info.result.pending_update_count)
      console.log(
        '   Последняя ошибка:',
        info.result.last_error_message || 'Нет'
      )
      console.log(
        '   Последняя попытка:',
        info.result.last_error_date
          ? new Date(info.result.last_error_date * 1000).toLocaleString()
          : 'Нет'
      )
    } else {
      console.error('❌ Не удалось получить информацию о вебхуке:', info)
    }
  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  }
}

setupWebhook()

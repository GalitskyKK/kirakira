#!/usr/bin/env node

/**
 * Автоматизированная настройка Telegram бота KiraKiraGardenBot
 * Устанавливает команды, описание и webhook
 */

import https from 'https'
import { fileURLToPath } from 'url'

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('❌ Telegram bot token is required!')
  console.error(
    'Set TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_BOT_TOKEN environment variable'
  )
  process.exit(1)
}
const BOT_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

// Команды бота
const COMMANDS = [
  { command: 'start', description: '🌸 Начать путешествие с KiraKira' },
  { command: 'garden', description: '🌱 Открыть мой сад' },
  { command: 'mood', description: '😊 Отметить настроение' },
  { command: 'stats', description: '📊 Посмотреть статистику' },
  { command: 'premium', description: '⭐ Премиум функции' },
  { command: 'share', description: '🔗 Поделиться садом' },
  { command: 'help', description: '❓ Справка' },
]

// Описание бота
const DESCRIPTION = `🌸 KiraKira - твой персональный эмоциональный сад

Отмечай свои настроения каждый день и наблюдай, как они превращаются в прекрасный цифровой сад. Каждая эмоция становится уникальным растением, кристаллом или камнем.

✨ Особенности:
• Ежедневный трекинг настроений
• Красивые анимированные элементы сада
• Синхронизация между устройствами
• Поделиться садом с друзьями
• Премиум элементы за Telegram Stars

Начни свое путешествие осознанности прямо сейчас! 🌱`

// Короткое описание
const SHORT_DESCRIPTION = `🌸 Превращай свои эмоции в прекрасный цифровой сад. Ежедневный трекинг настроений с красивой визуализацией.`

/**
 * Выполняет HTTP запрос к Telegram Bot API
 */
function makeRequest(method, data = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }

    const req = https.request(options, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.ok) {
            resolve(result.result)
          } else {
            reject(new Error(result.description || 'API Error'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', error => {
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

/**
 * Устанавливает команды бота
 */
async function setCommands() {
  console.log('📋 Устанавливаем команды бота...')

  try {
    await makeRequest('setMyCommands', { commands: COMMANDS })
    console.log('✅ Команды успешно установлены')

    // Выводим список команд
    console.log('\n📝 Установленные команды:')
    COMMANDS.forEach(cmd => {
      console.log(`  /${cmd.command} - ${cmd.description}`)
    })
  } catch (error) {
    console.error('❌ Ошибка установки команд:', error.message)
  }
}

/**
 * Устанавливает описание бота
 */
async function setDescription() {
  console.log('\n📝 Устанавливаем описание бота...')

  try {
    await makeRequest('setMyDescription', { description: DESCRIPTION })
    console.log('✅ Описание успешно установлено')
  } catch (error) {
    console.error('❌ Ошибка установки описания:', error.message)
  }
}

/**
 * Устанавливает короткое описание бота
 */
async function setShortDescription() {
  console.log('\n📄 Устанавливаем короткое описание...')

  try {
    await makeRequest('setMyShortDescription', {
      short_description: SHORT_DESCRIPTION,
    })
    console.log('✅ Короткое описание успешно установлено')
  } catch (error) {
    console.error('❌ Ошибка установки короткого описания:', error.message)
  }
}

/**
 * Получает информацию о боте
 */
async function getBotInfo() {
  console.log('\n🤖 Получаем информацию о боте...')

  try {
    const info = await makeRequest('getMe')
    console.log('✅ Информация о боте:')
    console.log(`  ID: ${info.id}`)
    console.log(`  Имя: ${info.first_name}`)
    console.log(`  Username: @${info.username}`)
    console.log(`  Ссылка: https://t.me/${info.username}`)
    console.log(
      `  Поддержка Mini Apps: ${info.supports_inline_queries ? '✅' : '❌'}`
    )
  } catch (error) {
    console.error('❌ Ошибка получения информации:', error.message)
  }
}

/**
 * Устанавливает webhook (если указан URL)
 */
async function setWebhook(url) {
  if (!url) {
    console.log('\n🔗 Webhook URL не указан, пропускаем...')
    return
  }

  console.log(`\n🔗 Устанавливаем webhook: ${url}`)

  try {
    await makeRequest('setWebhook', {
      url: `${url}/api/telegram/webhook`,
      allowed_updates: [
        'message',
        'callback_query',
        'inline_query',
        'pre_checkout_query',
        'successful_payment',
      ],
    })
    console.log('✅ Webhook успешно установлен')
  } catch (error) {
    console.error('❌ Ошибка установки webhook:', error.message)
  }
}

/**
 * Основная функция
 */
async function main() {
  console.log('🚀 Настройка бота KiraKiraGardenBot\n')

  // Получаем URL из аргументов командной строки
  const webhookUrl = process.argv[2]

  try {
    await getBotInfo()
    await setCommands()
    await setDescription()
    await setShortDescription()
    await setWebhook(webhookUrl)

    console.log('\n🎉 Настройка бота завершена!')
    console.log('\n📋 Следующие шаги:')
    console.log('1. Добавьте аватар боту через @BotFather (/setuserpic)')
    console.log('2. Настройте Mini App URL в @BotFather')
    console.log('3. Протестируйте бота: https://t.me/KiraKiraGardenBot')

    if (webhookUrl) {
      console.log(`4. Проверьте webhook: ${webhookUrl}/api/telegram/webhook`)
    }
  } catch (error) {
    console.error('\n💥 Критическая ошибка:', error.message)
    process.exit(1)
  }
}

// Запускаем скрипт
const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main().catch(console.error)
}

export { setCommands, setDescription, setWebhook, getBotInfo }

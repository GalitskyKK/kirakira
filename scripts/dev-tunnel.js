#!/usr/bin/env node

/**
 * Локальный туннель для разработки Telegram Mini App
 * Использует ngrok для создания публичного URL к локальному серверу
 */

import { spawn } from 'child_process'
import https from 'https'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'

// Загружаем .env файл вручную (Node.js не загружает .env автоматически)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Загружаем .env и .env.local
const envFiles = [join(projectRoot, '.env'), join(projectRoot, '.env.local')]

envFiles.forEach(envPath => {
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8')
      envFile.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^['"]|['"]$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
      console.log(`✅ Загружен: ${envPath}`)
    } catch (error) {
      // Игнорируем ошибки чтения
    }
  }
})

const PORT = process.env.PORT || 3000
const BOT_TOKEN =
  process.env.TELEGRAM_DEV_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Проверяет наличие ngrok
 */
async function checkNgrok() {
  return new Promise(resolve => {
    const check = spawn('ngrok', ['version'], { shell: true })
    check.on('close', code => {
      resolve(code === 0)
    })
    check.on('error', () => resolve(false))
  })
}

/**
 * Устанавливает webhook для бота
 */
async function setWebhook(url) {
  if (!BOT_TOKEN) {
    log('⚠️  Токен бота не найден, webhook не будет установлен', 'yellow')
    return
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      url: `${url}/api/telegram/webhook`,
      allowed_updates: ['message', 'callback_query', 'inline_query'],
    })

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/setWebhook`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }

    const req = https.request(options, res => {
      let responseData = ''
      res.on('data', chunk => (responseData += chunk))
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData)
          if (result.ok) {
            resolve(result)
          } else {
            reject(new Error(result.description || 'API Error'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

/**
 * Удаляет webhook
 */
async function deleteWebhook() {
  if (!BOT_TOKEN) return

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/deleteWebhook`,
      method: 'POST',
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

/**
 * Запускает ngrok туннель
 */
async function startNgrok() {
  log('\n🚀 Запускаем ngrok туннель...', 'blue')

  const ngrok = spawn('ngrok', ['http', PORT, '--log=stdout'], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let tunnelUrl = null

  // Парсим вывод ngrok для получения публичного URL
  ngrok.stdout.on('data', data => {
    const output = data.toString()

    // Ищем URL в выводе
    const urlMatch = output.match(/url=(https:\/\/[^\s]+)/i)
    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[1]

      log('\n' + '='.repeat(60), 'cyan')
      log('✅ Туннель создан!', 'green')
      log('='.repeat(60), 'cyan')
      log(`\n📱 Публичный URL: ${tunnelUrl}`, 'bright')
      log(`🖥️  Локальный сервер: http://localhost:${PORT}`, 'blue')

      if (BOT_TOKEN) {
        log('\n🔧 Настраиваем webhook...', 'yellow')
        setWebhook(tunnelUrl)
          .then(() => {
            log('✅ Webhook установлен!', 'green')
            log(`\n📋 Webhook URL: ${tunnelUrl}/api/telegram/webhook`, 'cyan')
            printInstructions(tunnelUrl)
          })
          .catch(err => {
            log(`❌ Ошибка установки webhook: ${err.message}`, 'red')
            log(
              '\n💡 Вы можете установить его вручную через @BotFather',
              'yellow'
            )
            printInstructions(tunnelUrl)
          })
      } else {
        printInstructions(tunnelUrl)
      }
    }
  })

  ngrok.stderr.on('data', data => {
    const error = data.toString()
    if (error.includes('ERROR') || error.includes('error')) {
      log(`❌ Ошибка ngrok: ${error}`, 'red')
    }
  })

  ngrok.on('close', code => {
    log(`\n🛑 ngrok завершен с кодом ${code}`, 'yellow')
    if (BOT_TOKEN) {
      log('🧹 Удаляем webhook...', 'yellow')
      deleteWebhook()
        .then(() => log('✅ Webhook удален', 'green'))
        .catch(() => log('⚠️  Не удалось удалить webhook', 'yellow'))
    }
  })

  // Обработка завершения процесса
  process.on('SIGINT', () => {
    log('\n\n🛑 Завершение работы...', 'yellow')
    ngrok.kill()
    process.exit(0)
  })

  return ngrok
}

/**
 * Выводит инструкции по использованию
 */
function printInstructions(url) {
  log('\n' + '='.repeat(60), 'cyan')
  log('📋 КАК ИСПОЛЬЗОВАТЬ', 'bright')
  log('='.repeat(60), 'cyan')

  log('\n1️⃣  Настройте Mini App URL в @BotFather:', 'yellow')
  log('   /newapp или /editapp', 'blue')
  log(`   Используйте URL: ${url}`, 'bright')

  log('\n2️⃣  Запустите ваш локальный сервер:', 'yellow')
  log('   npm run dev', 'blue')

  log('\n3️⃣  Откройте бота в Telegram и тестируйте!', 'yellow')

  log('\n💡 СОВЕТЫ:', 'green')
  log('   • Держите этот терминал открытым', 'blue')
  log('   • ngrok туннель активен пока работает скрипт', 'blue')
  log('   • URL будет меняться при каждом перезапуске', 'blue')
  log('   • Для постоянного URL используйте ngrok authtoken', 'blue')

  log('\n⚠️  ВНИМАНИЕ:', 'red')
  log('   • Не используйте этот URL в продакшене!', 'yellow')
  log('   • Туннель может быть нестабильным', 'yellow')

  log('\n' + '='.repeat(60), 'cyan')
  log('\n✨ Туннель работает... Нажмите Ctrl+C для остановки\n', 'green')
}

/**
 * Основная функция
 */
async function main() {
  log('\n🌸 KiraKira Development Tunnel', 'bright')
  log('='.repeat(60) + '\n', 'cyan')

  // Проверяем наличие ngrok
  log('🔍 Проверяем наличие ngrok...', 'blue')
  const hasNgrok = await checkNgrok()

  if (!hasNgrok) {
    log('\n❌ ngrok не установлен!', 'red')
    log('\n📥 Установите ngrok:', 'yellow')
    log('   1. Скачайте с https://ngrok.com/download', 'blue')
    log('   2. Распакуйте и добавьте в PATH', 'blue')
    log('   3. (Опционально) Зарегистрируйтесь для постоянного URL', 'blue')
    log('   4. Запустите: ngrok authtoken YOUR_TOKEN', 'blue')
    log('\n💡 Альтернатива: npm install -g ngrok\n', 'cyan')
    process.exit(1)
  }

  log('✅ ngrok найден!', 'green')

  if (!BOT_TOKEN) {
    log('\n⚠️  TELEGRAM_DEV_BOT_TOKEN не найден', 'yellow')
    log('💡 Создайте .env файл с токеном вашего тестового бота', 'cyan')
    log('   TELEGRAM_DEV_BOT_TOKEN=your_bot_token_here\n', 'blue')
  }

  // Запускаем туннель
  await startNgrok()
}

// Запуск
main().catch(error => {
  log(`\n💥 Критическая ошибка: ${error.message}`, 'red')
  process.exit(1)
})

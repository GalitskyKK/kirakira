#!/usr/bin/env node

/**
 * 🛠️ НАСТРОЙКА СИСТЕМЫ УВЕДОМЛЕНИЙ KIRAKIRA
 *
 * Настраивает cron job в Vercel для автоматической отправки уведомлений
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

console.log('🔧 Setting up KiraKira notification system...')

// Создаем конфигурацию для Vercel cron job
const vercelConfig = {
  crons: [
    {
      path: '/api/notifications',
      schedule: '0 7-12 * * *', // Каждый час с 7:00 до 12:00 UTC (10:00-15:00 MSK)
    },
  ],
}

// Путь к файлу конфигурации
const vercelJsonPath = path.join(projectRoot, 'vercel.json')
let existingConfig = {}

// Читаем существующую конфигурацию если есть
if (fs.existsSync(vercelJsonPath)) {
  try {
    const content = fs.readFileSync(vercelJsonPath, 'utf8')
    existingConfig = JSON.parse(content)
  } catch (error) {
    console.warn('⚠️ Failed to read existing vercel.json:', error.message)
  }
}

// Объединяем конфигурации
const finalConfig = {
  ...existingConfig,
  crons: vercelConfig.crons,
}

try {
  // Записываем обновленную конфигурацию
  fs.writeFileSync(vercelJsonPath, JSON.stringify(finalConfig, null, 2) + '\n')

  console.log('✅ vercel.json updated with cron configuration')
  console.log(`📅 Notifications will run every hour from 10:00-15:00 MSK`)
} catch (error) {
  console.error('❌ Failed to write vercel.json:', error.message)
  process.exit(1)
}

// Создаем документацию по уведомлениям
const docsContent = `# 📢 Система уведомлений KiraKira

## Типы уведомлений

### 1. Ежедневные напоминания (10:00-12:00 МСК)
- Напоминание об отметке настроения если еще не отмечено сегодня
- Мотивационные сообщения с учетом текущего стрика
- Персонализированные для каждого пользователя

### 2. Уведомления о потере стрика (11:00 МСК)  
- Отправляются если стрик был прерван
- Только для пользователей с предыдущим стриком 2+ дня
- Мотивируют начать новую серию

### 3. Возвращение после неактивности (10:30 МСК)
- Через 3 дня неактивности - мягкое напоминание
- Через 7 дней неактивности - более настойчивое
- Персонализированы с учетом статистики пользователя

### 4. Еженедельная мотивация (Понедельник, 09:00 МСК)
- Для пользователей со стриком 7+ дней
- Поздравления с достижениями
- Дополнительная мотивация для продолжения

## Настройки пользователя

Пользователи могут управлять уведомлениями через:
- \`notification_settings.enabled\` - включить/выключить все уведомления
- \`notification_settings.dailyReminder\` - ежедневные напоминания
- \`notification_settings.milestones\` - уведомления о достижениях

## Техническая реализация

- **Планировщик:** Vercel Cron Jobs (каждый час 10:00-15:00 МСК)
- **Анти-спам:** Максимум одно уведомление в день на пользователя
- **Персонализация:** Используется имя пользователя и статистика
- **Временная зона:** Europe/Moscow (МСК)

## Мониторинг

Проверить статус системы: \`GET /api/notifications\`
Запустить вручную: \`POST /api/notifications\`

## Настройка

1. Установите переменные окружения:
   - \`TELEGRAM_BOT_TOKEN\` - токен Telegram бота
   - \`SUPABASE_URL\` - URL базы данных
   - \`SUPABASE_SERVICE_ROLE_KEY\` - ключ для доступа к БД

2. Деплой в Vercel автоматически настроит cron job

3. Проверьте работу: \`curl -X POST https://your-domain.vercel.app/api/notifications\`
`

const docsPath = path.join(projectRoot, 'docs', 'NOTIFICATIONS_SYSTEM.md')
const docsDir = path.dirname(docsPath)

// Создаем папку docs если не существует
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
}

try {
  fs.writeFileSync(docsPath, docsContent)
  console.log('📝 Documentation created at docs/NOTIFICATIONS_SYSTEM.md')
} catch (error) {
  console.warn('⚠️ Failed to create documentation:', error.message)
}

// Обновляем package.json со скриптом для тестирования
const packageJsonPath = path.join(projectRoot, 'package.json')

try {
  const packageContent = fs.readFileSync(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageContent)

  packageJson.scripts = packageJson.scripts || {}
  packageJson.scripts['test-notifications'] =
    'curl -X POST http://localhost:3000/api/notifications'
  packageJson.scripts['check-notifications'] =
    'curl http://localhost:3000/api/notifications'

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
  console.log('📦 Added notification testing scripts to package.json')
} catch (error) {
  console.warn('⚠️ Failed to update package.json:', error.message)
}

console.log('\n🎉 Notification system setup completed!')
console.log('\nNext steps:')
console.log('1. Deploy to Vercel: `vercel --prod`')
console.log('2. Check system status: `npm run check-notifications`')
console.log('3. Test manually: `npm run test-notifications`')
console.log('4. Monitor logs in Vercel dashboard')
console.log('\n📖 Read full documentation in docs/NOTIFICATIONS_SYSTEM.md')

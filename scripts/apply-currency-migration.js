/**
 * 💰 СКРИПТ ПРИМЕНЕНИЯ МИГРАЦИИ ВАЛЮТНОЙ СИСТЕМЫ
 * Применяет SQL миграцию к базе данных Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Ошибка: Переменные окружения не найдены!')
  console.error('Убедитесь что в .env файле указаны:')
  console.error('  - VITE_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Создаем клиент с правами service_role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function applyMigration() {
  console.log('🚀 Начинаем применение миграции валютной системы...\n')

  try {
    // Читаем SQL файл миграции
    const migrationPath = join(
      __dirname,
      '..',
      'docs',
      'database',
      'migrations',
      '001_currency_system.sql'
    )
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Миграция загружена из:', migrationPath)
    console.log(`📊 Размер миграции: ${migrationSQL.length} символов\n`)

    // Разбиваем SQL на отдельные команды
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Найдено ${commands.length} SQL команд для выполнения\n`)

    let successCount = 0
    let errorCount = 0

    // Выполняем каждую команду отдельно
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]

      // Пропускаем комментарии
      if (
        command.startsWith('--') ||
        command.startsWith('/*') ||
        command.startsWith('COMMENT')
      ) {
        continue
      }

      console.log(`⏳ [${i + 1}/${commands.length}] Выполняем команду...`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' })

        if (error) {
          // Некоторые ошибки можно игнорировать (например, "already exists")
          if (
            error.message.includes('already exists') ||
            error.message.includes('does not exist')
          ) {
            console.log(`   ⚠️  Предупреждение: ${error.message}`)
          } else {
            throw error
          }
        }

        successCount++
        console.log(`   ✅ Успешно\n`)
      } catch (err) {
        errorCount++
        console.error(`   ❌ Ошибка: ${err.message}`)
        console.error(`   Команда: ${command.substring(0, 100)}...\n`)

        // Не прерываем выполнение, продолжаем дальше
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 РЕЗУЛЬТАТЫ МИГРАЦИИ:')
    console.log('='.repeat(60))
    console.log(`✅ Успешно выполнено: ${successCount} команд`)
    console.log(`❌ Ошибок: ${errorCount}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n🎉 Миграция успешно применена!')
      console.log('\n📋 Следующие шаги:')
      console.log(
        '   1. Проверьте таблицы user_currency и currency_transactions'
      )
      console.log('   2. Протестируйте начисление валюты')
      console.log('   3. Добавьте CurrencyDisplay в хедер приложения')
      console.log('   4. См. документацию: docs/CURRENCY_SYSTEM_SETUP.md\n')
    } else {
      console.log('\n⚠️  Миграция выполнена с ошибками. Проверьте логи выше.')
      console.log(
        '   Некоторые команды могли не выполниться. Проверьте базу данных.\n'
      )
    }
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
    console.error('Стек:', error.stack)
    process.exit(1)
  }
}

// Альтернативный метод: прямое выполнение через Supabase SQL Editor
function showManualInstructions() {
  console.log('\n' + '='.repeat(60))
  console.log('📝 РУЧНОЕ ПРИМЕНЕНИЕ МИГРАЦИИ')
  console.log('='.repeat(60))
  console.log('\nЕсли автоматический скрипт не работает:')
  console.log('\n1. Откройте Supabase Dashboard → SQL Editor')
  console.log('2. Создайте новый запрос')
  console.log(
    '3. Скопируйте содержимое файла docs/database/migrations/001_currency_system.sql'
  )
  console.log('4. Вставьте и выполните (Run)')
  console.log('\n' + '='.repeat(60) + '\n')
}

// Проверка подключения
async function checkConnection() {
  console.log('🔍 Проверка подключения к Supabase...')

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      throw error
    }

    console.log('✅ Подключение установлено\n')
    return true
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message)
    console.error('\nПроверьте:')
    console.error('  - Правильность VITE_SUPABASE_URL')
    console.error('  - Правильность SUPABASE_SERVICE_ROLE_KEY')
    console.error('  - Доступность базы данных\n')
    return false
  }
}

// Главная функция
async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('💰 ПРИМЕНЕНИЕ МИГРАЦИИ ВАЛЮТНОЙ СИСТЕМЫ')
  console.log('='.repeat(60) + '\n')

  const isConnected = await checkConnection()

  if (!isConnected) {
    showManualInstructions()
    process.exit(1)
  }

  // Запрос подтверждения
  console.log(
    '⚠️  ВНИМАНИЕ: Эта миграция создаст новые таблицы и функции в БД.'
  )
  console.log('   Убедитесь что вы сделали backup базы данных!\n')

  await applyMigration()
}

main()

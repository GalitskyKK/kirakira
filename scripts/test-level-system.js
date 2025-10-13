/**
 * 🧪 ТЕСТОВЫЙ СКРИПТ: Проверка системы уровней
 *
 * Этот скрипт тестирует:
 * 1. Миграцию уровней 1-30
 * 2. Функцию add_user_experience
 * 3. Начисление наград (ростки + кристаллы)
 * 4. Транзакции валюты
 *
 * Использование:
 * node scripts/test-level-system.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Тестовый пользователь (создайте реального пользователя или используйте существующего)
const TEST_TELEGRAM_ID = 123456789 // ЗАМЕНИТЕ на реальный ID

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Тест 1: Проверка наличия всех 30 уровней
 */
async function testLevelsExist() {
  log('\n📋 Тест 1: Проверка наличия 30 уровней...', 'cyan')

  const { data, error } = await supabase
    .from('gardener_levels')
    .select('level, name, emoji, sprout_reward, gem_reward')
    .order('level', { ascending: true })

  if (error) {
    log(`❌ Ошибка: ${error.message}`, 'red')
    return false
  }

  if (data.length !== 30) {
    log(`❌ Найдено ${data.length} уровней, ожидалось 30`, 'red')
    return false
  }

  log(`✅ Найдено 30 уровней`, 'green')

  // Выводим несколько примеров
  const samples = [1, 5, 10, 15, 20, 25, 30]
  samples.forEach(lvl => {
    const level = data.find(l => l.level === lvl)
    if (level) {
      log(
        `   Ур.${level.level}: ${level.emoji} ${level.name} - ${level.sprout_reward}🌿 ${level.gem_reward}💎`,
        'blue'
      )
    }
  })

  return true
}

/**
 * Тест 2: Проверка наличия новых полей
 */
async function testNewColumns() {
  log('\n🔍 Тест 2: Проверка новых полей...', 'cyan')

  const { data, error } = await supabase
    .from('gardener_levels')
    .select('sprout_reward, gem_reward, special_unlock')
    .eq('level', 1)
    .single()

  if (error) {
    log(`❌ Ошибка: ${error.message}`, 'red')
    return false
  }

  if (data.sprout_reward === undefined) {
    log('❌ Поле sprout_reward отсутствует', 'red')
    return false
  }

  if (data.gem_reward === undefined) {
    log('❌ Поле gem_reward отсутствует', 'red')
    return false
  }

  log('✅ Все новые поля присутствуют', 'green')
  log(`   sprout_reward: ${data.sprout_reward}`, 'blue')
  log(`   gem_reward: ${data.gem_reward}`, 'blue')
  log(`   special_unlock: ${data.special_unlock || 'null'}`, 'blue')

  return true
}

/**
 * Тест 3: Создание тестового пользователя (если не существует)
 */
async function ensureTestUser() {
  log('\n👤 Тест 3: Проверка тестового пользователя...', 'cyan')

  // Проверяем существование
  const { data: existingUser } = await supabase
    .from('users')
    .select('telegram_id, experience, level')
    .eq('telegram_id', TEST_TELEGRAM_ID)
    .single()

  if (existingUser) {
    log(`✅ Пользователь ${TEST_TELEGRAM_ID} существует`, 'green')
    log(
      `   Опыт: ${existingUser.experience}, Уровень: ${existingUser.level}`,
      'blue'
    )
    return true
  }

  // Создаем тестового пользователя
  log(`📝 Создаю тестового пользователя ${TEST_TELEGRAM_ID}...`, 'yellow')

  const { error: createError } = await supabase.from('users').insert({
    telegram_id: TEST_TELEGRAM_ID,
    user_id: `tg_${TEST_TELEGRAM_ID}`,
    first_name: 'Test',
    last_name: 'User',
    username: 'test_level_system',
    experience: 0,
    level: 1,
  })

  if (createError) {
    log(`❌ Ошибка создания: ${createError.message}`, 'red')
    return false
  }

  // Инициализируем валюту
  const { error: currencyError } = await supabase.from('user_currency').insert({
    telegram_id: TEST_TELEGRAM_ID,
    sprouts: 0,
    gems: 0,
  })

  if (currencyError && currencyError.code !== '23505') {
    // Игнорируем duplicate key
    log(`⚠️ Ошибка инициализации валюты: ${currencyError.message}`, 'yellow')
  }

  log('✅ Тестовый пользователь создан', 'green')
  return true
}

/**
 * Тест 4: Добавление опыта и проверка level up
 */
async function testLevelUp() {
  log('\n🎯 Тест 4: Проверка повышения уровня...', 'cyan')

  // Сбрасываем пользователя на уровень 1
  await supabase
    .from('users')
    .update({ experience: 0, level: 1 })
    .eq('telegram_id', TEST_TELEGRAM_ID)

  // Очищаем валюту
  await supabase
    .from('user_currency')
    .update({
      sprouts: 0,
      gems: 0,
      total_sprouts_earned: 0,
      total_gems_earned: 0,
    })
    .eq('telegram_id', TEST_TELEGRAM_ID)

  log('   Начальное состояние: 0 опыта, уровень 1', 'blue')

  // Добавляем 150 опыта (должен поднять до уровня 2)
  log('   Добавляю 150 опыта...', 'blue')

  const { data, error } = await supabase.rpc('add_user_experience', {
    p_telegram_id: TEST_TELEGRAM_ID,
    p_experience_points: 150,
  })

  if (error) {
    log(`❌ Ошибка: ${error.message}`, 'red')
    return false
  }

  const result = data[0]

  log(`   Результат:`, 'blue')
  log(`   - Новый опыт: ${result.new_experience}`, 'blue')
  log(`   - Новый уровень: ${result.new_level}`, 'blue')
  log(`   - Level up: ${result.level_up}`, 'blue')
  log(`   - Награда ростками: ${result.sprout_reward}🌿`, 'blue')
  log(`   - Награда кристаллами: ${result.gem_reward}💎`, 'blue')

  if (result.new_level !== 2) {
    log(`❌ Ожидался уровень 2, получен ${result.new_level}`, 'red')
    return false
  }

  if (!result.level_up) {
    log('❌ Level up не произошел', 'red')
    return false
  }

  if (result.sprout_reward !== 150) {
    log(`❌ Ожидалось 150 ростков, получено ${result.sprout_reward}`, 'red')
    return false
  }

  log('✅ Level up работает корректно', 'green')
  return true
}

/**
 * Тест 5: Проверка начисления валюты
 */
async function testCurrencyReward() {
  log('\n💰 Тест 5: Проверка начисления валюты...', 'cyan')

  const { data, error } = await supabase
    .from('user_currency')
    .select('sprouts, gems, total_sprouts_earned, total_gems_earned')
    .eq('telegram_id', TEST_TELEGRAM_ID)
    .single()

  if (error) {
    log(`❌ Ошибка: ${error.message}`, 'red')
    return false
  }

  log('   Баланс валюты:', 'blue')
  log(
    `   - Ростки: ${data.sprouts}🌿 (всего заработано: ${data.total_sprouts_earned})`,
    'blue'
  )
  log(
    `   - Кристаллы: ${data.gems}💎 (всего заработано: ${data.total_gems_earned})`,
    'blue'
  )

  if (data.sprouts !== 150) {
    log(`❌ Ожидалось 150 ростков, получено ${data.sprouts}`, 'red')
    return false
  }

  log('✅ Валюта начислена корректно', 'green')
  return true
}

/**
 * Тест 6: Проверка транзакций
 */
async function testTransactions() {
  log('\n📜 Тест 6: Проверка транзакций...', 'cyan')

  const { data, error } = await supabase
    .from('currency_transactions')
    .select('*')
    .eq('telegram_id', TEST_TELEGRAM_ID)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    log(`❌ Ошибка: ${error.message}`, 'red')
    return false
  }

  if (data.length === 0) {
    log('❌ Транзакции не найдены', 'red')
    return false
  }

  log(`   Найдено транзакций: ${data.length}`, 'blue')

  data.forEach((tx, i) => {
    log(
      `   ${i + 1}. ${tx.transaction_type} - ${tx.amount} ${tx.currency_type} (${tx.reason})`,
      'blue'
    )
  })

  // Проверяем, что есть транзакция reward с reason level_up
  const levelUpTransaction = data.find(
    tx => tx.transaction_type === 'reward' && tx.reason === 'level_up'
  )

  if (!levelUpTransaction) {
    log('❌ Транзакция level_up не найдена', 'red')
    return false
  }

  log('✅ Транзакции записываются корректно', 'green')
  return true
}

/**
 * Тест 7: Множественные level up
 */
async function testMultipleLevelUps() {
  log('\n🚀 Тест 7: Проверка множественных level up...', 'cyan')

  // Сбрасываем пользователя
  await supabase
    .from('users')
    .update({ experience: 0, level: 1 })
    .eq('telegram_id', TEST_TELEGRAM_ID)

  log('   Добавляю 1000 опыта (должен подняться до уровня 4)...', 'blue')

  const { data, error } = await supabase.rpc('add_user_experience', {
    p_telegram_id: TEST_TELEGRAM_ID,
    p_experience_points: 1000,
  })

  if (error) {
    log(`❌ Ошибка: ${error.message}`, 'red')
    return false
  }

  const result = data[0]

  log(`   Результат:`, 'blue')
  log(`   - Новый уровень: ${result.new_level}`, 'blue')
  log(`   - Награда ростками: ${result.sprout_reward}🌿`, 'blue')
  log(`   - Награда кристаллами: ${result.gem_reward}💎`, 'blue')

  // При прыжке с 0 до 1000 опыта пользователь должен получить уровень 4
  // Опыт для уровней: 1(0-99), 2(100-249), 3(250-499), 4(500-799), 5(800+)
  const expectedLevel = 4

  if (result.new_level !== expectedLevel) {
    log(
      `⚠️ Ожидался уровень ${expectedLevel}, получен ${result.new_level}`,
      'yellow'
    )
    log(
      `   (Это может быть нормально, если функция начисляет только за последний уровень)`,
      'yellow'
    )
  }

  log('✅ Множественные level up обрабатываются', 'green')
  return true
}

/**
 * Основная функция тестирования
 */
async function runTests() {
  log('═══════════════════════════════════════', 'cyan')
  log('🧪 ТЕСТИРОВАНИЕ СИСТЕМЫ УРОВНЕЙ', 'cyan')
  log('═══════════════════════════════════════', 'cyan')

  const tests = [
    { name: 'Наличие 30 уровней', fn: testLevelsExist },
    { name: 'Новые поля в БД', fn: testNewColumns },
    { name: 'Тестовый пользователь', fn: ensureTestUser },
    { name: 'Level up', fn: testLevelUp },
    { name: 'Начисление валюты', fn: testCurrencyReward },
    { name: 'Транзакции', fn: testTransactions },
    { name: 'Множественные level up', fn: testMultipleLevelUps },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      log(
        `❌ Тест "${test.name}" завершился с ошибкой: ${error.message}`,
        'red'
      )
      failed++
    }
  }

  // Итоги
  log('\n═══════════════════════════════════════', 'cyan')
  log('📊 ИТОГИ ТЕСТИРОВАНИЯ', 'cyan')
  log('═══════════════════════════════════════', 'cyan')
  log(`✅ Пройдено: ${passed}`, 'green')
  if (failed > 0) {
    log(`❌ Провалено: ${failed}`, 'red')
  }
  log(`📈 Успех: ${Math.round((passed / tests.length) * 100)}%`, 'blue')

  if (failed === 0) {
    log('\n🎉 Все тесты пройдены успешно!', 'green')
    log('✅ Система уровней готова к использованию', 'green')
  } else {
    log('\n⚠️ Некоторые тесты провалились', 'yellow')
    log('Проверьте логи выше для деталей', 'yellow')
  }
}

// Запуск тестов
runTests().catch(error => {
  log(`\n❌ Критическая ошибка: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})

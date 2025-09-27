#!/usr/bin/env node

/**
 * Скрипт для проверки статистики всех пользователей
 * Сравнивает локальный расчет с данными в БД
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log(
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function calculateCorrectStats(telegramId) {
  // Получаем записи настроений
  const { data: moodEntries } = await supabase
    .from('mood_entries')
    .select('mood_date')
    .eq('telegram_id', telegramId)

  // Получаем элементы сада
  const { data: gardenElements } = await supabase
    .from('garden_elements')
    .select('unlock_date, rarity')
    .eq('telegram_id', telegramId)

  // Уникальные даты настроений
  const moodDates = moodEntries
    ? [...new Set(moodEntries.map(e => new Date(e.mood_date).toDateString()))]
    : []

  // Уникальные даты элементов сада
  const gardenDates = gardenElements
    ? [
        ...new Set(
          gardenElements.map(e => new Date(e.unlock_date).toDateString())
        ),
      ]
    : []

  // Всего дней активности
  const allDates = [...new Set([...moodDates, ...gardenDates])]
  const totalDays = allDates.length

  // Подсчет редких элементов
  const rareElements = gardenElements
    ? gardenElements.filter(e =>
        ['rare', 'epic', 'legendary'].includes(e.rarity)
      ).length
    : 0

  // Простой расчет стрика на основе настроений
  let currentStreak = 0
  let longestStreak = 0

  if (moodDates.length > 0) {
    const sortedDates = moodDates.map(d => new Date(d)).sort((a, b) => b - a)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Проверяем текущий стрик
    if (sortedDates[0] >= yesterday) {
      currentStreak = 1

      for (let i = 1; i < sortedDates.length; i++) {
        const current = new Date(sortedDates[i - 1])
        const prev = new Date(sortedDates[i])

        const diffDays = Math.floor((current - prev) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Находим самый длинный стрик
    let tempStreak = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i - 1])
      const prev = new Date(sortedDates[i])

      const diffDays = Math.floor((current - prev) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)
  }

  return {
    totalDays,
    currentStreak,
    longestStreak,
    totalElements: gardenElements ? gardenElements.length : 0,
    rareElements,
    moodEntries: moodEntries ? moodEntries.length : 0,
  }
}

async function verifyAllUsers() {
  console.log('🔍 Проверяем статистику всех пользователей...\n')

  // Получаем всех пользователей
  const { data: users, error } = await supabase
    .from('users')
    .select(
      'telegram_id, username, first_name, total_days, current_streak, longest_streak, total_elements, rare_elements_found'
    )
    .order('telegram_id')

  if (error) {
    console.error('❌ Ошибка получения пользователей:', error)
    return
  }

  console.log(`📊 Найдено пользователей: ${users.length}\n`)

  const problems = []

  for (const user of users) {
    const displayName =
      user.first_name || user.username || `ID:${user.telegram_id}`

    try {
      const calculated = await calculateCorrectStats(user.telegram_id)

      const issues = []

      // Сравниваем значения
      if (user.total_days !== calculated.totalDays) {
        issues.push(
          `total_days: БД=${user.total_days}, должно=${calculated.totalDays}`
        )
      }

      if (user.current_streak !== calculated.currentStreak) {
        issues.push(
          `current_streak: БД=${user.current_streak}, должно=${calculated.currentStreak}`
        )
      }

      if (user.longest_streak !== calculated.longestStreak) {
        issues.push(
          `longest_streak: БД=${user.longest_streak}, должно=${calculated.longestStreak}`
        )
      }

      if (user.total_elements !== calculated.totalElements) {
        issues.push(
          `total_elements: БД=${user.total_elements}, должно=${calculated.totalElements}`
        )
      }

      if (user.rare_elements_found !== calculated.rareElements) {
        issues.push(
          `rare_elements: БД=${user.rare_elements_found}, должно=${calculated.rareElements}`
        )
      }

      if (issues.length > 0) {
        problems.push({
          user: displayName,
          telegramId: user.telegram_id,
          issues,
        })
        console.log(`❌ ${displayName} (${user.telegram_id}):`)
        issues.forEach(issue => console.log(`   ${issue}`))
      } else {
        console.log(`✅ ${displayName} (${user.telegram_id}) - все корректно`)
      }
    } catch (err) {
      console.log(
        `⚠️ ${displayName} (${user.telegram_id}) - ошибка: ${err.message}`
      )
    }
  }

  console.log(`\n📈 ИТОГ:`)
  console.log(`✅ Корректных пользователей: ${users.length - problems.length}`)
  console.log(`❌ Пользователей с проблемами: ${problems.length}`)

  if (problems.length > 0) {
    console.log(`\n🔧 Для исправления выполните:`)
    console.log(`node scripts/update-user-stats.js --all`)

    console.log(`\n🎯 Или исправьте конкретных пользователей:`)
    problems.forEach(p => {
      console.log(
        `node scripts/update-user-stats.js ${p.telegramId}  # ${p.user}`
      )
    })
  }
}

verifyAllUsers().catch(console.error)

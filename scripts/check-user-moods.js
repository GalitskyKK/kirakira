#!/usr/bin/env node

/**
 * Скрипт для проверки настроений пользователя
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserMoods(telegramId) {
  console.log(`🔍 Проверяем настроения пользователя ${telegramId}...`)

  // Получаем записи настроений
  const { data: moodEntries, error: moodError } = await supabase
    .from('mood_entries')
    .select('mood_date, mood, created_at')
    .eq('telegram_id', telegramId)
    .order('mood_date', { ascending: false })

  if (moodError) {
    console.error('❌ Ошибка получения настроений:', moodError)
    return
  }

  console.log(`📊 Найдено записей настроений: ${moodEntries.length}`)

  if (moodEntries.length > 0) {
    console.log('\n📅 Последние записи настроений:')
    moodEntries.forEach((entry, index) => {
      const date = new Date(entry.mood_date).toLocaleDateString('ru-RU')
      console.log(
        `${index + 1}. ${date} - ${entry.mood} (создано: ${new Date(entry.created_at).toLocaleString('ru-RU')})`
      )
    })

    // Рассчитаем уникальные даты
    const uniqueDates = [
      ...new Set(
        moodEntries.map(entry => new Date(entry.mood_date).toDateString())
      ),
    ].sort((a, b) => new Date(b) - new Date(a))

    console.log(`\n🎯 Уникальных дней с настроениями: ${uniqueDates.length}`)
    console.log('Даты:')
    uniqueDates.forEach((dateStr, index) => {
      console.log(
        `${index + 1}. ${new Date(dateStr).toLocaleDateString('ru-RU')}`
      )
    })

    // Проверим стрик
    let currentStreak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1
      let checkDate = new Date(uniqueDates[0])

      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i])
        const expectedDate = new Date(checkDate)
        expectedDate.setDate(expectedDate.getDate() - 1)

        if (prevDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++
          checkDate = prevDate
        } else {
          break
        }
      }
    }

    console.log(`\n🔥 Расчетный стрик: ${currentStreak} дней`)
  }

  // Получаем текущие данные пользователя из БД
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('current_streak, longest_streak, total_days, total_elements')
    .eq('telegram_id', telegramId)
    .single()

  if (userError) {
    console.error('❌ Ошибка получения данных пользователя:', userError)
    return
  }

  console.log('\n💾 Данные в БД:')
  console.log(`- current_streak: ${user.current_streak}`)
  console.log(`- longest_streak: ${user.longest_streak}`)
  console.log(`- total_days: ${user.total_days}`)
  console.log(`- total_elements: ${user.total_elements}`)
}

async function main() {
  const telegramId = process.argv[2]
  if (!telegramId) {
    console.log(
      '📖 Использование: node scripts/check-user-moods.js [telegram_id]'
    )
    return
  }

  await checkUserMoods(parseInt(telegramId))
}

main().catch(console.error)

/**
 * 🍂 Скрипт для исправления seasonal_variant в существующих элементах сада
 * Устанавливает сезон на основе даты разблокировки элемента
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не настроены')
  console.error('Убедитесь, что файл .env содержит эти переменные')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Определяет сезон по дате
 */
function getSeasonFromDate(date) {
  const month = date.getMonth() + 1 // 1-12

  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

async function fixSeasonalVariants() {
  console.log('🍂 Начинаем исправление seasonal_variant...\n')

  try {
    // 1. Получаем все элементы с NULL seasonal_variant
    console.log('📊 Получаем элементы с NULL seasonal_variant...')
    const { data: elementsToFix, error: fetchError } = await supabase
      .from('garden_elements')
      .select('id, unlock_date, seasonal_variant')
      .is('seasonal_variant', null)

    if (fetchError) {
      throw new Error(`Ошибка при получении элементов: ${fetchError.message}`)
    }

    if (!elementsToFix || elementsToFix.length === 0) {
      console.log('✅ Все элементы уже имеют seasonal_variant!')
      return
    }

    console.log(
      `📦 Найдено элементов для исправления: ${elementsToFix.length}\n`
    )

    // 2. Обновляем каждый элемент
    let successCount = 0
    let errorCount = 0

    for (const element of elementsToFix) {
      const unlockDate = new Date(element.unlock_date)
      const season = getSeasonFromDate(unlockDate)

      const { error: updateError } = await supabase
        .from('garden_elements')
        .update({ seasonal_variant: season })
        .eq('id', element.id)

      if (updateError) {
        console.error(
          `❌ Ошибка при обновлении элемента ${element.id}:`,
          updateError.message
        )
        errorCount++
      } else {
        successCount++
      }
    }

    console.log('\n📈 Результаты обновления:')
    console.log(`✅ Успешно обновлено: ${successCount}`)
    console.log(`❌ Ошибок: ${errorCount}\n`)

    // 3. Показываем статистику по сезонам
    console.log('📊 Статистика по сезонам после обновления:')
    const { data: stats, error: statsError } = await supabase
      .from('garden_elements')
      .select('seasonal_variant')

    if (statsError) {
      throw new Error(`Ошибка при получении статистики: ${statsError.message}`)
    }

    const seasonCounts = stats.reduce((acc, element) => {
      const season = element.seasonal_variant || 'null'
      acc[season] = (acc[season] || 0) + 1
      return acc
    }, {})

    console.table(seasonCounts)

    // 4. Показываем примеры обновленных элементов
    console.log('\n📝 Примеры обновленных элементов:')
    const { data: examples, error: examplesError } = await supabase
      .from('garden_elements')
      .select('id, element_type, unlock_date, seasonal_variant')
      .order('unlock_date', { ascending: false })
      .limit(10)

    if (examplesError) {
      throw new Error(`Ошибка при получении примеров: ${examplesError.message}`)
    }

    console.table(
      examples.map(e => ({
        id: e.id.substring(0, 8) + '...',
        type: e.element_type,
        date: new Date(e.unlock_date).toLocaleDateString('ru-RU'),
        season: e.seasonal_variant,
      }))
    )

    console.log('\n✅ Исправление завершено успешно!')
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message)
    process.exit(1)
  }
}

// Запускаем скрипт
fixSeasonalVariants()

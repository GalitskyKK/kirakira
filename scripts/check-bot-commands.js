#!/usr/bin/env node

/**
 * 🤖 ПРОВЕРКА КОМАНД TELEGRAM БОТА
 *
 * Проверяет и обновляет список команд бота
 */

import fetch from 'node-fetch'

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения')
  process.exit(1)
}

async function checkBotCommands() {
  console.log('🤖 Проверяем команды Telegram бота...\n')

  try {
    // 1. Получаем текущие команды
    console.log('📋 Получаем текущие команды...')
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getMyCommands`
    )
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Ошибка API: ${data.description}`)
    }

    console.log('✅ Текущие команды бота:')
    if (data.result && data.result.length > 0) {
      data.result.forEach(cmd => {
        console.log(`   /${cmd.command} - ${cmd.description}`)
      })
    } else {
      console.log('   (команды не настроены)')
    }

    console.log('')

    // 2. Проверяем есть ли команда notifications
    const hasNotificationsCommand = data.result?.some(
      cmd => cmd.command === 'notifications'
    )

    if (hasNotificationsCommand) {
      console.log('✅ Команда /notifications уже зарегистрирована!')
    } else {
      console.log('⚠️ Команда /notifications НЕ зарегистрирована')

      // 3. Регистрируем команды
      console.log('\n🔧 Регистрируем команды...')

      const commands = [
        {
          command: 'start',
          description: '🌸 Запуск KiraKira - твой эмоциональный сад',
        },
        { command: 'mood', description: '😊 Быстро отметить настроение' },
        { command: 'garden', description: '🌱 Посмотреть свой сад' },
        { command: 'stats', description: '📊 Статистика и достижения' },
        { command: 'notifications', description: '🔔 Настройки уведомлений' },
        { command: 'share', description: '🔗 Поделиться садом с друзьями' },
        { command: 'help', description: '❓ Справка и поддержка' },
      ]

      const setCommandsResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commands }),
        }
      )

      const setCommandsData = await setCommandsResponse.json()

      if (setCommandsResponse.ok && setCommandsData.ok) {
        console.log('✅ Команды успешно зарегистрированы!')
        console.log('\n📋 Новый список команд:')
        commands.forEach(cmd => {
          console.log(`   /${cmd.command} - ${cmd.description}`)
        })
      } else {
        console.error(
          '❌ Ошибка регистрации команд:',
          setCommandsData.description
        )
      }
    }

    // 4. Проверяем webhook
    console.log('\n🔗 Проверяем webhook...')
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    )
    const webhookData = await webhookResponse.json()

    if (webhookResponse.ok) {
      console.log('✅ Webhook информация:')
      console.log(`   URL: ${webhookData.result.url || 'не настроен'}`)
      console.log(
        `   Статус: ${webhookData.result.has_custom_certificate ? 'с сертификатом' : 'без сертификата'}`
      )
      console.log(
        `   Ошибки: ${webhookData.result.last_error_message || 'нет'}`
      )
      console.log(`   Макс соединения: ${webhookData.result.max_connections}`)
    }
  } catch (error) {
    console.error('💥 Ошибка:', error.message)
    return false
  }

  return true
}

// Запускаем проверку
checkBotCommands()
  .then(success => {
    console.log(
      success ? '\n🎉 Проверка завершена!' : '\n💥 Проверка провалена!'
    )
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })

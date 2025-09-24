/**
 * Конфигурация платежной системы
 * Легко переключать между демо-режимом и реальными платежами
 */

export const PAYMENT_CONFIG = {
  // Пока нет ИП - демо-режим с ограничениями
  DEMO_MODE: true,

  // Включить когда будут готовы платежи
  ENABLE_YUKASSA: false,
  ENABLE_TELEGRAM_STARS: false,

  // Сообщения для пользователей
  DEMO_MESSAGE: 'Получите премиум через задания, счастливые часы или trial!',
  REAL_PAYMENT_MESSAGE:
    'Разблокируйте дополнительные функции безопасной оплатой',

  // Цены (в рублях)
  PRICES: {
    rare_elements: 199,
    seasonal_themes: 99,
    premium_bundle: 249,
  },

  // Настройки демо-ограничений
  DEMO_LIMITS: {
    // Trial период для новых пользователей (дни)
    TRIAL_PERIOD_DAYS: 7,

    // Бесплатные активации для каждой функции
    FREE_ACTIVATIONS_PER_FEATURE: 3,

    // "Счастливые часы" (UTC время)
    HAPPY_HOURS: {
      START: 17, // 20:00 МСК = 17:00 UTC
      END: 18, // 21:00 МСК = 18:00 UTC
    },

    // Задания для получения премиум доступа
    TASKS: {
      MOOD_STREAK_DAYS: 3, // Отметить настроение N дней подряд
      GARDEN_VISITS: 5, // Зайти в сад N раз
      SHARING_COUNT: 1, // Поделиться садом N раз
    },

    // Временный доступ после выполнения заданий (часы)
    TASK_REWARD_HOURS: 24,
  },

  // Настройки для будущего
  YUKASSA: {
    // Получить после регистрации ИП и подключения ЮKassa
    PROVIDER_TOKEN: process.env.YUKASSA_PROVIDER_TOKEN || '',
    SHOP_ID: process.env.YUKASSA_SHOP_ID || '',
    SECRET_KEY: process.env.YUKASSA_SECRET_KEY || '',
  },

  TELEGRAM: {
    // Telegram Stars токены (когда станут доступны)
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  },
}

/**
 * Проверяет доступность платежных систем
 */
export function getAvailablePaymentMethods() {
  const methods = []

  if (PAYMENT_CONFIG.DEMO_MODE) {
    methods.push('demo')
  }

  if (
    PAYMENT_CONFIG.ENABLE_TELEGRAM_STARS &&
    PAYMENT_CONFIG.TELEGRAM.BOT_TOKEN
  ) {
    methods.push('telegram_stars')
  }

  if (PAYMENT_CONFIG.ENABLE_YUKASSA && PAYMENT_CONFIG.YUKASSA.PROVIDER_TOKEN) {
    methods.push('yukassa')
  }

  return methods
}

/**
 * Получает текст для кнопки покупки
 */
export function getPurchaseButtonText(price: number): string {
  if (PAYMENT_CONFIG.DEMO_MODE) {
    return '🎁 Получить бесплатно (демо)'
  }

  return `Купить за ${price} ₽`
}

/**
 * Получает цвет кнопки покупки
 */
export function getPurchaseButtonColor(): { color: string; textColor: string } {
  if (PAYMENT_CONFIG.DEMO_MODE) {
    return { color: '#4CAF50', textColor: '#FFFFFF' }
  }

  return { color: '#FFD700', textColor: '#000000' }
}

/**
 * Возвращает true если система готова к реальным платежам
 */
export function isPaymentSystemReady(): boolean {
  return (
    !PAYMENT_CONFIG.DEMO_MODE &&
    (PAYMENT_CONFIG.ENABLE_YUKASSA || PAYMENT_CONFIG.ENABLE_TELEGRAM_STARS)
  )
}

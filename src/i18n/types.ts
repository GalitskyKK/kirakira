/**
 * Типы для системы локализации
 */

export type Locale = 'ru' | 'en'

export interface Translations {
  // Общие
  common: {
    close: string
    save: string
    cancel: string
    delete: string
    edit: string
    loading: string
    error: string
    success: string
    confirm: string
    back: string
    next: string
    done: string
  }

  // Настройки
  settings: {
    title: string
    appearance: string
    appearanceDescription: string
    roomTheme: string
    roomThemeDescription: string
    displayMode: string
    displayModeDescription: string
    friendGardenDisplay: string
    friendGardenDisplayDescription: string
    companion: string
    companionDescription: string
    privacy: string
    privacyDescription: string
    account: string
    accountDescription: string
    logout: string
    logoutDescription: string
    language: string
    languageDescription: string
  }

  // Магазин
  shop: {
    title: string
    themes: string
    freezes: string
    upgrades: string
    gardenThemes: string
    roomThemes: string
    comingSoon: string
    comingSoonDescription: string
    closeShop: string
  }

  // Настроение
  mood: {
    title: string
    howAreYouToday: string
    alreadyCheckedIn: string
    checkIn: string
    intensity: {
      low: string
      medium: string
      high: string
    }
    saving: string
    growingPlant: string
    returnTomorrow: string
    returnTomorrowToGrow: string
    timeUntilNext: string
    hours: string
    minutes: string
    howStrong: string
  }

  // Сад
  garden: {
    title: string
    yourDigitalGarden: string
    plants: string
    daysInRow: string
    totalElements: string
    elements: string
    rarity: {
      common: string
      uncommon: string
      rare: string
      epic: string
      legendary: string
    }
  }

  // Названия настроений
  moodLabels: {
    joy: string
    calm: string
    stress: string
    sadness: string
    anger: string
    anxiety: string
  }

  // Описания настроений
  moodDescriptions: {
    joy: string
    calm: string
    stress: string
    sadness: string
    anger: string
    anxiety: string
  }

  // Элементы
  elements: {
    rarity: {
      common: string
      uncommon: string
      rare: string
      epic: string
      legendary: string
    }
  }

  // Ошибки
  errors: {
    userNotFound: string
    pleaseLogin: string
    generic: string
  }

  // Онбординг
  onboarding: {
    welcome: {
      title: string
      description: string
      content1: string
      content2: string
    }
  }

  // Транзакции
  transactions: {
    dailyMood: string
    dailyLogin: string
    firstMoodOfDay: string
    streak3Days: string
    streak7Days: string
    streak14Days: string
    streak30Days: string
    streak100Days: string
    streak365Days: string
    levelUp: string
    achievementUnlock: string
    rareAchievement: string
    elementCommon: string
    elementUncommon: string
    elementRare: string
    elementEpic: string
    elementLegendary: string
    friendVisitGarden: string
    visitFriendGarden: string
    likeFriendGarden: string
    receiveLike: string
    shareGarden: string
    completeDailyQuest: string
    completeWeeklyChallenge: string
    completeMonthlyChallenge: string
    extraRoom: string
    upgradeToRare: string
    upgradeToEpic: string
    upgradeToLegendary: string
  }

  // История транзакций
  transactionHistory: {
    empty: string
    emptyDescription: string
    all: string
    earned: string
    spent: string
    balance: string
  }

  // Общие фразы
  commonPhrases: {
    selectMoodDescription: string
  }
}

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
      label: string
    }
    saving: string
    growingPlant: string
    returnTomorrow: string
    returnTomorrowToGrow: string
    timeUntilNext: string
    hours: string
    minutes: string
    howStrong: string
    addNote: string
    addNoteOptional: string
    notePlaceholder: string
    update: string
    intensityLabel: string
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
    moodTracking: {
      title: string
      description: string
      content: string
      emotionsNote: string
    }
    gardenGrowth: {
      title: string
      description: string
      content: string
      overTime: string
    }
    ready: {
      title: string
      description: string
      content: string
      tipTitle: string
      tipContent: string
    }
    start: string
    skip: string
    of: string
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
    noTransactionsWithFilters: string
    sprouts: string
    gems: string
  }

  // Общие фразы
  commonPhrases: {
    selectMoodDescription: string
  }

  // Валюта
  currency: {
    sprouts: string
    sproutsPlural: string
    gems: string
    gemsPlural: string
  }

  // Заморозки
  freezes: {
    yourFreezes: string
    manual: string
    auto: string
    info: string
    protectsStreak: string
    manualUse: string
    autoUse: string
    maxAccumulation: string
    price: string
    buy: string
    buyFor: string
    limitReached: string
    insufficientFunds: string
    purchasing: string
    premium: string
    usefulInfo: string
    manualAccumulation: string
    autoUsage: string
    protectsFromReset: string
    earnForLevelUp: string
    dependsOnLevel: string
  }

  // Streak Freeze Modal
  streakFreeze: {
    lostForever: string
    tooManyDaysMissed: string
    maxRestore: string
    wasStreak: string
    newStreak: string
    days: string
    understood: string
    restoreStreak: string
    missedDays: string
    useFreeze: string
    buyFreeze: string
    resetStreak: string
    noFreezes: string
    interrupted: string
    currentStreak: string
    afterLoss: string
    youHave: string
    autoFreeze: string
    triggersAutomatically: string
    regularFreezes: string
    needToUse: string
    canRestore: string
    confirmReset: string
    resetDescription: string
    using: string
    useAutoFreeze: string
    useFreezes: string
    buyFreezes: string
    cancel: string
    tip: string
  }

  // Темы
  themes: {
    free: string
    select: string
    use: string
    buy: string
    purchasing: string
    previousTheme: string
    nextTheme: string
    previousRoomTheme: string
    nextRoomTheme: string
    goToTheme: string
  }

  // Элементы сада
  elementTypes: {
    flower: string
    tree: string
    stone: string
    water: string
    grass: string
    mushroom: string
    crystal: string
    decoration: string
    rainbowFlower: string
    glowingCrystal: string
    mysticMushroom: string
    auroraTree: string
    starlightDecoration: string
  }

  // Сезоны
  seasons: {
    spring: string
    summer: string
    autumn: string
    winter: string
  }

  // Статистика сада
  gardenStats: {
    details: string
    total: string
    byType: string
    byRarity: string
    byMood: string
    oldest: string
    newest: string
    age: string
    unlockDate: string
    ago: string
    totalPlants: string
    newGarden: string
    streak: string
    lastPlant: string
    plantGrew: string
    statistics: string
  }

  // Страницы
  pages: {
    garden: {
      myRoom: string
      myPalette: string
      myGarden: string
      isometric: string
      palette: string
      classic: string
    }
    quests: {
      title: string
      description: string
      authRequired: string
    }
    mood: {
      emptyGarden: string
      growFirstPlant: string
      dailyQuests: string
      completeQuests: string
      community: string
      challengesAndFriends: string
      statistics: string
      moodAnalytics: string
      gardenComposition: string
      untilMilestone: string
      reward: string
      mood: string
      checked: string
      waiting: string
      plant: string
      readyToGrow: string
      grown: string
      days: string
    }
  }

  // Квесты
  quests: {
    quest: string
    progress: string
    completed: string
    reward: string
    timeRemaining: string
    tip: string
    claim: string
    claiming: string
    claimed: string
    expired: string
  }

  // Челленджи
  challenges: {
    noActive: string
    comingSoon: string
    competitive: string
    group: string
    personal: string
    teamProgress: string
    yourProgress: string
    completed: string
    goal: string
    experience: string
    reward: string
    claimReward: string
    error: string
    daysLeft: string
    hoursLeft: string
  }

  // Компаньон
  companion: {
    spirit: string
    currentState: string
    moodOfDay: string
    futureUpdate: string
  }

  // Профиль
  profile: {
    user: string
    rating: string
    statistics: string
    today: string
    day: string
    days: string
    experience: string
    outsideTop: string
    level: string
    levelShort: string
    toLevel: string
  }
}

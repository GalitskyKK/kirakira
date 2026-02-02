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
    refresh: string
    pieces: string
    total: string
    user: string
    tryAgain: string
    closeModal: string
    previous: string
    nextPage: string
    previousPage: string
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
    feedback: string
    feedbackDescription: string
    sendFeedback: string
    openTelegramChat: string
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

  // Обновления приложения
  update: {
    available: string
    update: string
    offlineReady: string
  }

  // Ошибки
  error: {
    title: string
    message: string
    description: string
  }

  // Сад
  garden: {
    title: string
    yourDigitalGarden: string
    plants: string
    daysInRow: string
    totalElements: string
    elements: string
    composition: string
    elementRarity: string
    noRarityData: string
    lastPlant: string
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
    displayModes: {
      title: string
      description: string
      content: string
      paletteNote: string
    }
    shopAndCurrency: {
      title: string
      description: string
      content: string
      sproutsNote: string
      gemsNote: string
    }
    progress: {
      title: string
      description: string
      content: string
      levelsNote: string
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

  // Подсказки по страницам
  hints: {
    mood: {
      title: string
      description: string
    }
    garden: {
      title: string
      description: string
    }
    shop: {
      title: string
      description: string
    }
    stats: {
      title: string
      description: string
    }
    dismiss: string
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
    buyFor: string
    active: string
    unavailable: string
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

  // Редкость элементов (для модалки улучшения)
  rarityLabels: {
    common: string
    uncommon: string
    rare: string
    epic: string
    legendary: string
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
    mood: string
    season: string
    position: string
    history: string
    moodInfluence: string
    seasonalVariant: string
    didYouKnow: string
    careTip: string
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
      diaryEmptyTitle: string
      diaryEmptyDescription: string
      diaryEmptyWeek: string
      diaryTotalWeeks: string
      diaryTotalEntries: string
      diaryComment: string
      diaryNoComment: string
    }
    community: {
      title: string
      friends: string
      telegramOnly: string
      authRequired: string
      loginToView: string
      login: string
      friendGarden: {
        back: string
        title: string
        viewOnly: string
        notFriends: string
        gardenHidden: string
        userNotFound: string
        noAccess: string
        loadError: string
        onlyForFriends: string
        gardenPrivate: string
        possibleRestricted: string
        loading: string
        addFriend: string
        tryAgain: string
        return: string
        gardenOf: string
        plants: string
        friendGarden: string
        days: string
        noMoodForPalette: string
        mood: string
        emptyGarden: string
        noElementsYet: string
      }
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
    error: string
    noQuests: string
    comingSoon: string
    categories: {
      mood: string
      garden: string
      social: string
      streak: string
    }
    daily: string
    challenges: string
    authRequired: string
    loginToView: string
    login: string
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
    claiming: string
    error: string
    daysLeft: string
    hoursLeft: string
    timeRemaining: string
    participants: string
    type: string
    rewardsForCompletion: string
    achievements: string
    progress: string
    completedPercent: string
    yourContribution: string
    percentOfGoal: string
    joinChallenge: string
    joining: string
    joinSuccess: string
    joinError: string
    claimError: string
    alreadyParticipating: string
    challengeCompleted: string
    authRequired: string
    unavailable: string
    loadingError: string
    challengeNotFound: string
    challengeNotFoundDescription: string
    finished: string
    days: string
    hours: string
    minutes: string
  }

  // Компаньон
  companion: {
    spirit: string
    currentState: string
    moodOfDay: string
    futureUpdate: string
    name: string
    description: string
    ariaLabel: string
    thankYou: string
    rewardEarned: string
    questProgress: string
    rareDiscovery: string
    emotions: {
      neutral: {
        label: string
        description: string
      }
      joy: {
        label: string
        description: string
      }
      calm: {
        label: string
        description: string
      }
      sadness: {
        label: string
        description: string
      }
      anger: {
        label: string
        description: string
      }
      stress: {
        label: string
        description: string
      }
      anxiety: {
        label: string
        description: string
      }
      celebration: {
        label: string
        description: string
      }
    }
    moodMessages: {
      joy: readonly string[]
      calm: readonly string[]
      sadness: readonly string[]
      stress: readonly string[]
      anger: readonly string[]
      anxiety: readonly string[]
    }
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
    moodDiary: string
    moodHistory: string
    authRequired: string
    somethingWentWrong: string
    dontWorry: string
    login: string
    streak: string
    start: string
    rare: string
    found: string
    achievements: string
    viewAll: string
    collapse: string
    allUnlocked: string
    moreAchievements: string
    continueCaring: string
    entries: string
    currentSeries: string
    of: string
    lastDays: string
    frequentMoods: string
    moodPattern: string
    averageIntensity: string
    allTime: string
  }

  // Профиль друга
  friendProfile: {
    title: string
    back: string
    profileUnavailable: string
    loadingProfile: string
    todayJoined: string
    daysWithUs: string
    dayWithUs: string
    statistics: string
    bestStreak: string
    plants: string
    totalDays: string
    rareElements: string
    achievements: string
    privateGarden: string
    userHidStats: string
    privateAchievements: string
    userHidAchievements: string
    privacySettings: string
    userAllowed: string
    profileStatsAchievements: string
    profileStats: string
    profileAchievements: string
    onlyProfile: string
    inFriends: string
    removeFromFriends: string
    removeConfirm: string
    removeConfirmText: string
    remove: string
    cancelRequest: string
    accept: string
    decline: string
    requestUnavailable: string
    addToFriends: string
    requestSent: string
    requestCancelled: string
    removedFromFriends: string
    requestUpdated: string
    failedToSend: string
    failedToCancel: string
    failedToRemove: string
    failedToProcess: string
    noData: string
  }

  // Рейтинг
  leaderboard: {
    title: string
    refresh: string
    level: string
    levelDescription: string
    levelMetric: string
    levelShort: string
    streak: string
    streakDescription: string
    streakMetric: string
    streakShort: string
    elements: string
    elementsDescription: string
    elementsMetric: string
    elementsShort: string
    allTime: string
    monthly: string
    failedToLoad: string
    tryAgain: string
    noOneYet: string
    beFirst: string
    yourPosition: string
    updated: string
    gardenerGarden: string
    toViewGarden: string
    profileHidden: string
    garden: string
    gardenHidden: string
  }

  // Статистика настроения
  moodStats: {
    title: string
    startMarking: string
    entries: string
    daysInRow: string
    currentSeries: string
    lastDays: string
    frequentMoods: string
    moodPattern: string
    mostCommonRecent: string
    recommendationNoData: string
    recommendationNoPattern: string
    averageIntensity: string
    allTime: string
  }

  // Настройки отображения
  displayMode: {
    garden: string
    gardenDescription: string
    palette: string
    paletteDescription: string
    room: string
    roomDescription: string
    shelves: string
    shelvesDescription: string
    info: string
  }

  // Настройки компаньона
  companionSettings: {
    show: string
    hide: string
    accompanies: string
    sleeping: string
    willWake: string
    willUnlockAtLevel: string
    verySoon: string
    levelRemaining: string
    levelsRemaining: string
    levelsRemainingPlural: string
  }

  // Настройки приватности
  privacy: {
    showProfile: string
    showProfileDescription: string
    shareGarden: string
    shareGardenDescription: string
    showAchievements: string
    showAchievementsDescription: string
    friendRequests: string
    friendRequestsDescription: string
    cloudSync: string
    cloudSyncDescription: string
    aboutData: string
    dataInfo: string
  }

  // Сад - кнопки и действия
  gardenActions: {
    emptyGarden: string
    markMoodToGrow: string
    palette: string
    exitFullscreen: string
    fullscreen: string
    moving: string
    confirmMove: string
    cancelMove: string
    overview: string
    upgradeFree: string
    upgradeFor: string
    upgrading: string
    upgrade: string
    upgradeElement: string
    successRate: string
    bonus: string
    attempts: string
    soonSuccess: string
    chooseUpgradeMethod: string
    or: string
    insufficientSprouts: string
    legendaryWarning: string
    loading: string
    room: string
    of: string
    elements: string
    roomFull: string
    roomNames: {
      first: string
      second: string
      third: string
      fourth: string
      fifth: string
      sixth: string
      seventh: string
      eighth: string
      ninth: string
      tenth: string
    }
    previousTheme: string
    nextTheme: string
    goToTheme: string
    previousRoom: string
    nextRoom: string
    roomNumber: string
    roomOf: string
  }

  // Друзья
  friends: {
    search: string
    noFriends: string
    inviteFriends: string
    sendInvite: string
    profile: string
    garden: string
    was: string
    online: string
    title: string
    subtitle: string
    friendsTab: string
    requestsTab: string
    findTab: string
    invitesTab: string
    loadError: string
    enterReferralCode: string
    userNotFound: string
    minSearchLength: string
    authRequired: string
    searchError: string
    connectionError: string
    searchByCode: string
    telegramOnly: string
    requests: {
      title: string
      subtitle: string
      incoming: string
      outgoing: string
      sent: string
      waiting: string
      cancelRequest: string
      cancelFailed: string
      noRequests: string
      useReferralCodes: string
    }
    find: {
      title: string
      subtitle: string
      userSearch: string
      userSearchDescription: string
      enterNameOrUsername: string
      search: string
      enterQuery: string
      alreadyFriend: string
      registered: string
      add: string
      loading: string
      showMore: string
      referralSearch: string
      referralSearchDescription: string
      enterReferralCode: string
      requestSent: string
    }
    invites: {
      title: string
      subtitle: string
      sendInvitation: string
      sendInvitationDescription: string
      send: string
      referralCode: string
      shareCode: string
      share: string
      creatingCode: string
      refreshData: string
      ifCodeNotAppeared: string
      statistics: string
      friends: string
      invited: string
      shareToGrow: string
    }
  }

  // Темы - названия и описания
  themeNames: {
    light: string
    dark: string
    sunset: string
    night: string
    forest: string
    aqua: string
    magic: string
    space: string
    cyberpunk: string
    isoRoom: string
    autumn_room: string
    brick_room: string
    cyberpunk_room: string
    zodiac_room: string
    dark_neon_room: string
    high_tec_room: string
    new_year_room: string
    paint_room: string
    prison_room: string
    white_default_room: string
    blue_default_room: string
    dark_blue_default_room: string
    orange_default_room: string
    old_wood_room: string
  }

  // Онбординг - переключение языка
  onboardingLanguage: {
    selectLanguage: string
  }
}

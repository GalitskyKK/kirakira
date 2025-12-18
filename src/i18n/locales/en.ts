import type { Translations } from '../types'

export const en: Translations = {
  common: {
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    done: 'Done',
  },

  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    appearanceDescription: 'Personalize the look of your garden',
    roomTheme: 'Room Theme',
    roomThemeDescription: 'Choose a theme for the isometric room',
    displayMode: 'Display Mode',
    displayModeDescription: 'Choose how to visualize your garden',
    friendGardenDisplay: 'How Friends See My Garden',
    friendGardenDisplayDescription:
      'Choose the view that others will see when viewing your garden',
    companion: 'Lumina — Garden Spirit',
    companionDescription: 'Settings for your living companion',
    privacy: 'Privacy',
    privacyDescription: 'Manage access to your data',
    account: 'Account',
    accountDescription: 'Manage browser login',
    logout: 'Log Out',
    logoutDescription:
      'We will clear the browser token and return to the login screen.',
    language: 'Language',
    languageDescription: 'Choose interface language',
  },

  shop: {
    title: '🛒 Shop',
    themes: 'Themes',
    freezes: 'Freezes',
    upgrades: 'Upgrades',
    gardenThemes: 'Garden Themes',
    roomThemes: 'Room Themes',
    comingSoon: 'Coming Soon',
    comingSoonDescription: 'Garden element upgrades in development',
    closeShop: 'Close Shop',
  },

  mood: {
    title: 'Mood',
    howAreYouToday: 'How are you today?',
    alreadyCheckedIn: 'Mood checked in',
    checkIn: 'Check in mood',
    intensity: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
    saving: 'Saving...',
    growingPlant: 'Growing plant...',
    returnTomorrow: 'Come back tomorrow',
    returnTomorrowToGrow: 'Come back tomorrow and grow a new plant!',
    timeUntilNext: 'Until next check-in',
    hours: 'h',
    minutes: 'm',
    howStrong: 'How strong?',
  },

  garden: {
    title: 'Garden',
    yourDigitalGarden: 'Your digital emotional garden',
    plants: 'Plants',
    daysInRow: 'Days in a row',
    totalElements: 'Total elements',
    elements: 'elements',
    rarity: {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    },
  },

  moodLabels: {
    joy: 'Joy',
    calm: 'Calm',
    stress: 'Stress',
    sadness: 'Sadness',
    anger: 'Anger',
    anxiety: 'Anxiety',
  },

  moodDescriptions: {
    joy: 'Feeling happy and energetic',
    calm: 'Feeling peaceful and balanced',
    stress: 'Feeling tense and restless',
    sadness: 'Feeling sad or melancholic',
    anger: 'Feeling irritated or angry',
    anxiety: 'Feeling worried and anxious',
  },

  elements: {
    rarity: {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    },
  },

  errors: {
    userNotFound: 'User not found',
    pleaseLogin: 'Please log in to view settings',
    generic: 'An error occurred',
  },

  onboarding: {
    welcome: {
      title: 'Welcome to KiraKira',
      description: 'Your personal digital emotional garden',
      content1:
        'KiraKira is a meditative app where your daily emotions turn into a beautiful digital garden.',
      content2:
        'Every day, by marking your mood, you grow unique plants, creating a personal space for reflection.',
    },
  },

  transactions: {
    dailyMood: 'Mood entry',
    dailyLogin: 'Daily login',
    firstMoodOfDay: 'First entry of the day',
    streak3Days: '3 day streak',
    streak7Days: '7 day streak',
    streak14Days: '14 day streak',
    streak30Days: '30 day streak',
    streak100Days: '100 day streak',
    streak365Days: '1 year streak!',
    levelUp: 'Level up',
    achievementUnlock: 'Achievement',
    rareAchievement: 'Rare achievement',
    elementCommon: 'Common element',
    elementUncommon: 'Uncommon element',
    elementRare: 'Rare element',
    elementEpic: 'Epic element',
    elementLegendary: 'Legendary element',
    friendVisitGarden: 'Garden visit',
    visitFriendGarden: 'Visited friend',
    likeFriendGarden: 'Garden like',
    receiveLike: 'Received like',
    shareGarden: 'Shared garden',
    completeDailyQuest: 'Daily quest',
    completeWeeklyChallenge: 'Weekly challenge',
    completeMonthlyChallenge: 'Monthly challenge',
    extraRoom: 'Room purchase',
    upgradeToRare: 'Upgrade to Rare',
    upgradeToEpic: 'Upgrade to Epic',
    upgradeToLegendary: 'Upgrade to Legendary',
  },

  transactionHistory: {
    empty: 'Transaction history is empty',
    emptyDescription: 'Start earning currency!',
    all: 'All',
    earned: 'Earned',
    spent: 'Spent',
    balance: 'Balance:',
  },

  commonPhrases: {
    selectMoodDescription: 'Choose what best describes your mood',
  },
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PremiumFeature {
  id: string
  name: string
  description: string
  unlockedAt?: Date
  active: boolean
}

export interface PremiumState {
  // Премиум статус
  isPremium: boolean
  features: Record<string, PremiumFeature>

  // Действия
  unlockFeature: (featureId: string) => void
  hasFeature: (featureId: string) => boolean
  getActiveFeatures: () => PremiumFeature[]

  // Сезонные темы
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter' | 'default'
  setSeason: (
    season: 'spring' | 'summer' | 'autumn' | 'winter' | 'default'
  ) => void
}

// Доступные премиум функции
const PREMIUM_FEATURES: Record<
  string,
  Omit<PremiumFeature, 'active' | 'unlockedAt'>
> = {
  rare_elements: {
    id: 'rare_elements',
    name: 'Редкие элементы сада',
    description: 'Светящиеся кристаллы, радужные цветы и мистические грибы',
  },
  seasonal_themes: {
    id: 'seasonal_themes',
    name: 'Сезонные темы',
    description: 'Коллекция тем для разных времен года',
  },
  premium_bundle: {
    id: 'premium_bundle',
    name: 'Премиум комплект',
    description: 'Все премиум функции со скидкой',
  },
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      features: {},
      currentSeason: 'default',

      unlockFeature: (featureId: string) => {
        const feature = PREMIUM_FEATURES[featureId]
        if (!feature) return

        set(state => {
          const newFeatures = {
            ...state.features,
            [featureId]: {
              ...feature,
              active: true,
              unlockedAt: new Date(),
            },
          }

          // Если купили bundle, разблокируем все функции
          if (featureId === 'premium_bundle') {
            Object.keys(PREMIUM_FEATURES).forEach(id => {
              if (id !== 'premium_bundle') {
                const feature = PREMIUM_FEATURES[id]
                if (feature) {
                  newFeatures[id] = {
                    ...feature,
                    active: true,
                    unlockedAt: new Date(),
                  }
                }
              }
            })
          }

          const hasPremiumFeatures = Object.values(newFeatures).some(
            f => f.active
          )

          return {
            features: newFeatures,
            isPremium: hasPremiumFeatures,
          }
        })
      },

      hasFeature: (featureId: string) => {
        const feature = get().features[featureId]
        return feature?.active ?? false
      },

      getActiveFeatures: () => {
        return Object.values(get().features).filter(f => f.active)
      },

      setSeason: season => {
        set({ currentSeason: season })
      },
    }),
    {
      name: 'kirakira-premium-storage',
      version: 1,
    }
  )
)

// Утилиты для проверки премиум статуса
export const premiumUtils = {
  hasRareElements: () => usePremiumStore.getState().hasFeature('rare_elements'),
  hasSeasonalThemes: () =>
    usePremiumStore.getState().hasFeature('seasonal_themes'),
  getCurrentSeason: () => usePremiumStore.getState().currentSeason,

  // Проверка, можно ли использовать редкие элементы
  canUseRareElement: (elementType: string) => {
    const hasFeature = premiumUtils.hasRareElements()
    const rareTypes = ['rainbow_flower', 'glowing_crystal', 'mystic_mushroom']
    return !rareTypes.includes(elementType) || hasFeature
  },
}

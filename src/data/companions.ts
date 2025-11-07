import type {
  CompanionDefinition,
  CompanionEmotion,
  CompanionId,
  MoodType,
} from '@/types'
import { RarityLevel } from '@/types'

export const DEFAULT_COMPANION_ID: CompanionId = 'lumina'

const baseEmotionLabels: Readonly<Record<CompanionEmotion, string>> = {
  neutral: 'Спокойствие света',
  joy: 'Искрящаяся радость',
  calm: 'Дыхание гармонии',
  sadness: 'Тихая грусть',
  anger: 'Пылающая решимость',
  stress: 'Перегруженный вихрь',
  anxiety: 'Трепет ожидания',
  celebration: 'Созвездие чудес',
} as const

export const COMPANION_DEFINITIONS: Readonly<
  Record<CompanionId, CompanionDefinition>
> = {
  lumina: {
    id: 'lumina',
    name: 'Лумина',
    description:
      'Маленький дух света, который отражает настроение сада и мягко направляет садовника.',
    unlockLevel: 1,
    baseScale: 1,
    moodMap: {
      joy: 'joy',
      calm: 'calm',
      sadness: 'sadness',
      anger: 'anger',
      stress: 'stress',
      anxiety: 'anxiety',
      default: 'neutral',
    },
    emotions: {
      neutral: {
        emotion: 'neutral',
        label: baseEmotionLabels.neutral,
        description: 'Лумина спокойно парит, мерцая мягким светом.',
        bodyGradient: ['#9BE7FF', '#6A63FF'],
        coreGlow: ['#FFFFFF', '#99A7FF'],
        auraColor: '#A9B6FF',
        auraOpacity: 0.3,
        eyeShape: 'calm',
        mouthShape: 'soft',
        float: { amplitude: 12, duration: 5 },
        sway: { amplitude: 6, duration: 7 },
        scaleRange: [0.96, 1.02],
        accentColor: '#5F6DFF',
        particlePreset: {
          variant: 'drift',
          color: '#EDF2FF',
          count: 4,
          size: [6, 12],
          opacity: [0.18, 0.32],
          travel: { amplitude: 14, duration: 8 },
        },
      },
      joy: {
        emotion: 'joy',
        label: baseEmotionLabels.joy,
        description:
          'Лумина сияет тёплым светом и оставляет за собой звёздный след.',
        bodyGradient: ['#FFE066', '#FF9F1C'],
        coreGlow: ['#FFFFFF', '#FFD26F'],
        auraColor: '#FFEAA7',
        auraOpacity: 0.42,
        eyeShape: 'smile',
        mouthShape: 'smile',
        float: { amplitude: 16, duration: 4.2 },
        sway: { amplitude: 9, duration: 3.6 },
        scaleRange: [1, 1.08],
        accentColor: '#FFB347',
        particlePreset: {
          variant: 'sparkle',
          color: '#FFF3B0',
          count: 6,
          size: [5, 9],
          opacity: [0.3, 0.6],
          travel: { amplitude: 18, duration: 3.4 },
        },
      },
      calm: {
        emotion: 'calm',
        label: baseEmotionLabels.calm,
        description:
          'Сияние становится прохладным, а движения — медленными и ровными.',
        bodyGradient: ['#A8FFEB', '#4CD3C2'],
        coreGlow: ['#E2FFF8', '#76E8D8'],
        auraColor: '#7AF2DD',
        auraOpacity: 0.36,
        eyeShape: 'calm',
        mouthShape: 'soft',
        float: { amplitude: 11, duration: 6.2 },
        sway: { amplitude: 7, duration: 5.4 },
        scaleRange: [0.98, 1.04],
        accentColor: '#4ABFAA',
        particlePreset: {
          variant: 'bubble',
          color: '#CBFFF4',
          count: 3,
          size: [8, 14],
          opacity: [0.24, 0.38],
          travel: { amplitude: 12, duration: 7.2 },
        },
      },
      sadness: {
        emotion: 'sadness',
        label: baseEmotionLabels.sadness,
        description:
          'Форма вытягивается вниз, а цвета становятся прохладнее и мягче.',
        bodyGradient: ['#6FA3FF', '#4E54C8'],
        coreGlow: ['#BED0FF', '#6170D9'],
        auraColor: '#7A87E8',
        auraOpacity: 0.28,
        eyeShape: 'sad',
        mouthShape: 'frown',
        float: { amplitude: 8, duration: 6.6 },
        sway: { amplitude: 5, duration: 5.8 },
        scaleRange: [0.94, 1],
        accentColor: '#5260D3',
        particlePreset: {
          variant: 'drift',
          color: '#DCE3FF',
          count: 3,
          size: [7, 12],
          opacity: [0.2, 0.32],
          travel: { amplitude: 10, duration: 7.6 },
        },
      },
      anger: {
        emotion: 'anger',
        label: baseEmotionLabels.anger,
        description:
          'Контуры становятся острее, а свет переливается рубиновыми всполохами.',
        bodyGradient: ['#FF6B6B', '#C91847'],
        coreGlow: ['#FFD6D6', '#FF5678'],
        auraColor: '#FF8A8A',
        auraOpacity: 0.34,
        eyeShape: 'focused',
        mouthShape: 'determined',
        float: { amplitude: 13, duration: 3.6 },
        sway: { amplitude: 11, duration: 2.6 },
        scaleRange: [1.02, 1.08],
        accentColor: '#FF3B6B',
        particlePreset: {
          variant: 'ember',
          color: '#FF8A8E',
          count: 5,
          size: [4, 8],
          opacity: [0.28, 0.52],
          travel: { amplitude: 16, duration: 2.8 },
        },
      },
      stress: {
        emotion: 'stress',
        label: baseEmotionLabels.stress,
        description:
          'Лумина мерцает нестабильно, будто собирая себя из осколков света.',
        bodyGradient: ['#FF9F68', '#7F53AC'],
        coreGlow: ['#FFE2C7', '#9D74D4'],
        auraColor: '#B08AEB',
        auraOpacity: 0.38,
        eyeShape: 'wide',
        mouthShape: 'open',
        float: { amplitude: 10, duration: 3.8 },
        sway: { amplitude: 12, duration: 4.1 },
        scaleRange: [0.95, 1.05],
        accentColor: '#D980FA',
        particlePreset: {
          variant: 'sparkle',
          color: '#F5D0FF',
          count: 5,
          size: [4, 9],
          opacity: [0.32, 0.56],
          travel: { amplitude: 14, duration: 3.2 },
        },
      },
      anxiety: {
        emotion: 'anxiety',
        label: baseEmotionLabels.anxiety,
        description:
          'Свет становится более тусклым, а хвост оставляет за собой трепещущий след.',
        bodyGradient: ['#7C83FF', '#3A47D5'],
        coreGlow: ['#C9CEFF', '#6A73FF'],
        auraColor: '#9FA6FF',
        auraOpacity: 0.33,
        eyeShape: 'wide',
        mouthShape: 'soft',
        float: { amplitude: 9, duration: 4.8 },
        sway: { amplitude: 13, duration: 4.4 },
        scaleRange: [0.96, 1.03],
        accentColor: '#7F8CFF',
        particlePreset: {
          variant: 'bubble',
          color: '#BDC6FF',
          count: 4,
          size: [5, 10],
          opacity: [0.26, 0.4],
          travel: { amplitude: 13, duration: 4.6 },
        },
      },
      celebration: {
        emotion: 'celebration',
        label: baseEmotionLabels.celebration,
        description:
          'Лумина вспыхивает созвездием, закручиваясь в спираль радости и освещая сад.',
        bodyGradient: ['#FFD700', '#9D4EDD'],
        coreGlow: ['#FFFFFF', '#F8E9FF'],
        auraColor: '#F4C2FF',
        auraOpacity: 0.48,
        eyeShape: 'smile',
        mouthShape: 'open',
        float: { amplitude: 20, duration: 2.8 },
        sway: { amplitude: 16, duration: 2.4 },
        scaleRange: [1.05, 1.16],
        accentColor: '#FF85FF',
        particlePreset: {
          variant: 'sparkle',
          color: '#FFE9FF',
          count: 8,
          size: [6, 11],
          opacity: [0.38, 0.74],
          travel: { amplitude: 22, duration: 2.4 },
        },
        celebrationRarity: [
          RarityLevel.RARE,
          RarityLevel.EPIC,
          RarityLevel.LEGENDARY,
        ],
      },
    },
  },
} as const

export const COMPANION_MOOD_MESSAGES: Readonly<
  Record<MoodType, readonly string[]>
> = {
  joy: [
    'Я чувствую, как сад искрится вместе с тобой! ✨',
    'Так много света сегодня — продолжай делиться радостью!',
    'Твоя улыбка делает лепестки ярче, спасибо!',
  ],
  calm: [
    'Какое умиротворение, можно слушать твой сад вечно.',
    'Давай просто плыть рядом и сохранять этот баланс.',
    'Твой покой похож на мягкий ветерок, оставайся в нём.',
  ],
  sadness: [
    'Я рядом, можем посидеть тихо и дождаться рассвета.',
    'Позволь мне укрыть тебя мягким светом, ты не один.',
    'Грусть — это дождь перед цветением, я сохраню тепло.',
  ],
  stress: [
    'Сделаем глубокий вдох вместе, сад шепчет «не спеши».',
    'Я напоминаю ветру быть добрее к тебе, отдохни чуть-чуть.',
    'Всё получится — шаг за шагом, я свечу рядом.',
  ],
  anger: [
    'Я направлю огонь в силу, а ты вдохни глубже.',
    'Пусть искры гнева превратятся в цветы смелости.',
    'Я рядом, чтобы смягчить вспышки и поддержать тебя.',
  ],
  anxiety: [
    'Возьмём паузу и посмотрим на звёзды вместе.',
    'Я дышу рядом, можем идти медленно-медленно.',
    'Давай найдём тихий уголок сада и просто послушаем его.',
  ],
}

export function getCompanionDefinition(
  companionId: CompanionId
): CompanionDefinition {
  return COMPANION_DEFINITIONS[companionId]
}

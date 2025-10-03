/**
 * Zod Schemas для runtime-валидации API ответов
 *
 * Все API-ответы должны проходить валидацию через эти схемы,
 * чтобы гарантировать типобезопасность в runtime.
 */

import { z } from 'zod'
import { ElementType, RarityLevel, MoodIntensity } from '@/types'

// ============================================
// BASE SCHEMAS - Базовые схемы
// ============================================

export const StandardApiResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.object({
    success: z.boolean(),
    data: z.union([dataSchema, z.undefined()]),
    error: z.union([z.string(), z.undefined()]),
  })

// ============================================
// USER & PROFILE SCHEMAS
// ============================================

export const DatabaseUserSchema = z.object({
  telegram_id: z.number(),
  user_id: z.string(),
  username: z.union([z.string(), z.undefined()]),
  first_name: z.union([z.string(), z.undefined()]),
  last_name: z.union([z.string(), z.undefined()]),
  language_code: z.union([z.string(), z.undefined()]),
  registration_date: z.string(),
  last_visit_date: z.string(),
  is_anonymous: z.boolean(),
  onboarding_completed: z.boolean(),
  notifications_enabled: z.boolean(),
  theme: z.string(),
  total_days: z.number(),
  current_streak: z.number(),
  longest_streak: z.number(),
  total_elements: z.number(),
  rare_elements_found: z.number(),
  gardens_shared: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  photo_url: z.union([z.string(), z.undefined()]),
  share_garden: z.boolean(),
  experience: z.number(),
  level: z.number(),
  privacy_settings: z.record(z.string(), z.boolean()),
})

export const DatabaseUserStatsSchema = z.object({
  totalDays: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  totalElements: z.number(),
  rareElementsFound: z.number(),
  gardensShared: z.number(),
  experience: z.number(),
  level: z.number(),
})

export const DatabaseAchievementSchema = z.object({
  id: z.string(),
  achievement_id: z.string(),
  unlocked_at: z.string(),
  progress: z.number(),
  is_unlocked: z.boolean(),
})

export const ProfileApiGetProfileResponseSchema = z.object({
  user: DatabaseUserSchema,
  stats: DatabaseUserStatsSchema,
  achievements: z.array(DatabaseAchievementSchema),
  newlyUnlocked: z.union([z.array(DatabaseAchievementSchema), z.undefined()]),
})

export const ProfileApiAddExperienceResponseSchema = z.object({
  experience: z.number(),
  level: z.number(),
  leveledUp: z.union([z.boolean(), z.undefined()]),
  message: z.union([z.string(), z.undefined()]),
})

export const ProfileApiUpdatePrivacyResponseSchema = z.object({
  message: z.string(),
  updatedSettings: z.record(z.string(), z.boolean()),
})

// ============================================
// GARDEN SCHEMAS
// ============================================

export const ElementTypeSchema = z.nativeEnum(ElementType)
export const RarityLevelSchema = z.nativeEnum(RarityLevel)

export const DatabaseGardenElementSchema = z.object({
  id: z.string(),
  telegram_id: z.number(),
  element_type: z.string(),
  rarity: z.string(),
  position_x: z.number(),
  position_y: z.number(),
  mood_influence: z.union([z.string(), z.undefined()]),
  unlock_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Mood schema must be defined before it's used
export const DatabaseMoodEntrySchema = z.object({
  id: z.string(),
  telegram_id: z.number(),
  mood: z.string(),
  intensity: z.number(),
  note: z.union([z.string(), z.undefined()]),
  mood_date: z.string(),
  created_at: z.string(),
})

export const GardenApiHistoryResponseSchema = z.object({
  gardenElements: z.array(DatabaseGardenElementSchema),
})

export const GardenApiAddElementResponseSchema = z.object({
  element: DatabaseGardenElementSchema,
})

export const GardenApiSyncResponseSchema = z.object({
  elements: z.array(DatabaseGardenElementSchema),
  newElement: z.union([DatabaseGardenElementSchema, z.undefined()]),
  user: DatabaseUserSchema,
  stats: DatabaseUserStatsSchema,
})

export const GardenApiFriendViewResponseSchema = z.object({
  user: z.object({
    telegram_id: z.number(),
    first_name: z.string(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    photo_url: z.string().optional(),
    level: z.number(),
    registration_date: z.string(),
  }),
  elements: z.array(DatabaseGardenElementSchema),
  stats: z.object({
    totalElements: z.number(),
    rareElementsFound: z.number(),
    currentStreak: z.number(),
    totalDays: z.number(),
  }),
  privacy: z.object({
    shareGarden: z.boolean(),
    showProfile: z.boolean(),
  }),
})

// ============================================
// MOOD SCHEMAS
// ============================================

export const MoodIntensitySchema = z.nativeEnum(MoodIntensity)

export const MoodApiRecordResponseSchema = z.object({
  mood: DatabaseMoodEntrySchema,
})

export const MoodApiHistoryResponseSchema = z.object({
  moodHistory: z.array(DatabaseMoodEntrySchema),
})

export const MoodApiAddResponseSchema = z.object({
  mood: DatabaseMoodEntrySchema,
  isFirstToday: z.boolean(),
  experienceGained: z.union([z.number(), z.undefined()]),
})

export const MoodApiTodayResponseSchema = z.object({
  mood: DatabaseMoodEntrySchema.nullable(),
})

// ============================================
// FRIENDS SCHEMAS
// ============================================

export const FriendApiUserSchema = z.object({
  telegram_id: z.number(),
  first_name: z.string(),
  last_name: z.union([z.string(), z.undefined()]),
  username: z.union([z.string(), z.undefined()]),
  photo_url: z.union([z.string(), z.undefined()]),
  level: z.number(),
  registration_date: z.string(),
  is_online: z.union([z.boolean(), z.undefined()]),
  last_seen: z.union([z.string(), z.undefined()]),
  privacy_settings: z.record(z.string(), z.boolean()),
})

export const FriendApiListResponseSchema = z.object({
  friends: z.array(FriendApiUserSchema),
  pendingRequests: z.array(
    z.object({
      id: z.string(),
      requester: FriendApiUserSchema,
      created_at: z.string(),
    })
  ),
  sentRequests: z.array(
    z.object({
      id: z.string(),
      addressee: FriendApiUserSchema,
      created_at: z.string(),
    })
  ),
})

export const FriendApiSearchResponseSchema = z.object({
  users: z.array(FriendApiUserSchema),
  hasMore: z.boolean(),
  nextPage: z.union([z.number(), z.undefined()]),
})

export const FriendApiSendRequestResponseSchema = z.object({
  message: z.string(),
  requestId: z.string(),
  status: z.enum(['sent', 'already_friends', 'request_exists']),
})

export const FriendApiRespondRequestResponseSchema = z.object({
  message: z.string(),
  status: z.enum(['accepted', 'declined']),
  friendship: z
    .object({
      id: z.string(),
      friend: FriendApiUserSchema,
    })
    .optional(),
})

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Валидирует данные с помощью Zod схемы
 * Возвращает типизированные данные или выбрасывает ошибку
 */
export function validateApiResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')

      throw new Error(
        `API validation failed${context ? ` in ${context}` : ''}: ${errorMessage}`
      )
    }
    throw error
  }
}

/**
 * Безопасная валидация - возвращает undefined при ошибке
 */
export function safeValidateApiResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | undefined {
  const result = schema.safeParse(data)
  return result.success ? result.data : undefined
}

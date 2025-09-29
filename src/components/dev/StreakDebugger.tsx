import { useState, useEffect } from 'react'
import { Bug, RefreshCw, Database, Monitor, Server } from 'lucide-react'
import { Card } from '@/components/ui'
import { useMoodStore, useUserStore } from '@/stores'
import { calculateMoodStats } from '@/utils/moodMapping'
import { formatDate } from '@/utils/dateHelpers'
import type {
  DatabaseMoodEntry,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
} from '@/types/api'

interface StreakDebugInfo {
  frontend: {
    current: number
    longest: number
    algorithm: string
    lastEntry?: Date
    moodCount: number
  }
  backend:
    | {
        current: number | string
        longest: number | string
        algorithm: string
        source: string
      }
    | undefined
  database:
    | {
        current: number | string
        longest: number | string
        source: string
      }
    | undefined
  rawData: {
    moodHistory: readonly any[] // Temporary fix for build
    serverData?: ProfileApiGetProfileResponse
  }
}

export function StreakDebugger() {
  const { moodHistory, loadMoodHistory, syncMoodHistory } = useMoodStore()
  const { currentUser } = useUserStore()
  const [debugInfo, setDebugInfo] = useState<StreakDebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testTelegramId, setTestTelegramId] = useState('')

  const analyzeStreaks = async () => {
    setIsLoading(true)

    try {
      // 1. Frontend calculation
      const frontendStats = calculateMoodStats(moodHistory)
      const lastEntry = moodHistory.length > 0 ? moodHistory[0] : null

      const frontendInfo: StreakDebugInfo['frontend'] = {
        current: frontendStats.currentStreak,
        longest: frontendStats.longestStreak,
        algorithm: 'calculateMoodStats (moodMapping.ts)',
        moodCount: moodHistory.length,
        ...(lastEntry?.date && { lastEntry: lastEntry.date }),
      }

      let backendInfo
      let databaseInfo
      let serverData

      // 🔍 Проверяем dev режим
      const isDev = import.meta.env.DEV
      console.log(`🔍 Development mode: ${isDev}`)

      // 2. Backend calculation (только в продакшн режиме или если указан полный URL)
      const telegramIdToUse = currentUser?.telegramId || testTelegramId
      if (telegramIdToUse && !isDev) {
        try {
          console.log(
            `🔍 Fetching backend stats for telegramId: ${telegramIdToUse}`
          )
          const response = await fetch(
            `/api/profile?action=get_profile&telegramId=${telegramIdToUse}`
          )

          console.log(
            `🔍 Backend response status: ${response.status} ${response.statusText}`
          )

          if (response.ok) {
            const responseText = await response.text()
            console.log(`🔍 Backend response text:`, responseText)

            try {
              const result = JSON.parse(
                responseText
              ) as StandardApiResponse<ProfileApiGetProfileResponse>
              serverData = result.data

              if (result.success && result.data?.stats) {
                backendInfo = {
                  current: result.data.stats.currentStreak || 0,
                  longest: result.data.stats.longestStreak || 0,
                  algorithm: 'calculateUserStats (profile.js)',
                  source: 'API /profile get_profile',
                }
                console.log(`✅ Backend stats parsed:`, backendInfo)
              } else {
                console.warn(
                  `⚠️ Backend API returned unsuccessful result:`,
                  result
                )
              }
            } catch (parseError) {
              console.error(
                `❌ Failed to parse backend response as JSON:`,
                parseError
              )
              console.error(`❌ Response text was:`, responseText)
            }
          } else {
            const errorText = await response.text()
            console.error(`❌ Backend API error ${response.status}:`, errorText)
          }
        } catch (error) {
          console.error('❌ Backend streak fetch failed:', error)
        }

        // 3. Database calculation (через отдельный запрос)
        try {
          console.log(
            `🔍 Fetching mood history for telegramId: ${telegramIdToUse}`
          )
          const historyResponse = await fetch(
            `/api/mood?action=history&telegramId=${telegramIdToUse}`
          )

          console.log(
            `🔍 Mood history response status: ${historyResponse.status} ${historyResponse.statusText}`
          )

          if (historyResponse.ok) {
            const historyResponseText = await historyResponse.text()
            console.log(`🔍 Mood history response text:`, historyResponseText)

            try {
              const historyResult = JSON.parse(historyResponseText)

              if (historyResult.success && historyResult.data.moodHistory) {
                // Вычисляем streak напрямую из БД данных
                const dbMoods = historyResult.data.moodHistory
                console.log(`🔍 Database moods count: ${dbMoods.length}`)
                const dbStreak = calculateDatabaseStreak(dbMoods)

                databaseInfo = {
                  current: dbStreak.current,
                  longest: dbStreak.longest,
                  source: 'Database mood_entries',
                }
                console.log(`✅ Database stats calculated:`, databaseInfo)
              } else {
                console.warn(
                  `⚠️ Mood history API returned unsuccessful result:`,
                  historyResult
                )
              }
            } catch (parseError) {
              console.error(
                `❌ Failed to parse mood history response as JSON:`,
                parseError
              )
              console.error(`❌ Response text was:`, historyResponseText)
            }
          } else {
            const errorText = await historyResponse.text()
            console.error(
              `❌ Mood history API error ${historyResponse.status}:`,
              errorText
            )
          }
        } catch (error) {
          console.error('❌ Database streak fetch failed:', error)
        }
      } else if (telegramIdToUse && isDev) {
        console.log(
          `⚠️ Development mode detected. API endpoints not available locally.`
        )
        console.log(`💡 To test backend/database streaks:`)
        console.log(`   1. Use 'npx vercel dev' for local API emulation`)
        console.log(
          `   2. Or test on production: https://kirakira-theta.vercel.app/streak-debug`
        )

        backendInfo = {
          current: -1, // Используем -1 как индикатор недоступности
          longest: -1,
          algorithm: 'Не доступно в dev режиме',
          source: 'Используйте vercel dev или продакшн',
        }
        databaseInfo = {
          current: -1,
          longest: -1,
          source: 'Используйте vercel dev или продакшн',
        }
      }

      setDebugInfo({
        frontend: frontendInfo,
        backend: backendInfo,
        database: databaseInfo,
        rawData: {
          moodHistory: moodHistory as any,
          serverData: serverData as any,
        },
      })
    } catch (error) {
      console.error('Streak analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Вычисляем streak из данных БД (копия логики из user.js)
  const calculateDatabaseStreak = (moods: DatabaseMoodEntry[]) => {
    if (!moods || moods.length === 0) {
      return { current: 0, longest: 0 }
    }

    const sortedMoods = moods.sort(
      (a, b) =>
        new Date(b.mood_date).getTime() - new Date(a.mood_date).getTime()
    )

    let currentStreak = 0
    let longestStreak = 0

    // Проверяем текущий streak
    const today = new Date()
    for (let i = 0; i < sortedMoods.length; i++) {
      const mood = sortedMoods[i]
      if (!mood) continue
      const moodDate = new Date(mood.mood_date)
      const daysDiff = Math.floor(
        (today.getTime() - moodDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === i) {
        currentStreak++
      } else {
        break
      }
    }

    // Вычисляем самый длинный streak
    let tempStreak = 1
    for (let i = 1; i < sortedMoods.length; i++) {
      const prevMood = sortedMoods[i - 1]
      const currentMood = sortedMoods[i]
      if (!prevMood || !currentMood) continue
      const prevDate = new Date(prevMood.mood_date)
      const currentDate = new Date(currentMood.mood_date)
      const daysDiff = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return { current: currentStreak, longest: longestStreak }
  }

  const handleRefresh = async () => {
    loadMoodHistory()
    await syncMoodHistory(true)
    await analyzeStreaks()
  }

  useEffect(() => {
    analyzeStreaks()
  }, [moodHistory])

  if (!debugInfo) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <h3 className="mb-2 text-lg font-semibold">Анализ стриков</h3>
          <button
            onClick={analyzeStreaks}
            disabled={isLoading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            {isLoading ? 'Анализ...' : 'Начать анализ'}
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bug className="h-6 w-6 text-red-500" />
            <div>
              <h2 className="text-lg font-semibold">Отладка стриков</h2>
              <p className="text-sm text-gray-600">
                Сравнение алгоритмов подсчета стриков
                {currentUser?.telegramId && (
                  <span className="ml-2 font-medium text-green-600">
                    (Telegram ID: {currentUser.telegramId})
                  </span>
                )}
                {!currentUser?.telegramId && testTelegramId && (
                  <span className="ml-2 font-medium text-blue-600">
                    (Тест ID: {testTelegramId})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Обновить</span>
          </button>
        </div>

        {/* Dev Mode Warning */}
        {import.meta.env.DEV && (
          <div className="mt-4 border-t pt-4">
            <div className="rounded bg-yellow-50 p-3">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm font-medium text-yellow-800">
                  Development Mode
                </span>
              </div>
              <p className="mt-1 text-xs text-yellow-700">
                Backend/Database тестирование недоступно в dev режиме.
                <br />
                Используйте{' '}
                <code className="rounded bg-yellow-100 px-1">
                  npx vercel dev
                </code>{' '}
                или тестируйте на{' '}
                <a
                  href="https://kirakira-theta.vercel.app/streak-debug"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  продакшне
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {/* Test TelegramID Input для тестирования в браузере */}
        {!currentUser?.telegramId && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">
                Тестовый Telegram ID (для браузера):
              </label>
              <input
                type="text"
                value={testTelegramId}
                onChange={e => setTestTelegramId(e.target.value)}
                placeholder="например: 123456789"
                className="rounded border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={analyzeStreaks}
                disabled={!testTelegramId || isLoading}
                className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600 disabled:opacity-50"
              >
                Тестировать
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              💡 Введите реальный Telegram ID пользователя для тестирования
              backend данных
            </p>
          </div>
        )}
      </Card>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Frontend */}
        <Card className="p-4">
          <div className="mb-3 flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-blue-700">Frontend</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Текущий:</span>
              <span className="font-semibold">
                {debugInfo.frontend.current}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Лучший:</span>
              <span className="font-semibold">
                {debugInfo.frontend.longest}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>Алгоритм: {debugInfo.frontend.algorithm}</p>
              <p>Записей: {debugInfo.frontend.moodCount}</p>
              {debugInfo.frontend.lastEntry && (
                <p>
                  Последняя:{' '}
                  {formatDate(debugInfo.frontend.lastEntry, 'dd.MM.yyyy')}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Backend */}
        <Card className="p-4">
          <div className="mb-3 flex items-center space-x-2">
            <Server className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-green-700">Backend</h3>
          </div>
          {debugInfo.backend ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Текущий:</span>
                <span className="font-semibold">
                  {debugInfo.backend.current === -1
                    ? 'N/A'
                    : debugInfo.backend.current}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Лучший:</span>
                <span className="font-semibold">
                  {debugInfo.backend.longest === -1
                    ? 'N/A'
                    : debugInfo.backend.longest}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>Источник: {debugInfo.backend.source}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p>Нет данных с сервера</p>
              {!currentUser?.telegramId && !testTelegramId ? (
                <p>Введите тестовый Telegram ID выше</p>
              ) : (
                <p>Требуется авторизация</p>
              )}
            </div>
          )}
        </Card>

        {/* Database */}
        <Card className="p-4">
          <div className="mb-3 flex items-center space-x-2">
            <Database className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-purple-700">Database</h3>
          </div>
          {debugInfo.database ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Текущий:</span>
                <span className="font-semibold">
                  {debugInfo.database.current === -1
                    ? 'N/A'
                    : debugInfo.database.current}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Лучший:</span>
                <span className="font-semibold">
                  {debugInfo.database.longest === -1
                    ? 'N/A'
                    : debugInfo.database.longest}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>Источник: {debugInfo.database.source}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p>Нет данных из БД</p>
              {!currentUser?.telegramId && !testTelegramId ? (
                <p>Введите тестовый Telegram ID выше</p>
              ) : (
                <p>Проверьте подключение к базе</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Issues Detection */}
      {debugInfo.frontend && debugInfo.backend && (
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-red-700">
            Обнаруженные проблемы
          </h3>
          <div className="space-y-2">
            {debugInfo.frontend.current !== debugInfo.backend.current && (
              <div className="rounded bg-red-50 p-3 text-sm">
                <p className="font-medium text-red-800">
                  ❌ Разные текущие стрики:
                </p>
                <p className="text-red-700">
                  Frontend: {debugInfo.frontend.current}, Backend:{' '}
                  {debugInfo.backend.current}
                </p>
              </div>
            )}
            {debugInfo.frontend.longest !== debugInfo.backend.longest && (
              <div className="rounded bg-yellow-50 p-3 text-sm">
                <p className="font-medium text-yellow-800">
                  ⚠️ Разные лучшие стрики:
                </p>
                <p className="text-yellow-700">
                  Frontend: {debugInfo.frontend.longest}, Backend:{' '}
                  {debugInfo.backend.longest}
                </p>
              </div>
            )}
            {debugInfo.frontend.current === debugInfo.backend?.current &&
              debugInfo.frontend.longest === debugInfo.backend?.longest && (
                <div className="rounded bg-green-50 p-3 text-sm">
                  <p className="font-medium text-green-800">
                    ✅ Стрики синхронизированы корректно
                  </p>
                </div>
              )}
          </div>
        </Card>
      )}

      {/* Raw Data */}
      <details className="rounded border p-4">
        <summary className="cursor-pointer font-semibold">Сырые данные</summary>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-medium">
              История настроений (последние 7 дней):
            </h4>
            <pre className="mt-2 rounded bg-gray-100 p-2 text-xs">
              {JSON.stringify(
                debugInfo.rawData.moodHistory.slice(0, 7).map(mood => ({
                  date: formatDate(new Date(mood.mood_date), 'dd.MM.yyyy'),
                  mood: mood.mood,
                  intensity: mood.intensity,
                })),
                null,
                2
              )}
            </pre>
          </div>

          {debugInfo.rawData.serverData && (
            <div>
              <h4 className="font-medium">Данные с сервера:</h4>
              <pre className="mt-2 rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(debugInfo.rawData.serverData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

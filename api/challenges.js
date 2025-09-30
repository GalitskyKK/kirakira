/**
 * API для системы челленджей KiraKira
 * Поддерживает создание, участие, лидерборды и обновление прогресса
 */

import { createClient } from '@supabase/supabase-js'

// Инициализация Supabase клиента
async function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// ===============================================
// 📋 ACTION: LIST - Получение списка челленджей
// ===============================================
async function handleList(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, type = 'active' } = req.query

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    const supabase = await getSupabaseClient()
    console.log('🔗 Supabase client created successfully')

    // Получаем активные челленджи
    console.log('📞 Calling get_active_challenges() function...')
    const { data: challenges, error: challengesError } = await supabase.rpc(
      'get_active_challenges'
    )

    console.log('📦 Challenges response:', {
      challengesCount: challenges?.length || 0,
      challengesError,
      challengesData: challenges,
    })

    if (challenges && challenges.length > 0) {
      console.log('✅ SQL function works! Challenges with participant counts:')
      challenges.forEach(challenge => {
        console.log(
          `   ${challenge.title}: ${challenge.participant_count} participants`
        )
      })
    }

    if (challengesError || !challenges || challenges.length === 0) {
      console.error('❌ Challenges fetch error or no data:', challengesError)

      // Fallback: пробуем прямой запрос к таблице
      console.log('🔄 Trying direct table query as fallback...')
      const { data: fallbackChallenges, error: fallbackError } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())

      console.log('📦 Fallback response:', {
        fallbackChallenges,
        fallbackError,
      })

      if (fallbackError) {
        return res.status(500).json({
          success: false,
          error: 'Ошибка при получении списка челленджей',
        })
      }

      // Получаем количество участников для каждого челленджа
      const challengesWithCounts = await Promise.all(
        (fallbackChallenges || []).map(async challenge => {
          const { count } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id)
            .in('status', ['joined', 'active', 'completed'])

          return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            emoji: challenge.emoji,
            category: challenge.category,
            type: challenge.type,
            status: challenge.status,
            startDate: new Date(challenge.start_date).toISOString(),
            endDate: new Date(challenge.end_date).toISOString(),
            maxParticipants: challenge.max_participants,
            requirements: challenge.requirements,
            rewards: challenge.rewards,
            createdBy: challenge.created_by || null,
            createdAt: new Date(challenge.created_at).toISOString(),
            updatedAt: new Date(challenge.updated_at).toISOString(),
            participant_count: count || 0,
          }
        })
      )

      const formattedChallenges = challengesWithCounts

      console.log('✅ Using fallback challenges:', formattedChallenges.length)

      return res.status(200).json({
        success: true,
        data: {
          challenges: formattedChallenges,
          userParticipations: [],
        },
      })
    }

    // ✅ SQL функция работает - используем результаты
    console.log('🎉 Using SQL function results - no fallback needed!')
    console.log('📊 Challenges from SQL function:')
    challenges.forEach(challenge => {
      console.log(
        `   ${challenge.title}: ${challenge.participant_count} participants`
      )
    })

    // Получаем участие пользователя в челленджах
    const { data: participations, error: participationsError } = await supabase
      .from('challenge_participants')
      .select(
        `
        id,
        challenge_id,
        status,
        joined_at,
        current_progress,
        max_progress,
        last_update_at,
        completed_at
      `
      )
      .eq('telegram_id', parseInt(telegramId))
      .in('status', ['joined', 'active', 'completed'])

    if (participationsError) {
      console.error('Participations fetch error:', participationsError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка при получении данных об участии',
      })
    }

    // Преобразуем данные в нужный формат
    const formattedChallenges = challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      emoji: challenge.emoji,
      category: challenge.category,
      type: challenge.type,
      status: 'active',
      startDate: new Date(challenge.start_date).toISOString(),
      endDate: new Date(challenge.end_date).toISOString(),
      maxParticipants: challenge.max_participants,
      requirements: challenge.requirements,
      rewards: challenge.rewards,
      createdBy: null, // SQL функция не возвращает created_by
      participant_count: parseInt(challenge.participant_count) || 0,
      createdAt: new Date(challenge.start_date).toISOString(),
      updatedAt: new Date(challenge.start_date).toISOString(),
    }))

    const formattedParticipations = participations.map(p => ({
      id: p.id,
      challengeId: p.challenge_id,
      telegramId: parseInt(telegramId),
      status: p.status,
      joinedAt: new Date(p.joined_at).toISOString(),
      currentProgress: p.current_progress,
      maxProgress: p.max_progress,
      lastUpdateAt: new Date(p.last_update_at).toISOString(),
      completedAt: p.completed_at
        ? new Date(p.completed_at).toISOString()
        : undefined,
    }))

    console.log('📤 Sending response with:')
    console.log(`   Challenges: ${formattedChallenges.length}`)
    console.log(`   Participations: ${formattedParticipations.length}`)
    formattedChallenges.forEach(challenge => {
      console.log(
        `   📊 ${challenge.title}: ${challenge.participant_count} participants`
      )
    })

    res.status(200).json({
      success: true,
      data: {
        challenges: formattedChallenges,
        userParticipations: formattedParticipations,
      },
    })
  } catch (error) {
    console.error('Challenges list error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 🎯 ACTION: DETAILS - Детали челленджа и лидерборд
// ===============================================
async function handleDetails(req, res) {
  console.log('🔥 DETAILS API CALLED! Method:', req.method)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { challengeId, telegramId } = req.query
    console.log('🔥 DETAILS PARAMS:', { challengeId, telegramId })

    if (!challengeId || !telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: challengeId, telegramId',
      })
    }

    const supabase = await getSupabaseClient()

    // Получаем детали челленджа
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return res.status(404).json({
        success: false,
        error: 'Челлендж не найден',
      })
    }

    // Получаем участие пользователя
    const { data: participation, error: participationError } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('telegram_id', parseInt(telegramId))
      .single()

    // Ошибка участия не критична - пользователь может не участвовать

    // Получаем лидерборд
    const { data: leaderboard, error: leaderboardError } = await supabase.rpc(
      'get_challenge_leaderboard',
      { challenge_uuid: challengeId }
    )

    console.log('🎯 LEADERBOARD FROM SQL:', leaderboard)

    if (leaderboardError) {
      console.error('Leaderboard fetch error:', leaderboardError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка при получении лидерборда',
      })
    }

    // Получаем количество участников
    const { count: participantCount } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .in('status', ['joined', 'active', 'completed'])

    // Рассчитываем прогресс пользователя
    const progress = participation
      ? calculateChallengeProgress(challenge, participation)
      : null

    // Форматируем ответ
    const formattedChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      emoji: challenge.emoji,
      category: challenge.category,
      type: challenge.type,
      status: challenge.status,
      startDate: new Date(challenge.start_date).toISOString(),
      endDate: new Date(challenge.end_date).toISOString(),
      maxParticipants: challenge.max_participants,
      requirements: challenge.requirements,
      rewards: challenge.rewards,
      createdBy: challenge.created_by || null,
      createdAt: new Date(challenge.created_at).toISOString(),
      updatedAt: new Date(challenge.updated_at).toISOString(),
      participant_count: participantCount || 0,
    }

    const formattedParticipation = participation
      ? {
          id: participation.id,
          challengeId: participation.challenge_id,
          telegramId: participation.telegram_id,
          status: participation.status,
          joinedAt: new Date(participation.joined_at).toISOString(),
          currentProgress: participation.current_progress,
          maxProgress: participation.max_progress,
          lastUpdateAt: new Date(participation.last_update_at).toISOString(),
          completedAt: participation.completed_at
            ? new Date(participation.completed_at).toISOString()
            : undefined,
        }
      : undefined

    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      participant: {
        id: entry.participant_id,
        challengeId: challengeId,
        telegramId: entry.telegram_id,
        status: participation?.status || 'joined',
        joinedAt: participation?.joined_at || new Date().toISOString(),
        currentProgress: entry.current_progress,
        maxProgress: entry.max_progress,
        lastUpdateAt: participation?.last_update_at || new Date().toISOString(),
        completedAt: entry.completed_at
          ? new Date(entry.completed_at).toISOString()
          : undefined,
      },
      user: {
        telegramId: entry.telegram_id,
        firstName: entry.first_name || 'Пользователь',
        lastName: entry.last_name,
        username: entry.username,
        photoUrl: entry.photo_url,
        level: entry.level || 1,
      },
      progress: entry.current_progress,
      progressPercentage: parseFloat(entry.progress_percentage),
      rank: parseInt(entry.rank),
      isCurrentUser: entry.telegram_id === parseInt(telegramId),
    }))

    res.status(200).json({
      success: true,
      data: {
        challenge: formattedChallenge,
        participation: formattedParticipation,
        leaderboard: formattedLeaderboard,
        progress,
      },
    })
  } catch (error) {
    console.error('Challenge details error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// ➕ ACTION: JOIN - Присоединение к челленджу
// ===============================================
async function handleJoin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { challengeId, telegramId } = req.body

    if (!challengeId || !telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: challengeId, telegramId',
      })
    }

    const supabase = await getSupabaseClient()

    // Проверяем существование челленджа
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('status', 'active')
      .single()

    if (challengeError || !challenge) {
      return res.status(404).json({
        success: false,
        error: 'Активный челлендж не найден',
      })
    }

    // Проверяем лимит участников
    if (challenge.max_participants) {
      const { count, error: countError } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId)
        .neq('status', 'dropped')

      if (countError) {
        console.error('Participant count error:', countError)
        return res.status(500).json({
          success: false,
          error: 'Ошибка проверки количества участников',
        })
      }

      if (count >= challenge.max_participants) {
        return res.status(400).json({
          success: false,
          error: 'Достигнут лимит участников',
        })
      }
    }

    // Проверяем существующее участие
    const { data: existingParticipation, error: existingError } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('telegram_id', parseInt(telegramId))
      .single()

    if (existingParticipation && existingParticipation.status !== 'dropped') {
      return res.status(400).json({
        success: false,
        error: 'Вы уже участвуете в этом челлендже',
      })
    }

    // Получаем текущую статистику пользователя для инициализации прогресса
    const initialProgress = await calculateInitialProgress(
      supabase,
      challengeId,
      parseInt(telegramId)
    )

    // Создаем или обновляем участие
    const participationData = {
      challenge_id: challengeId,
      telegram_id: parseInt(telegramId),
      status: 'joined',
      current_progress: initialProgress.current,
      max_progress: initialProgress.max,
      joined_at: new Date().toISOString(),
      last_update_at: new Date().toISOString(),
    }

    let participation
    if (existingParticipation) {
      // Обновляем существующее участие
      const { data, error } = await supabase
        .from('challenge_participants')
        .update(participationData)
        .eq('id', existingParticipation.id)
        .select()
        .single()

      if (error) {
        console.error('Participation update error:', error)
        return res.status(500).json({
          success: false,
          error: 'Ошибка обновления участия',
        })
      }
      participation = data
    } else {
      // Создаем новое участие
      const { data, error } = await supabase
        .from('challenge_participants')
        .insert(participationData)
        .select()
        .single()

      if (error) {
        console.error('Participation insert error:', error)
        return res.status(500).json({
          success: false,
          error: 'Ошибка создания участия',
        })
      }
      participation = data
    }

    const formattedParticipation = {
      id: participation.id,
      challengeId: participation.challenge_id,
      telegramId: participation.telegram_id,
      status: participation.status,
      joinedAt: new Date(participation.joined_at).toISOString(),
      currentProgress: participation.current_progress,
      maxProgress: participation.max_progress,
      lastUpdateAt: new Date(participation.last_update_at).toISOString(),
    }

    const formattedChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      emoji: challenge.emoji,
      category: challenge.category,
      type: challenge.type,
      status: challenge.status,
      startDate: new Date(challenge.start_date).toISOString(),
      endDate: new Date(challenge.end_date).toISOString(),
      maxParticipants: challenge.max_participants,
      requirements: challenge.requirements,
      rewards: challenge.rewards,
      createdBy: challenge.created_by || null,
      createdAt: new Date(challenge.created_at).toISOString(),
      updatedAt: new Date(challenge.updated_at).toISOString(),
    }

    res.status(200).json({
      success: true,
      data: {
        participation: formattedParticipation,
        challenge: formattedChallenge,
      },
    })
  } catch (error) {
    console.error('Join challenge error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 📊 ACTION: UPDATE-PROGRESS - Обновление прогресса
// ===============================================
async function handleUpdateProgress(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { challengeId, telegramId, metric, value } = req.body

    console.log(
      `🔄 UPDATE_PROGRESS: challengeId=${challengeId}, telegramId=${telegramId}, metric=${metric}, value=${value}`
    )

    if (!challengeId || !telegramId || !metric || value === undefined) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: challengeId, telegramId, metric, value',
      })
    }

    const supabase = await getSupabaseClient()

    // Получаем участие пользователя
    const { data: participation, error: participationError } = await supabase
      .from('challenge_participants')
      .select(
        `
        id,
        current_progress,
        max_progress,
        challenges (
          id,
          requirements,
          start_date,
          end_date,
          status
        )
      `
      )
      .eq('challenge_id', challengeId)
      .eq('telegram_id', parseInt(telegramId))
      .neq('status', 'dropped')
      .single()

    if (participationError || !participation) {
      console.log(
        `❌ Participation not found: ${participationError?.message || 'No participation'}`
      )
      return res.status(404).json({
        success: false,
        error: 'Участие в челлендже не найдено',
      })
    }

    console.log(`👤 Current participation:`, {
      id: participation.id,
      currentProgress: participation.current_progress,
      maxProgress: participation.max_progress,
      newValue: value,
      difference: parseInt(value) - participation.current_progress,
    })

    const challenge = participation.challenges
    if (!challenge || challenge.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Челлендж не активен',
      })
    }

    // Проверяем что челлендж еще идет
    const now = new Date()
    const startDate = new Date(challenge.start_date)
    const endDate = new Date(challenge.end_date)

    if (now < startDate || now > endDate) {
      return res.status(400).json({
        success: false,
        error: 'Челлендж не в активном периоде',
      })
    }

    // Проверяем, не пытаемся ли мы уменьшить прогресс
    const newValue = parseInt(value)
    if (newValue < participation.current_progress) {
      console.log(
        `⚠️ Preventing progress decrease: ${participation.current_progress} → ${newValue}`
      )
      return res.status(400).json({
        success: false,
        error: `Прогресс не может быть уменьшен с ${participation.current_progress} до ${newValue}`,
      })
    }

    console.log(
      `📊 Updating progress: ${participation.current_progress} → ${newValue}`
    )

    // Обновляем прогресс через функцию БД
    const { error: updateError } = await supabase.rpc(
      'update_challenge_progress',
      {
        participant_uuid: participation.id,
        new_progress: newValue,
        new_max_progress: Math.max(participation.max_progress, newValue),
      }
    )

    if (updateError) {
      console.error('Progress update error:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка обновления прогресса',
      })
    }

    // Получаем обновленные данные
    const { data: updatedParticipation, error: fetchError } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('id', participation.id)
      .single()

    if (fetchError) {
      console.error('Updated participation fetch error:', fetchError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка получения обновленных данных',
      })
    }

    // Получаем обновленный лидерборд
    const { data: leaderboard, error: leaderboardError } = await supabase.rpc(
      'get_challenge_leaderboard',
      { challenge_uuid: challengeId }
    )

    const formattedLeaderboard = leaderboard
      ? leaderboard.map((entry, index) => ({
          participant: {
            id: entry.participant_id,
            challengeId: challengeId,
            telegramId: entry.telegram_id,
            status: entry.status || 'active',
            joinedAt: new Date().toISOString(),
            currentProgress: entry.current_progress,
            maxProgress: entry.max_progress,
            lastUpdateAt: new Date().toISOString(),
            completedAt: entry.completed_at
              ? new Date(entry.completed_at).toISOString()
              : undefined,
          },
          user: {
            telegramId: entry.telegram_id,
            firstName: entry.first_name || 'Пользователь',
            lastName: entry.last_name,
            username: entry.username,
            photoUrl: entry.photo_url,
            level: entry.level || 1,
          },
          progress: entry.current_progress,
          progressPercentage: parseFloat(entry.progress_percentage || 0),
          rank: parseInt(entry.rank),
          isCurrentUser: entry.telegram_id === parseInt(telegramId),
        }))
      : []

    const progress = calculateChallengeProgress(challenge, updatedParticipation)

    // Проверяем, завершил ли пользователь челлендж и начисляем опыт
    let newAchievements = []
    if (
      updatedParticipation.status === 'completed' &&
      participation.status !== 'completed'
    ) {
      console.log(
        `🎉 User ${telegramId} completed challenge: ${challenge.title}`
      )

      // Начисляем опыт за завершение челленджа
      const experienceReward = challenge.rewards.experience || 0
      if (experienceReward > 0) {
        await awardExperience(
          supabase,
          parseInt(telegramId),
          experienceReward,
          {
            source: 'challenge_completion',
            challengeId: challengeId,
            challengeTitle: challenge.title,
          }
        )
        console.log(
          `💰 Awarded ${experienceReward} experience to user ${telegramId}`
        )
      }

      // Проверяем специальные награды
      if (
        challenge.rewards.achievements &&
        challenge.rewards.achievements.length > 0
      ) {
        newAchievements = challenge.rewards.achievements
        console.log(`🏆 Awarded achievements: ${newAchievements.join(', ')}`)
      }
    }

    res.status(200).json({
      success: true,
      data: {
        progress,
        leaderboard: formattedLeaderboard,
        newAchievements,
      },
    })
  } catch (error) {
    console.error('Update progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===============================================

/**
 * Рассчитывает начальный прогресс пользователя для челленджа
 */
async function calculateInitialProgress(supabase, challengeId, telegramId) {
  try {
    // Получаем детали челленджа
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('requirements, start_date')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return { current: 0, max: 0 }
    }

    const requirements = challenge.requirements
    const metric = requirements.metric
    const startDate = new Date(challenge.start_date)

    let current = 0

    switch (metric) {
      case 'garden_elements_count':
        // Считаем элементы сада, добавленные после начала челленджа
        const { count: gardenCount } = await supabase
          .from('garden_elements')
          .select('*', { count: 'exact', head: true })
          .eq('telegram_id', telegramId)
          .gte('unlock_date', startDate.toISOString())

        current = gardenCount || 0
        break

      case 'mood_entries_count':
        // Считаем записи настроения после начала челленджа
        const { count: moodCount } = await supabase
          .from('mood_entries')
          .select('*', { count: 'exact', head: true })
          .eq('telegram_id', telegramId)
          .gte('created_at', startDate.toISOString())

        current = moodCount || 0
        break

      case 'rare_elements_count':
        // Считаем редкие элементы после начала челленджа
        const { count: rareCount } = await supabase
          .from('garden_elements')
          .select('*', { count: 'exact', head: true })
          .eq('telegram_id', telegramId)
          .gte('unlock_date', startDate.toISOString())
          .in('rarity', ['rare', 'epic', 'legendary'])

        current = rareCount || 0
        break

      default:
        current = 0
    }

    return { current, max: Math.max(current, 0) }
  } catch (error) {
    console.error('Calculate initial progress error:', error)
    return { current: 0, max: 0 }
  }
}

/**
 * Рассчитывает детальный прогресс челленджа
 */
function calculateChallengeProgress(challenge, participation) {
  const now = new Date()
  const endDate = new Date(challenge.end_date)
  const timeRemaining = Math.max(0, endDate.getTime() - now.getTime())

  const requirements = challenge.requirements
  const targetValue = requirements.targetValue || 1

  const progressPercentage =
    participation.current_progress >= targetValue
      ? 100
      : Math.floor((participation.current_progress / targetValue) * 100)

  return {
    challengeId: challenge.id,
    telegramId: participation.telegram_id,
    progress: participation.current_progress,
    progressPercentage,
    isCompleted: participation.status === 'completed',
    timeRemaining,
    dailyProgress: [], // TODO: Реализовать получение ежедневного прогресса
  }
}

/**
 * Начисляет опыт пользователю за выполнение челленджа
 */
async function awardExperience(
  supabase,
  telegramId,
  experienceAmount,
  metadata = {}
) {
  try {
    console.log(
      `💰 Awarding ${experienceAmount} experience to user ${telegramId}`
    )

    // Получаем текущий опыт пользователя
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('experience, level')
      .eq('telegram_id', telegramId)
      .single()

    if (userError) {
      console.error('Error fetching user for experience award:', userError)
      return false
    }

    const currentExperience = currentUser.experience || 0
    const currentLevel = currentUser.level || 1
    const newExperience = currentExperience + experienceAmount

    // Простая формула для уровня: level = floor(experience / 1000) + 1
    const newLevel = Math.floor(newExperience / 1000) + 1
    const leveledUp = newLevel > currentLevel

    // Обновляем опыт и уровень пользователя
    const { error: updateError } = await supabase
      .from('users')
      .update({
        experience: newExperience,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramId)

    if (updateError) {
      console.error('Error updating user experience:', updateError)
      return false
    }

    // Логируем результат
    if (leveledUp) {
      console.log(
        `🎉 User ${telegramId} leveled up! ${currentLevel} → ${newLevel}`
      )
    }

    console.log(
      `✅ Experience awarded: ${currentExperience} + ${experienceAmount} = ${newExperience}`
    )

    // TODO: Можно добавить запись в таблицу experience_log для истории
    return {
      success: true,
      oldExperience: currentExperience,
      newExperience,
      oldLevel: currentLevel,
      newLevel,
      leveledUp,
      metadata,
    }
  } catch (error) {
    console.error('Award experience error:', error)
    return false
  }
}

// ===============================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ===============================================
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action } = req.query
    console.log(
      '🔥 CHALLENGES API MAIN HANDLER! Action:',
      action,
      'Method:',
      req.method
    )

    switch (action) {
      case 'list':
        return await handleList(req, res)
      case 'details':
        return await handleDetails(req, res)
      case 'join':
        return await handleJoin(req, res)
      case 'update_progress':
        return await handleUpdateProgress(req, res)
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
        })
    }
  } catch (error) {
    console.error('Challenges API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

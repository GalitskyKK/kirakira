/**
 * API для системы челленджей KiraKira
 * Поддерживает создание, участие, лидерборды и обновление прогресса
 */

import { createClient } from '@supabase/supabase-js'

// 🔒 Инициализация Supabase клиента с JWT (RLS-защищенный)
async function getSupabaseClient(jwt = null) {
  const supabaseUrl = process.env.SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL not configured')
  }

  // ✅ ПРИОРИТЕТ: Используем JWT для RLS-защищенных запросов
  if (jwt) {
    try {
      const { createAuthenticatedSupabaseClient } = await import('./_jwt.js')
      console.log('✅ Using JWT-authenticated Supabase client (RLS enabled)')
      return await createAuthenticatedSupabaseClient(jwt)
    } catch (error) {
      console.error('❌ Failed to create JWT client:', error)
      // Fallback на ANON_KEY ниже
    }
  }

  // ⚠️ FALLBACK: ANON_KEY (для challenges - публичные данные)
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  if (!supabaseKey) {
    throw new Error('SUPABASE_ANON_KEY not configured')
  }

  console.log('⚠️ Using ANON_KEY for challenges (public data)')
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Получаем активные челленджи (прямой запрос вместо RPC)
    console.log('📞 Fetching active challenges directly...')
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .in('status', ['active', 'draft'])

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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

    // Получаем лидерборд (с принудительным обновлением)
    console.log('🔄 FORCING FRESH DB CONNECTION...')

    // Принудительно создаем новое подключение
    const freshSupabase = await getSupabaseClient()

    const { data: leaderboard, error: leaderboardError } =
      await freshSupabase.rpc('get_challenge_leaderboard_v3', {
        challenge_uuid: challengeId,
      })

    console.log('🎯 LEADERBOARD FROM SQL (FRESH):', leaderboard)

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

    const formattedLeaderboard = leaderboard.map((entry, index) => {
      console.log(`🔍 RAW ENTRY ${index}:`, {
        telegram_id: entry.telegram_id,
        first_name: entry.first_name,
        first_name_type: typeof entry.first_name,
        first_name_length: entry.first_name
          ? entry.first_name.length
          : 'null/undefined',
        username: entry.username,
        username_type: typeof entry.username,
        level: entry.level,
        level_type: typeof entry.level,
        is_first_name_truthy: !!entry.first_name,
        is_level_truthy: !!entry.level,
      })

      return {
        participant: {
          id: entry.participant_id,
          challengeId: challengeId,
          telegramId: entry.telegram_id,
          status: participation?.status || 'joined',
          joinedAt: participation?.joined_at || new Date().toISOString(),
          currentProgress: entry.current_progress,
          maxProgress: entry.max_progress,
          lastUpdateAt:
            participation?.last_update_at || new Date().toISOString(),
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
      }
    })

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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

    // Обновляем прогресс через улучшенную функцию БД
    const { data: updateResult, error: updateError } = await supabase.rpc(
      'update_challenge_progress_v2',
      {
        p_participant_id: participation.id,
        p_new_progress: newValue,
        p_new_max_progress: Math.max(participation.max_progress, newValue),
      }
    )

    if (updateError) {
      console.error('Progress update error:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка обновления прогресса',
      })
    }

    // Проверяем результат обновления
    if (!updateResult?.success) {
      console.error('Progress update failed:', updateResult?.error)
      return res.status(400).json({
        success: false,
        error: updateResult?.error || 'Ошибка обновления прогресса',
      })
    }

    // Если челлендж выполнен, начисляем награды
    if (updateResult.is_completed && updateResult.rewards?.success) {
      console.log('🎉 Challenge completed! Rewards:', updateResult.rewards)
    }

    // Используем данные из результата обновления
    const updatedParticipation = updateResult.participant

    // Получаем обновленный лидерборд
    const { data: leaderboard, error: leaderboardError } = await supabase.rpc(
      'get_challenge_leaderboard_v3',
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
// 🔧 CHALLENGE MAINTENANCE
// ===============================================

/**
 * Завершение истекших челленджей и начисление наград
 */
async function handleCompleteExpiredChallenges(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Вызываем функцию завершения челленджей
    const { data: result, error: completeError } = await supabase.rpc(
      'complete_expired_challenges'
    )

    if (completeError) {
      console.error('Complete expired challenges error:', completeError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка завершения челленджей',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Expired challenges completed successfully',
        result,
      },
    })
  } catch (error) {
    console.error('Complete expired challenges error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// 🎯 DAILY QUESTS HANDLERS
// ===============================================

/**
 * Получение ежедневных заданий пользователя
 */
async function handleDailyQuests(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId } = req.query

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: telegramId',
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Очищаем истекшие квесты и auto-claim награды
    const { data: cleanupResult } = await supabase.rpc(
      'cleanup_expired_daily_quests',
      {
        p_telegram_id: parseInt(telegramId),
      }
    )

    // Получаем текущие квесты
    const { data: quests, error: questsError } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('telegram_id', parseInt(telegramId))
      .gte('generated_at', new Date().toISOString().split('T')[0]) // Сегодняшние квесты
      .order('generated_at', { ascending: true })

    if (questsError) {
      console.error('Daily quests fetch error:', questsError)
      return res.status(500).json({
        success: false,
        error: 'Ошибка при получении ежедневных заданий',
      })
    }

    // Если нет квестов на сегодня, генерируем новые
    if (!quests || quests.length === 0) {
      console.log('🎯 No quests for today, generating new ones...')

      // Получаем уровень пользователя
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('level')
        .eq('telegram_id', parseInt(telegramId))
        .single()

      if (userError) {
        console.error('User fetch error:', userError)
        return res.status(500).json({
          success: false,
          error: 'Ошибка при получении данных пользователя',
        })
      }

      const userLevel = user?.level || 1

      // Генерируем новые квесты
      const { data: newQuests, error: generateError } = await supabase.rpc(
        'generate_daily_quests',
        {
          p_telegram_id: parseInt(telegramId),
          p_user_level: userLevel,
        }
      )

      if (generateError) {
        console.error('Quest generation error:', generateError)
        return res.status(500).json({
          success: false,
          error: 'Ошибка при генерации заданий',
        })
      }

      // Форматируем новые квесты
      const formattedQuests = (newQuests || []).map(quest => ({
        id: quest.id,
        telegramId: quest.telegram_id,
        questType: quest.quest_type,
        questCategory: quest.quest_category,
        targetValue: quest.target_value,
        currentProgress: quest.current_progress,
        status: quest.status,
        rewards: quest.rewards,
        generatedAt: new Date(quest.generated_at).toISOString(),
        expiresAt: new Date(quest.expires_at).toISOString(),
        completedAt: quest.completed_at
          ? new Date(quest.completed_at).toISOString()
          : undefined,
        claimedAt: quest.claimed_at
          ? new Date(quest.claimed_at).toISOString()
          : undefined,
        metadata: quest.metadata,
      }))

      // Получаем статистику
      const { data: stats } = await supabase.rpc('get_daily_quests_stats', {
        p_telegram_id: parseInt(telegramId),
      })

      return res.status(200).json({
        success: true,
        data: {
          quests: formattedQuests,
          completedToday: stats?.completed_quests || 0,
          totalToday: stats?.total_quests || 0,
          canClaimBonus: (stats?.completed_quests || 0) >= 3,
          bonusRewards:
            (stats?.completed_quests || 0) >= 3
              ? {
                  sprouts: 50 + ((stats?.completed_quests || 0) - 3) * 25,
                  gems: (stats?.completed_quests || 0) >= 5 ? 1 : 0,
                  experience: 25 + ((stats?.completed_quests || 0) - 3) * 25,
                  description: `Бонус за ${stats?.completed_quests || 0} квестов!`,
                }
              : undefined,
          stats: {
            activeQuests: stats?.active_quests || 0,
            completedQuests: stats?.completed_quests || 0,
            claimedQuests: stats?.claimed_quests || 0,
            totalQuests: stats?.total_quests || 0,
            completionRate: stats?.completion_rate || 0,
            totalRewards: stats?.total_rewards || {
              sprouts: 0,
              gems: 0,
              experience: 0,
            },
          },
        },
      })
    }

    // Форматируем существующие квесты
    const formattedQuests = quests.map(quest => ({
      id: quest.id,
      telegramId: quest.telegram_id,
      questType: quest.quest_type,
      questCategory: quest.quest_category,
      targetValue: quest.target_value,
      currentProgress: quest.current_progress,
      status: quest.status,
      rewards: quest.rewards,
      generatedAt: new Date(quest.generated_at).toISOString(),
      expiresAt: new Date(quest.expires_at).toISOString(),
      completedAt: quest.completed_at
        ? new Date(quest.completed_at).toISOString()
        : undefined,
      claimedAt: quest.claimed_at
        ? new Date(quest.claimed_at).toISOString()
        : undefined,
      metadata: quest.metadata,
    }))

    // Получаем статистику
    const { data: stats } = await supabase.rpc('get_daily_quests_stats', {
      p_telegram_id: parseInt(telegramId),
    })

    const completedToday = quests.filter(
      q => q.status === 'completed' || q.status === 'claimed'
    ).length
    const totalToday = quests.length

    return res.status(200).json({
      success: true,
      data: {
        quests: formattedQuests,
        completedToday,
        totalToday,
        canClaimBonus: completedToday >= 3,
        bonusRewards:
          completedToday >= 3
            ? {
                sprouts: 50 + (completedToday - 3) * 25,
                gems: completedToday >= 5 ? 1 : 0,
                experience: 25 + (completedToday - 3) * 25,
                description: `Бонус за ${completedToday} квестов!`,
              }
            : undefined,
        stats: {
          activeQuests: stats?.active_quests || 0,
          completedQuests: stats?.completed_quests || 0,
          claimedQuests: stats?.claimed_quests || 0,
          totalQuests: stats?.total_quests || 0,
          completionRate: stats?.completion_rate || 0,
          totalRewards: stats?.total_rewards || {
            sprouts: 0,
            gems: 0,
            experience: 0,
          },
        },
      },
    })
  } catch (error) {
    console.error('Daily quests error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

/**
 * Получение награды за выполненное задание
 */
async function handleClaimDailyQuest(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { questId, telegramId } = req.body

    if (!questId || !telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: questId, telegramId',
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)

    // Вызываем созданную в БД функцию для получения награды
    const { data, error: claimError } = await supabase.rpc(
      'claim_daily_quest_reward',
      {
        p_quest_id: questId,
        p_telegram_id: parseInt(telegramId),
      }
    )

    if (claimError) {
      console.error('Claim quest RPC error:', claimError)
      // Отдаем пользователю понятную ошибку
      const errorMessage =
        claimError.code === 'P0003'
          ? 'Награда уже получена.'
          : claimError.code === 'P0002'
            ? 'Задание еще не выполнено.'
            : claimError.code === 'P0001'
              ? 'Задание не найдено.'
              : 'Ошибка при получении награды.'
      return res.status(400).json({ success: false, error: errorMessage })
    }

    // 🔧 ИСПРАВЛЕНИЕ: Новая структура ответа от SQL функции
    // Функция возвращает: { quest_row, sprouts_earned, gems_earned, balance }
    const result = data?.[0]

    if (!result || !result.quest_row) {
      return res.status(404).json({
        success: false,
        error: 'Задание не найдено или уже получено.',
      })
    }

    // Извлекаем данные из новой структуры
    const questRow = result.quest_row
    const sproutsEarned = result.sprouts_earned || 0
    const gemsEarned = result.gems_earned || 0
    const balance = result.balance || { sprouts: 0, gems: 0 }

    console.log('✅ Quest claimed successfully:', {
      questId: questRow.id,
      sproutsEarned,
      gemsEarned,
      newBalance: balance,
    })

    // Форматируем квест для ответа
    const formattedQuest = {
      id: questRow.id,
      telegramId: questRow.telegram_id,
      questType: questRow.quest_type,
      questCategory: questRow.quest_category,
      targetValue: questRow.target_value,
      currentProgress: questRow.current_progress,
      status: questRow.status,
      rewards: questRow.rewards,
      generatedAt: new Date(questRow.generated_at).toISOString(),
      expiresAt: new Date(questRow.expires_at).toISOString(),
      completedAt: questRow.completed_at
        ? new Date(questRow.completed_at).toISOString()
        : undefined,
      claimedAt: questRow.claimed_at
        ? new Date(questRow.claimed_at).toISOString()
        : undefined,
      metadata: questRow.metadata,
    }

    return res.status(200).json({
      success: true,
      data: {
        quest: formattedQuest,
        balance, // Баланс уже включен в ответ функции
        rewards: {
          sprouts: sproutsEarned,
          gems: gemsEarned,
        },
      },
    })
  } catch (error) {
    console.error('Claim daily quest error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

/**
 * Обновление прогресса задания
 */
async function handleUpdateDailyProgress(req, res) {
  try {
    const { telegramId, increment = 1 } = req.body
    const { questId, questType } = req.body

    console.log('🎯 UPDATE DAILY PROGRESS REQUEST:', {
      questId,
      telegramId,
      questType,
      increment,
      body: req.body,
    })

    if (!telegramId || (!questId && !questType)) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: telegramId and questId or questType',
      })
    }

    const supabase = await getSupabaseClient(req.auth?.jwt)
    let quest

    if (questId) {
      // Обновляем конкретный квест по ID через RPC
      const { data: questData, error: updateError } = await supabase.rpc(
        'update_daily_quest_progress',
        {
          p_quest_id: questId,
          p_telegram_id: parseInt(telegramId),
          p_increment: parseInt(increment),
        }
      )

      if (updateError) {
        console.warn('Update quest progress RPC error:', updateError)
        // Не возвращаем ошибку 500, т.к. это может быть ожидаемое поведение (квест не найден)
        return res.status(200).json({
          success: true,
          data: {
            quest: null,
            message: 'Quest not found or not active.',
          },
        })
      }
      quest = questData?.[0]
    } else if (questType) {
      // Находим активный квест по типу
      const { data: quests, error: fetchError } = await supabase
        .from('daily_quests')
        .select('id')
        .eq('telegram_id', parseInt(telegramId))
        .eq('quest_type', questType)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)

      if (fetchError || !quests || quests.length === 0) {
        // Это не ошибка, просто нет активного квеста такого типа
        return res.status(200).json({
          success: true,
          data: {
            quest: null,
            message: `No active quest of type ${questType} found.`,
          },
        })
      }

      const activeQuestId = quests[0].id
      const { data: questData, error: updateError } = await supabase.rpc(
        'update_daily_quest_progress',
        {
          p_quest_id: activeQuestId,
          p_telegram_id: parseInt(telegramId),
          p_increment: parseInt(increment),
        }
      )

      if (updateError) {
        console.warn(
          `Update quest progress RPC error for type ${questType}:`,
          updateError
        )
        return res.status(200).json({
          success: true,
          data: { quest: null, message: 'Quest update failed.' },
        })
      }
      quest = questData?.[0]
    }

    if (!quest) {
      return res.status(200).json({
        success: true,
        data: {
          quest: null,
          message:
            'No quests were updated (may not exist or already completed)',
        },
      })
    }

    // Форматируем квест для ответа
    const formattedQuest = {
      id: quest.id,
      telegramId: quest.telegram_id,
      questType: quest.quest_type,
      questCategory: quest.quest_category,
      targetValue: quest.target_value,
      currentProgress: quest.current_progress,
      status: quest.status,
      rewards: quest.rewards,
      generatedAt: new Date(quest.generated_at).toISOString(),
      expiresAt: new Date(quest.expires_at).toISOString(),
      completedAt: quest.completed_at
        ? new Date(quest.completed_at).toISOString()
        : undefined,
      claimedAt: quest.claimed_at
        ? new Date(quest.claimed_at).toISOString()
        : undefined,
      metadata: quest.metadata,
    }

    const isCompleted = quest.status === 'completed'
    const isNewlyCompleted =
      isCompleted &&
      quest.completed_at &&
      new Date(quest.completed_at).getTime() - new Date().getTime() < 5000 // В течение 5 секунд

    return res.status(200).json({
      success: true,
      data: {
        quest: formattedQuest,
        isCompleted,
        isNewlyCompleted,
      },
    })
  } catch (error) {
    console.error('Update daily progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// ===============================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ===============================================

// Импортируем middleware аутентификации
import { withAuth, verifyTelegramId } from './_auth.js'

// Защищенный handler с аутентификацией
async function protectedHandler(req, res) {
  try {
    const { action } = req.query
    console.log(
      '🔥 CHALLENGES API MAIN HANDLER! Action:',
      action,
      'Method:',
      req.method
    )

    // 🔐 Проверяем что пользователь работает со своими данными
    const requestedTelegramId = req.query.telegramId || req.body.telegramId

    if (
      requestedTelegramId &&
      !verifyTelegramId(requestedTelegramId, req.auth.telegramId)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only access your own data',
      })
    }

    switch (action) {
      case 'list':
        return await handleList(req, res)
      case 'details':
        return await handleDetails(req, res)
      case 'join':
        return await handleJoin(req, res)
      case 'update_progress':
        return await handleUpdateProgress(req, res)
      case 'complete_expired':
        return await handleCompleteExpiredChallenges(req, res)
      // 🎯 Daily Quests actions
      case 'daily-quests':
        return await handleDailyQuests(req, res)
      case 'claim-daily-quest':
        return await handleClaimDailyQuest(req, res)
      case 'update-daily-progress':
        return await handleUpdateDailyProgress(req, res)
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

// Экспортируем защищенный handler
export default withAuth(protectedHandler)

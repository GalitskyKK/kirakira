/**
 * 💰 ОБЪЕДИНЕННЫЙ API ДЛЯ ВАЛЮТЫ
 * Включает: earn, spend, balance, transactions
 *
 * ACTIONS:
 * - earn: Начисление валюты
 * - spend: Списание валюты
 * - balance: Получение баланса
 * - transactions: История транзакций
 */

// 🔒 Функция для инициализации Supabase (SERVICE_ROLE)
async function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured')
  }

  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// 🔒 Валидация telegram_id из JWT
async function validateTelegramId(req, expectedTelegramId) {
  try {
    const jwt = req.headers.authorization?.split(' ')[1]
    if (!jwt) return false

    const { verifySupabaseJWT } = await import('./_jwt.js')
    const payload = verifySupabaseJWT(jwt)

    if (!payload) return false

    return payload.telegram_id === expectedTelegramId
  } catch (error) {
    console.error('❌ JWT validation error:', error)
    return false
  }
}

// ===============================================
// 💰 ACTION: EARN - Начисление валюты
// ===============================================
async function handleEarn(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const {
      telegramId,
      currencyType,
      amount,
      reason,
      description,
      metadata = {},
    } = req.body

    // Валидация
    if (!telegramId || !currencyType || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: telegramId, currencyType, amount, reason',
      })
    }

    if (!['sprouts', 'gems'].includes(currencyType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency type. Must be sprouts or gems',
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive',
      })
    }

    // Валидация JWT
    const isValid = await validateTelegramId(req, telegramId)
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Invalid or missing JWT token',
      })
    }

    const supabase = await getSupabaseClient()

    console.log(
      `💰 Earning ${amount} ${currencyType} for user ${telegramId}: ${reason}`
    )

    // Вызываем функцию PostgreSQL для атомарного начисления
    const { data, error } = await supabase.rpc('earn_currency', {
      p_telegram_id: telegramId,
      p_currency_type: currencyType,
      p_amount: amount,
      p_reason: reason,
      p_description: description || null,
      p_metadata: metadata,
    })

    if (error) {
      console.error('❌ Error earning currency:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to earn currency',
      })
    }

    const result = data[0]

    console.log(`✅ Currency earned successfully:`, result)

    return res.status(200).json({
      success: true,
      data: {
        newBalance: result.new_balance,
        transactionId: result.transaction_id,
        currencyType,
        amount,
        reason,
      },
    })
  } catch (error) {
    console.error('❌ Unexpected error in handleEarn:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}

// ===============================================
// 💸 ACTION: SPEND - Списание валюты
// ===============================================
async function handleSpend(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const {
      telegramId,
      currencyType,
      amount,
      reason,
      description,
      metadata = {},
    } = req.body

    // Валидация
    if (!telegramId || !currencyType || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: telegramId, currencyType, amount, reason',
      })
    }

    if (!['sprouts', 'gems'].includes(currencyType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency type. Must be sprouts or gems',
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive',
      })
    }

    // Валидация JWT
    const isValid = await validateTelegramId(req, telegramId)
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Invalid or missing JWT token',
      })
    }

    const supabase = await getSupabaseClient()

    console.log(
      `💸 Spending ${amount} ${currencyType} for user ${telegramId}: ${reason}`
    )

    // Вызываем функцию PostgreSQL для атомарного списания
    const { data, error } = await supabase.rpc('spend_currency', {
      p_telegram_id: telegramId,
      p_currency_type: currencyType,
      p_amount: amount,
      p_reason: reason,
      p_description: description || null,
      p_metadata: metadata,
    })

    if (error) {
      console.error('❌ Error spending currency:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to spend currency',
      })
    }

    const result = data[0]

    // Проверяем успешность операции
    if (!result.success) {
      console.log(`⚠️ Insufficient funds for user ${telegramId}`)
      return res.status(400).json({
        success: false,
        error: result.error_message || 'Insufficient funds',
      })
    }

    console.log(`✅ Currency spent successfully:`, result)

    return res.status(200).json({
      success: true,
      data: {
        newBalance: result.new_balance,
        transactionId: result.transaction_id,
        currencyType,
        amount,
        reason,
      },
    })
  } catch (error) {
    console.error('❌ Unexpected error in handleSpend:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}

// ===============================================
// 📊 ACTION: BALANCE - Получение баланса
// ===============================================
async function handleBalance(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing telegramId parameter',
      })
    }

    // Валидация JWT
    const isValid = await validateTelegramId(req, telegramId)
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Invalid or missing JWT token',
      })
    }

    const supabase = await getSupabaseClient()

    console.log(`📊 Getting balance for user ${telegramId}`)

    // Получаем баланс пользователя
    const { data, error } = await supabase
      .from('user_currency')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (error) {
      // Если пользователя нет, создаем запись с нулевым балансом
      if (error.code === 'PGRST116') {
        console.log(`📝 Initializing currency for user ${telegramId}`)

        const { data: initData, error: initError } = await supabase
          .from('user_currency')
          .insert({
            telegram_id: telegramId,
            sprouts: 0,
            gems: 0,
          })
          .select()
          .single()

        if (initError) {
          console.error('❌ Error initializing currency:', initError)
          return res.status(500).json({
            success: false,
            error: 'Failed to initialize currency',
          })
        }

        console.log(`✅ Currency initialized for user ${telegramId}`)

        return res.status(200).json({
          success: true,
          data: {
            telegramId: initData.telegram_id,
            sprouts: initData.sprouts,
            gems: initData.gems,
            totalSproutsEarned: initData.total_sprouts_earned,
            totalGemsEarned: initData.total_gems_earned,
            totalSproutsSpent: initData.total_sprouts_spent,
            totalGemsSpent: initData.total_gems_spent,
            createdAt: initData.created_at,
            lastUpdated: initData.last_updated,
          },
        })
      }

      console.error('❌ Error fetching balance:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch balance',
      })
    }

    console.log(`✅ Balance fetched for user ${telegramId}:`, {
      sprouts: data.sprouts,
      gems: data.gems,
    })

    return res.status(200).json({
      success: true,
      data: {
        telegramId: data.telegram_id,
        sprouts: data.sprouts,
        gems: data.gems,
        totalSproutsEarned: data.total_sprouts_earned,
        totalGemsEarned: data.total_gems_earned,
        totalSproutsSpent: data.total_sprouts_spent,
        totalGemsSpent: data.total_gems_spent,
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
      },
    })
  } catch (error) {
    console.error('❌ Unexpected error in handleBalance:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}

// ===============================================
// 📜 ACTION: TRANSACTIONS - История транзакций
// ===============================================
async function handleTransactions(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const telegramId = parseInt(req.query.telegramId)
    const limit = parseInt(req.query.limit) || 50
    const offset = parseInt(req.query.offset) || 0
    const currencyType = req.query.currencyType // 'sprouts', 'gems', or undefined (all)
    const transactionType = req.query.transactionType // 'earn', 'spend', or undefined (all)

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing telegramId parameter',
      })
    }

    // Валидация JWT
    const isValid = await validateTelegramId(req, telegramId)
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Invalid or missing JWT token',
      })
    }

    const supabase = await getSupabaseClient()

    console.log(`📜 Getting transactions for user ${telegramId}`)

    // Строим запрос с фильтрами
    let query = supabase
      .from('currency_transactions')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Применяем фильтры
    if (currencyType) {
      query = query.eq('currency_type', currencyType)
    }

    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Error fetching transactions:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch transactions',
      })
    }

    console.log(`✅ Fetched ${data.length} transactions for user ${telegramId}`)

    // Преобразуем snake_case в camelCase
    const transactions = data.map(tx => ({
      id: tx.id,
      telegramId: tx.telegram_id,
      transactionType: tx.transaction_type,
      currencyType: tx.currency_type,
      amount: tx.amount,
      balanceBefore: tx.balance_before,
      balanceAfter: tx.balance_after,
      reason: tx.reason,
      description: tx.description,
      metadata: tx.metadata,
      relatedUserId: tx.related_user_id,
      createdAt: tx.created_at,
    }))

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        total: count,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('❌ Unexpected error in handleTransactions:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}

// ===============================================
// 🎯 РОУТЕР
// ===============================================
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const action =
      req.query.action || (req.method === 'GET' ? 'balance' : 'earn')

    console.log(`\n🎯 Currency API - Action: ${action}`)

    switch (action) {
      case 'earn':
        return await handleEarn(req, res)

      case 'spend':
        return await handleSpend(req, res)

      case 'balance':
        return await handleBalance(req, res)

      case 'transactions':
        return await handleTransactions(req, res)

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Valid actions: earn, spend, balance, transactions`,
        })
    }
  } catch (error) {
    console.error('❌ Unexpected error in currency API:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}

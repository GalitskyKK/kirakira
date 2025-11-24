/**
 * 💰 ОБЪЕДИНЕННЫЙ API ДЛЯ ВАЛЮТЫ И МАГАЗИНА
 * Включает: earn, spend, balance, transactions, themes
 *
 * ACTIONS:
 * - earn: Начисление валюты
 * - spend: Списание валюты
 * - balance: Получение баланса
 * - transactions: История транзакций
 * - list_themes: Список тем и купленных
 * - buy_theme: Покупка темы
 */

// 🔒 Функция для инициализации Supabase с JWT (RLS-защищенный)
async function getSupabaseClient(jwt = null) {
  console.log('🔑 getSupabaseClient called with jwt:', jwt ? 'present' : 'null')

  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL not configured')
  }

  // ✅ ПРИОРИТЕТ: Используем JWT для RLS-защищенных запросов
  if (jwt) {
    try {
      console.log('🔑 Using JWT client')
      const { createAuthenticatedSupabaseClient } = await import('./_jwt.js')
      return await createAuthenticatedSupabaseClient(jwt)
    } catch (error) {
      console.error('❌ Failed to create JWT client:', error)
      // Fallback на SERVICE_ROLE_KEY ниже
    }
  }

  // ⚠️ FALLBACK: SERVICE_ROLE_KEY (минует RLS)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured')
  }

  console.warn('⚠️ Using SERVICE_ROLE_KEY (bypasses RLS)')
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

    // PostgreSQL функция может возвращать массив или объект
    const result = Array.isArray(data) ? data[0] : data

    console.log(`✅ Currency earned successfully:`, result)

    // earn_currency возвращает: { success, new_balance, transaction_id }
    return res.status(200).json({
      success: true,
      data: {
        balance_after: result.new_balance,
        balance_before: result.new_balance - amount, // Вычисляем из нового баланса
        amount_earned: amount,
        transaction_id: result.transaction_id,
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    console.log('🔑 req.auth:', req.auth)
    console.log('🔑 req.auth?.jwt:', req.auth?.jwt)

    const supabase = await getSupabaseClient(req.auth?.jwt)

    console.log(
      `💸 Spending ${amount} ${currencyType} for user ${telegramId}: ${reason}`
    )

    // Вызываем функцию PostgreSQL для атомарного списания
    console.log('💸 Calling spend_currency with params:', {
      p_telegram_id: telegramId,
      p_currency_type: currencyType,
      p_amount: amount,
      p_reason: reason,
      p_description: description || null,
      p_metadata: metadata,
    })

    const { data, error } = await supabase.rpc('spend_currency', {
      p_telegram_id: telegramId,
      p_currency_type: currencyType,
      p_amount: amount,
      p_reason: reason,
      p_description: description || null,
      p_metadata: metadata,
    })

    console.log('💸 spend_currency result:', { data, error })

    if (error) {
      console.error('❌ Error spending currency:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to spend currency',
      })
    }

    // PostgreSQL функция может возвращать массив или объект
    const result = Array.isArray(data) ? data[0] : data

    // Проверяем успешность операции
    if (!result || !result.success) {
      console.log(`⚠️ Insufficient funds for user ${telegramId}`)
      return res.status(400).json({
        success: false,
        error: result?.error || 'Insufficient funds',
      })
    }

    console.log(`✅ Currency spent successfully:`, result)

    // Если это покупка темы, добавляем запись в shop_purchases
    if (reason === 'buy_theme' && metadata?.themeId) {
      try {
        // Правильно сохраняем цену в зависимости от валюты
        const purchaseData = {
          telegram_id: telegramId,
          item_type: 'garden_theme',
          item_id: metadata.themeId,
          price_sprouts: currencyType === 'sprouts' ? amount : 0,
          price_gems: currencyType === 'gems' ? amount : 0,
          purchased_at: new Date().toISOString(),
          metadata: metadata,
        }

        console.log('📝 Recording theme purchase:', purchaseData)

        const { error: purchaseError } = await supabase
          .from('shop_purchases')
          .insert(purchaseData)

        if (purchaseError) {
          console.error('❌ Failed to record theme purchase:', purchaseError)
          // Не возвращаем ошибку, так как валюта уже списана
        } else {
          console.log(
            `✅ Theme purchase recorded: ${metadata.themeId} (${currencyType}: ${amount})`
          )
        }
      } catch (purchaseErr) {
        console.error('❌ Error recording theme purchase:', purchaseErr)
        // Не возвращаем ошибку, так как валюта уже списана
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        balance_after: result.balance_after,
        balance_before: result.balance_before,
        amount_spent: result.amount_spent,
        transaction_id: result.transaction_id,
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

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
// 🎨 ACTION: LIST_THEMES - Список тем и купленных
// ===============================================
async function handleListThemes(req, res) {
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

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    console.log(`🎨 Getting themes for user ${telegramId}`)
    console.log(`🔑 JWT present:`, !!req.auth?.jwt)
    console.log(`🔑 req.auth:`, req.auth)

    // Получаем купленные темы пользователя
    const { data: ownedThemes, error: ownedError } = await supabase
      .from('shop_purchases')
      .select('item_id')
      .eq('telegram_id', telegramId)
      .eq('item_type', 'garden_theme')

    if (ownedError) {
      console.error('❌ Error fetching owned themes:', ownedError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch owned themes',
      })
    }

    console.log(`📦 Raw owned themes from DB:`, ownedThemes)
    const ownedThemeIds = ownedThemes.map(t => t.item_id)
    console.log(`🎨 Processed owned theme IDs:`, ownedThemeIds)

    // Статичный список тем (в будущем можно вынести в БД)
    const themes = [
      { id: 'light', name: 'Светлая', priceSprouts: 0, isDefault: true },
      { id: 'dark', name: 'Тёмная', priceSprouts: 0, isDefault: true },
      { id: 'sunset', name: 'Закат', priceSprouts: 500, isDefault: false },
      { id: 'night', name: 'Ночное небо', priceSprouts: 600, isDefault: false },
      { id: 'forest', name: 'Лесная', priceSprouts: 700, isDefault: false },
      { id: 'aqua', name: 'Морская', priceSprouts: 800, isDefault: false },
      // 🎨 ПРЕМИУМ ТЕМЫ - можно купить за ростки ИЛИ за гемы
      {
        id: 'magic',
        name: 'Магия',
        priceSprouts: 1600,
        priceGems: 16,
        isDefault: false,
        isPremium: true,
      },
      {
        id: 'space',
        name: 'Космос',
        priceSprouts: 1800,
        priceGems: 18,
        isDefault: false,
        isPremium: true,
      },
      {
        id: 'cyberpunk',
        name: 'Киберпанк',
        priceSprouts: 2000,
        priceGems: 20,
        isDefault: false,
        isPremium: true,
      },
    ]

    console.log(`✅ Themes fetched for user ${telegramId}:`, {
      total: themes.length,
      owned: ownedThemeIds.length,
    })

    return res.status(200).json({
      success: true,
      data: {
        themes,
        ownedThemeIds,
      },
    })
  } catch (error) {
    console.error('❌ Unexpected error in handleListThemes:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}

// ===============================================
// 🛒 ACTION: BUY_THEME - Покупка темы
// ===============================================
async function handleBuyTheme(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { telegramId, themeId, currencyType = 'sprouts' } = req.body

    if (!telegramId || !themeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: telegramId, themeId',
      })
    }

    if (!['sprouts', 'gems'].includes(currencyType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency type. Must be sprouts or gems',
      })
    }

    // 🔑 Используем JWT из req.auth для RLS-защищенного запроса
    const supabase = await getSupabaseClient(req.auth?.jwt)

    console.log(`🛒 Buying theme ${themeId} for user ${telegramId}`)

    // Получаем информацию о теме
    const themes = [
      { id: 'light', name: 'Светлая', priceSprouts: 0, isDefault: true },
      { id: 'dark', name: 'Тёмная', priceSprouts: 0, isDefault: true },
      { id: 'sunset', name: 'Закат', priceSprouts: 500, isDefault: false },
      { id: 'night', name: 'Ночное небо', priceSprouts: 600, isDefault: false },
      { id: 'forest', name: 'Лесная', priceSprouts: 700, isDefault: false },
      { id: 'aqua', name: 'Морская', priceSprouts: 800, isDefault: false },
      // 🎨 ПРЕМИУМ ТЕМЫ - можно купить за ростки ИЛИ за гемы
      {
        id: 'magic',
        name: 'Магия',
        priceSprouts: 1600,
        priceGems: 16,
        isDefault: false,
        isPremium: true,
      },
      {
        id: 'space',
        name: 'Космос',
        priceSprouts: 1800,
        priceGems: 18,
        isDefault: false,
        isPremium: true,
      },
      {
        id: 'cyberpunk',
        name: 'Киберпанк',
        priceSprouts: 2000,
        priceGems: 20,
        isDefault: false,
        isPremium: true,
      },
    ]

    const theme = themes.find(t => t.id === themeId)
    if (!theme) {
      return res.status(400).json({
        success: false,
        error: 'Theme not found',
      })
    }

    // Проверяем, не куплена ли уже тема
    const { data: existingPurchase, error: checkError } = await supabase
      .from('shop_purchases')
      .select('id')
      .eq('telegram_id', telegramId)
      .eq('item_id', themeId)
      .eq('item_type', 'garden_theme')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing purchase:', checkError)
      return res.status(500).json({
        success: false,
        error: 'Failed to check existing purchase',
      })
    }

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        error: 'Theme already purchased',
      })
    }

    // Если тема бесплатная, просто добавляем в покупки
    if (theme.isDefault || theme.priceSprouts === 0) {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('shop_purchases')
        .insert({
          telegram_id: telegramId,
          item_id: themeId,
          item_type: 'garden_theme',
          cost_sprouts: 0,
          cost_gems: 0,
        })
        .select()
        .single()

      if (purchaseError) {
        console.error('❌ Error creating free purchase:', purchaseError)
        return res.status(500).json({
          success: false,
          error: 'Failed to create purchase',
        })
      }

      return res.status(200).json({
        success: true,
        data: {
          themeId,
          themeName: theme.name,
          cost: 0,
          purchaseId: purchaseData.id,
        },
      })
    }

    // Для платных тем списываем валюту (ростки ИЛИ гемы)
    // 🎨 Для премиум тем пользователь выбирает валюту
    let amount = 0
    let actualCurrencyType = currencyType

    if (currencyType === 'sprouts') {
      amount = theme.priceSprouts
      if (!amount || amount === 0) {
        return res.status(400).json({
          success: false,
          error: 'This theme cannot be purchased with sprouts',
        })
      }
    } else if (currencyType === 'gems') {
      amount = theme.priceGems
      if (!amount || amount === 0) {
        return res.status(400).json({
          success: false,
          error: 'This theme cannot be purchased with gems',
        })
      }
    }

    console.log(
      `💰 Purchasing theme "${theme.name}" for ${amount} ${actualCurrencyType}`
    )

    const { data: spendResult, error: spendError } = await supabase.rpc(
      'spend_currency',
      {
        p_telegram_id: telegramId,
        p_currency_type: actualCurrencyType,
        p_amount: amount,
        p_reason: 'buy_theme',
        p_description: `Покупка темы "${theme.name}"`,
        p_metadata: {
          themeId,
          themeName: theme.name,
          currencyType: actualCurrencyType,
        },
      }
    )

    if (spendError) {
      console.error('❌ Error spending currency for theme:', spendError)
      return res.status(500).json({
        success: false,
        error: 'Failed to process payment',
      })
    }

    const spendData = Array.isArray(spendResult) ? spendResult[0] : spendResult

    // Проверяем успешность операции
    if (!spendData || !spendData.success) {
      console.log(
        `⚠️ Insufficient funds for theme purchase: ${spendData?.error}`
      )
      return res.status(400).json({
        success: false,
        error: spendData?.error || 'Insufficient funds',
      })
    }

    // Создаем запись о покупке
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('shop_purchases')
      .insert({
        telegram_id: telegramId,
        item_id: themeId,
        item_type: 'garden_theme',
        cost_sprouts: actualCurrencyType === 'sprouts' ? amount : 0,
        cost_gems: actualCurrencyType === 'gems' ? amount : 0,
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('❌ Error creating purchase record:', purchaseError)
      return res.status(500).json({
        success: false,
        error: 'Failed to create purchase record',
      })
    }

    console.log(`✅ Theme purchased successfully:`, {
      themeId,
      cost: theme.priceSprouts,
      newBalance: spendData.balance_after,
    })

    return res.status(200).json({
      success: true,
      data: {
        themeId,
        themeName: theme.name,
        cost: theme.priceSprouts,
        newBalance: spendData.balance_after,
        transactionId: spendData.transaction_id,
        purchaseId: purchaseData.id,
      },
    })
  } catch (error) {
    console.error('❌ Unexpected error in handleBuyTheme:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    })
  }
}

// ===============================================
// 🎯 РОУТЕР
// ===============================================

// Импортируем middleware аутентификации
import { withAuth } from './_auth.js'

async function handler(req, res) {
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

      case 'list_themes':
        return await handleListThemes(req, res)

      case 'buy_theme':
        return await handleBuyTheme(req, res)

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Valid actions: earn, spend, balance, transactions, list_themes, buy_theme`,
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

// ✅ Экспортируем handler с защитой через middleware
export default withAuth(handler)

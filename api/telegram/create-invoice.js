/**
 * API эндпоинт для создания Telegram Stars инвойсов
 * POST /api/telegram/create-invoice
 * Body: { featureId: string, title: string, description: string, price: number }
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

/**
 * Создает инвойс для оплаты Telegram Stars
 * @param {string} featureId - ID премиум функции
 * @param {string} title - Название товара
 * @param {string} description - Описание товара
 * @param {number} price - Цена в Telegram Stars
 * @returns {Promise<string>} URL инвойса
 */
async function createTelegramStarsInvoice(
  featureId,
  title,
  description,
  price
) {
  try {
    // Генерируем уникальный payload для отслеживания платежа
    const payload = `${featureId}_${Date.now()}`

    const invoiceData = {
      title: title,
      description: description,
      payload: payload, // Для идентификации платежа в webhook
      provider_token: '', // Пустая строка для Telegram Stars
      currency: 'XTR', // Telegram Stars
      prices: [
        {
          label: title,
          amount: price, // Цена в Telegram Stars
        },
      ],
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      send_phone_number_to_provider: false,
      send_email_to_provider: false,
      is_flexible: false,
      photo_url: undefined,
      photo_size: undefined,
      photo_width: undefined,
      photo_height: undefined,
    }

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      }
    )

    const result = await response.json()

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`)
    }

    console.log(`✅ Invoice link created for ${title} (${price} Stars)`)
    return result.result // URL инвойса
  } catch (error) {
    console.error('Error creating Telegram Stars invoice:', error)
    throw error
  }
}

/**
 * API handler для создания инвойсов
 * @param {Request} req - Vercel Functions request object
 * @param {Response} res - Vercel Functions response object
 */
export default async function handler(req, res) {
  // Проверяем наличие токена
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is missing')
    return res.status(500).json({ error: 'Bot token not configured' })
  }

  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { featureId, title, description, price } = req.body

    // Валидация входных данных
    if (!featureId || typeof featureId !== 'string') {
      return res.status(400).json({ error: 'featureId (string) is required' })
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title (string) is required' })
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description (string) is required' })
    }

    if (!price || typeof price !== 'number' || price <= 0) {
      return res
        .status(400)
        .json({ error: 'price (positive number) is required' })
    }

    // Проверяем валидность премиум функции
    const validFeatures = ['rare_elements', 'seasonal_themes', 'premium_bundle']
    if (!validFeatures.includes(featureId)) {
      return res.status(400).json({
        error: 'Invalid feature ID',
        validFeatures: validFeatures,
      })
    }

    // Проверяем валидность цены
    const validPrices = [50, 100, 120] // Ожидаемые цены в Stars
    if (!validPrices.includes(price)) {
      return res.status(400).json({
        error: 'Invalid price',
        validPrices: validPrices,
      })
    }

    console.log(`Creating invoice for ${featureId}: ${title} (${price} Stars)`)

    // Создаем инвойс
    const invoiceUrl = await createTelegramStarsInvoice(
      featureId,
      title,
      description,
      price
    )

    res.status(200).json({
      success: true,
      invoiceUrl: invoiceUrl,
      data: {
        featureId,
        title,
        description,
        price,
      },
      message: 'Invoice created successfully',
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      message: error?.message || 'Unknown error',
    })
  }
}

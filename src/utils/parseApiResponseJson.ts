/**
 * Безопасный разбор JSON из fetch: пустое тело (404 Vite, 502 edge) не бросает SyntaxError.
 */
export async function parseApiResponseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  const trimmed = text.trim()

  if (!trimmed) {
    throw new Error(
      `Пустой ответ сервера (HTTP ${String(response.status)}). ` +
        'Если это локальный npm run dev — в vite.config настроен прокси /api на прод, ' +
        'либо откройте приложение на том же домене, где работает API.'
    )
  }

  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    throw new Error(
      `Ответ не JSON (HTTP ${String(response.status)}). Проверьте маршрут /api на сервере.`
    )
  }
}

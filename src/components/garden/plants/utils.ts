/**
 * Утилиты для оптимизации SVG элементов
 * Объединяет множественные rect в один path для уменьшения DOM узлов
 */

/**
 * Создает SVG path из массива прямоугольников
 * Формат: M x,y h w v h h-w v-h z
 */
export function createPathFromRects(
  rects: Array<{ x: number; y: number; w: number; h: number }>
): string {
  return rects.map((r) => `M${r.x},${r.y}h${r.w}v${r.h}h-${r.w}v-${r.h}z`).join(' ')
}

/**
 * Объединяет прямоугольники одного цвета в один path
 */
export function groupRectsByColor(
  rects: Array<{ x: number; y: number; w: number; h: number; fill: string; opacity?: number }>
): Array<{ path: string; fill: string; opacity?: number }> {
  const groups = new Map<string, Array<{ x: number; y: number; w: number; h: number }>>()
  
  for (const rect of rects) {
    const key = `${rect.fill}-${rect.opacity ?? 1}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h })
  }
  
  return Array.from(groups.entries()).map(([key, rects]) => {
    const parts = key.split('-')
    const fill = parts[0] ?? ''
    const opacityStr = parts[1]
    const result: { path: string; fill: string; opacity?: number } = {
      path: createPathFromRects(rects),
      fill,
    }
    if (opacityStr && opacityStr !== '1') {
      result.opacity = parseFloat(opacityStr)
    }
    return result
  })
}


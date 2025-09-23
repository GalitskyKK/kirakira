import { ElementShowcase } from '@/components/dev/ElementShowcase'

export function ShowcasePage() {
  // Дополнительная проверка на dev режим для безопасности
  if (!import.meta.env.DEV) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            🚫 Режим разработки
          </h1>
          <p className="text-gray-600">
            ElementShowcase доступен только в режиме разработки
          </p>
        </div>
      </div>
    )
  }

  return <ElementShowcase />
}

export default ShowcasePage

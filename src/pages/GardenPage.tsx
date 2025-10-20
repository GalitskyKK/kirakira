import { GardenView } from '@/components/garden'
import { useGardenState } from '@/hooks/index.v2'

export function GardenPage() {
  const { gardenStats } = useGardenState()

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-gray-100">
          Мой сад
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {gardenStats.totalElements} растений
        </p>
      </div>

      {/* Compact garden view for mobile */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <GardenView className="min-h-[400px]" />
      </div>
    </div>
  )
}

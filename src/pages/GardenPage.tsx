import { GardenView } from '@/components/garden'
// import { useGardenState } from '@/hooks/index.v2'

export function GardenPage() {
  // const { gardenStats } = useGardenState()

  return (
    <div className="p-4">
      {/* Compact garden view for mobile - serene glass */}
      <div className="glass-card overflow-hidden rounded-3xl border border-neutral-200/50 shadow-xl dark:border-neutral-700/50">
        <GardenView className="min-h-[400px]" />
      </div>
    </div>
  )
}

import { GardenCompanion } from '@/components/garden'

export function CompanionOverlay() {
  return (
    <div className="pointer-events-none fixed right-3 bottom-[112px] z-[1500] sm:right-6 sm:top-6 sm:bottom-auto">
      <GardenCompanion className="h-36 w-32 sm:h-52 sm:w-48" />
    </div>
  )
}


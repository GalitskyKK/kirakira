import { GardenCompanion } from '@/components/garden'
import { CompanionInfoPanel } from './CompanionInfoPanel'

export function CompanionOverlay() {
  return (
    <div
      className="pointer-events-none fixed right-2 z-[1500] sm:bottom-auto sm:right-6 sm:top-6"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="pointer-events-auto"
        style={{ transform: 'scale(0.24)', transformOrigin: 'bottom right' }}
      >
        <GardenCompanion className="h-48 w-44" />
      </div>

      <CompanionInfoPanel />
    </div>
  )
}

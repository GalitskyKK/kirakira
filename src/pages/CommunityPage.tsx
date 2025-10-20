import { TelegramCommunity } from '@/components/telegram'
import { useGardenState, useMoodTracking } from '@/hooks/index.v2'

export function CommunityPage() {
  const { garden } = useGardenState()
  const { moodHistory } = useMoodTracking()

  return (
    <div>
      <TelegramCommunity
        garden={garden}
        recentMoods={moodHistory.slice(0, 7)}
      />
    </div>
  )
}

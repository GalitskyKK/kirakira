import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { ShopContent, type ShopTab } from '@/components/ui/Shop'
import { useCurrencySync } from '@/hooks/useCurrencySync'
import { useTranslation } from '@/hooks/useTranslation'
import { PageHint } from '@/components/ui'
import { PAGE_HINT_IDS } from '@/utils/storage'

const TAB_PARAM_KEY = 'tab'

const resolveTab = (param: string | null): ShopTab => {
  if (param === 'freezes' || param === 'upgrades') {
    return param
  }
  return 'themes'
}

export function ShopPage() {
  const t = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<ShopTab>(
    () => resolveTab(searchParams.get(TAB_PARAM_KEY)),
    [searchParams]
  )
  const [activeTab, setActiveTab] = useState<ShopTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // ✅ Синхронизируем валюту для актуального баланса
  useCurrencySync()

  const handleTabChange = (tab: ShopTab) => {
    setActiveTab(tab)
    if (tab === 'themes') {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ [TAB_PARAM_KEY]: tab }, { replace: true })
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title={t.shop.title}
        icon={<ShoppingBag className="h-5 w-5" />}
      />

      <div className="p-4 pb-24">
        <PageHint
          id={PAGE_HINT_IDS.shop}
          title={t.hints.shop.title}
          description={t.hints.shop.description}
          actionLabel={t.hints.dismiss}
          targetSelector='[data-hint-target="shop-content"]'
          className="mb-4"
        />
        <div data-hint-target="shop-content">
          <ShopContent
            variant="page"
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>
    </motion.div>
  )
}

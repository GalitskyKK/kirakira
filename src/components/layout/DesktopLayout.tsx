import { Outlet } from 'react-router-dom'
import { DesktopNavigation } from './DesktopNavigation'

export function DesktopLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Sidebar Navigation */}
      <DesktopNavigation />

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl px-6 py-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}



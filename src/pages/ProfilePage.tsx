import { useState } from 'react'
import { useUserStore } from '@/stores'
import { useProfile } from '@/hooks/useProfile'

// МАКСИМАЛЬНО ПРОСТАЯ ВЕРСИЯ для диагностики
function SimpleProfilePage() {
  console.log('🔥 SIMPLE ProfilePage rendering started')

  try {
    const [renderTime] = useState(() => new Date().toLocaleTimeString())
    const [debugInfo, setDebugInfo] = useState('Starting...')

    // ПРОСТЕЙШИЕ ХУКИ
    let currentUser, userLoading, profileLoading, profileError

    try {
      const userStore = useUserStore()
      currentUser = userStore.currentUser
      userLoading = userStore.isLoading
      setDebugInfo(prev => prev + ' | UserStore: OK')
    } catch (error) {
      setDebugInfo(prev => prev + ' | UserStore: ERROR - ' + String(error))
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white' }}>
          UserStore Error: {String(error)}
        </div>
      )
    }

    try {
      const profileHook = useProfile()
      profileLoading = profileHook.isLoading
      profileError = profileHook.error
      setDebugInfo(prev => prev + ' | useProfile: OK')
    } catch (error) {
      setDebugInfo(prev => prev + ' | useProfile: ERROR - ' + String(error))
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white' }}>
          useProfile Error: {String(error)}
        </div>
      )
    }

    console.log('🔥 All hooks loaded successfully')

    return (
      <div style={{ padding: '20px' }}>
        {/* КРАСНЫЙ БАННЕР */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#ff0000',
            color: 'white',
            padding: '10px',
            fontSize: '14px',
            zIndex: 9999,
            textAlign: 'center',
          }}
        >
          🔥 SIMPLE ProfilePage LOADED at {renderTime}
        </div>

        <div style={{ marginTop: '60px' }}>
          <div
            style={{
              background: '#ffffcc',
              border: '2px solid #ffaa00',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          >
            <h3>🔍 SIMPLE Debug Info</h3>
            <div>Render Time: {renderTime}</div>
            <div>User Loading: {userLoading ? 'YES' : 'NO'}</div>
            <div>Profile Loading: {profileLoading ? 'YES' : 'NO'}</div>
            <div>Profile Error: {profileError || 'NONE'}</div>
            <div>Current User: {currentUser ? 'EXISTS' : 'MISSING'}</div>
            <div>User ID: {currentUser?.telegramId || 'N/A'}</div>
            <div>Debug: {debugInfo}</div>
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              background: '#eeeeff',
              borderRadius: '8px',
            }}
          >
            <h2>✅ ProfilePage компонент рендерится!</h2>
            <p>Хуки загружены без ошибок.</p>
            {currentUser && (
              <div>
                <p>👤 User: {currentUser.firstName || 'No name'}</p>
                <p>🆔 ID: {currentUser.telegramId}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('💥 ProfilePage crashed completely:', error)
    return (
      <div
        style={{
          padding: '20px',
          background: '#ff0000',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        💥 CRITICAL ERROR: {String(error)}
      </div>
    )
  }
}

export function ProfilePage() {
  return <SimpleProfilePage />
}

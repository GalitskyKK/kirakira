// import { useState } from 'react'
// import { useUserStore } from '@/stores'
// import { useProfile } from '@/hooks/useProfile'

// ЭКСТРЕМАЛЬНО ПРОСТАЯ ВЕРСИЯ - без всех хуков!
function UltraSimpleProfilePage() {
  console.log('🔥 ULTRA SIMPLE ProfilePage START')

  // ТЕСТ 1: Простейший рендер
  return (
    <div
      style={{
        padding: '20px',
        background: '#00ff00',
        color: '#000000',
        fontSize: '18px',
        fontWeight: 'bold',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#00ff00',
          color: '#000000',
          padding: '15px',
          fontSize: '16px',
          zIndex: 9999,
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        ✅ ULTRA SIMPLE ProfilePage РЕНДЕРИТСЯ!
      </div>

      <div style={{ marginTop: '60px' }}>
        <h1>🎉 КОМПОНЕНТ ЗАГРУЖАЕТСЯ!</h1>
        <p>Время: {new Date().toLocaleTimeString()}</p>
        <p>Если вы видите это - компонент работает!</p>
        <p>Проблема была в хуках React.</p>

        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: '#ffff00',
            border: '2px solid #ff0000',
          }}
        >
          <h3>🔍 ТЕСТ ДИАГНОСТИКА</h3>
          <p>✅ ProfilePage компонент вызывается</p>
          <p>✅ Роутинг работает</p>
          <p>✅ Рендер функционирует</p>
          <p>❌ Проблема в React хуках (useState, useUserStore, useProfile)</p>
        </div>
      </div>
    </div>
  )
}

// ТЕСТ 2: Добавим хуки по одному (для следующего этапа)
/*
function TestHooksProfilePage() {
  console.log('🔥 TESTING HOOKS ProfilePage START')
  
  try {
    // Тестируем useState
    const [renderTime] = useState(() => new Date().toLocaleTimeString())
    console.log('✅ useState works')
    
    return (
      <div style={{ padding: '20px', background: '#ffaa00' }}>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: '#ffaa00', color: '#000000', padding: '15px',
          fontSize: '16px', zIndex: 9999, textAlign: 'center', fontWeight: 'bold'
        }}>
          ✅ ProfilePage + useState РАБОТАЕТ!
        </div>
        
        <div style={{ marginTop: '60px' }}>
          <h1>🎉 useState РАБОТАЕТ!</h1>
          <p>Время рендера: {renderTime}</p>
          <p>Проблема НЕ в useState</p>
          
          <div style={{
            marginTop: '20px', padding: '15px', 
            background: '#ffffff', border: '2px solid #00aa00'
          }}>
            <h3>🔍 РЕЗУЛЬТАТ ТЕСТА</h3>
            <p>✅ Компонент рендерится</p>
            <p>✅ useState работает</p>
            <p>❌ Проблема в useUserStore или useProfile</p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('❌ useState crashed:', error)
    return (
      <div style={{ padding: '20px', background: 'red', color: 'white' }}>
        ❌ useState ERROR: {String(error)}
      </div>
    )
  }
}
*/

export function ProfilePage() {
  console.log('🔥 ProfilePage ENTRY POINT')

  // ТЕСТ 1: Вообще без хуков React
  return <UltraSimpleProfilePage />
}

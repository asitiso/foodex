import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { setNativeHapticsAdapter } from './lib/gameFeedback'
import { isNativeApp, nativeHapticsAdapter } from './lib/nativePlatform'
import './companionRoomFix.css'
import './gameSheetFix.css'
import './worldArtFix.css'
import './collectionGameFix.css'

if (isNativeApp()) setNativeHapticsAdapter(nativeHapticsAdapter)

if ('serviceWorker' in navigator && !isNativeApp()) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

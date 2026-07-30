import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { setNativeHapticsAdapter } from './lib/gameFeedback'
import { isNativeApp, nativeHapticsAdapter } from './lib/nativePlatform'

if (isNativeApp()) setNativeHapticsAdapter(nativeHapticsAdapter)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import { App } from './App'
import { AuthProvider } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { CosmeticsProvider } from './context/CosmeticsContext'
import { ProgressProvider } from './context/ProgressContext'
import { SocialProvider } from './context/SocialContext'
import './index.css'

registerSW({ immediate: true })

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró el nodo raíz.')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <SocialProvider>
            <CosmeticsProvider>
              <ProgressProvider>
                <App />
              </ProgressProvider>
            </CosmeticsProvider>
          </SocialProvider>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

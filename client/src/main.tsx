import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/globals.css"
import App from './App.tsx'
import "./auth/attachAuth"
import { AuthProvider } from './auth/AuthContext.tsx'
import { LanguageProvider } from './i18n/LanguageContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
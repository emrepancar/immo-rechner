import { type ReactNode } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { SettingsProvider } from './context/SettingsContext'
import { ProfileProvider } from './context/ProfileContext'
import { ToastProvider } from './context/ToastContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <ProfileProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ProfileProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

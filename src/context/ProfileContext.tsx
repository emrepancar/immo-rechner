import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface ProfileContextValue {
  username: string
  updateUsername: (name: string) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState(() =>
    localStorage.getItem('immorechner-username') || ''
  )

  useEffect(() => {
    if (username) localStorage.setItem('immorechner-username', username)
  }, [username])

  const updateUsername = (newUsername: string) => setUsername(newUsername)

  return (
    <ProfileContext.Provider value={{ username, updateUsername }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used within ProfileProvider')
  return context
}

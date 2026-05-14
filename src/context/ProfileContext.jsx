import { createContext, useContext, useState, useEffect } from 'react'

const ProfileContext = createContext()

export function ProfileProvider({ children }) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('immorechner-username') || ''
  })

  useEffect(() => {
    if (username) {
      localStorage.setItem('immorechner-username', username)
    }
  }, [username])

  const updateUsername = (newUsername) => {
    setUsername(newUsername)
  }

  return (
    <ProfileContext.Provider value={{ username, updateUsername }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}

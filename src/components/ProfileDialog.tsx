import { useState } from 'react'
import React from 'react'
import { useProfile } from '../context/ProfileContext'
import { useLanguage } from '../context/LanguageContext'
import './ProfileDialog.css'

interface ProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const { username, updateUsername } = useProfile()
  const { t } = useLanguage()
  const [inputValue, setInputValue] = useState(username)

  const handleSave = () => {
    if (inputValue.trim()) {
      updateUsername(inputValue.trim())
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="profile-dialog-overlay" onClick={onClose}>
      <div className="profile-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{t.profile.title}</h2>
        <label htmlFor="username">{t.profile.usernameLabel}</label>
        <input
          id="username"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.profile.usernamePlaceholder}
          autoFocus
        />
        <div className="dialog-buttons">
          <button className="btn-cancel" onClick={onClose}>{t.profile.cancel}</button>
          <button className="btn-save" onClick={handleSave}>{t.profile.save}</button>
        </div>
      </div>
    </div>
  )
}

export default ProfileDialog

import { useState } from 'react'
import { GearSix, UserCircle } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'
import { useLanguage } from '../context/LanguageContext'
import ProfileDialog from './ProfileDialog'
import './TopBar.css'

interface TopBarProps {
  onNavigate: (path: string) => void
}

function TopBar({ onNavigate }: TopBarProps) {
  const { username } = useProfile()
  const { t } = useLanguage()
  const location = useLocation()
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-wordmark">
          <span className="topbar-wordmark-serif">Immo</span>
          <span className="topbar-wordmark-mono">· Rechner</span>
        </div>
      </div>
      <div className="topbar-right">
        <button
          className={`topbar-icon-btn ${location.pathname === '/einstellungen' ? 'active' : ''}`}
          onClick={() => onNavigate('/einstellungen')}
          title={t.nav.settings || 'Einstellungen'}
        >
          <GearSix size={18} weight="duotone" />
        </button>
        <button
          className="topbar-profile-btn"
          onClick={() => setIsProfileDialogOpen(true)}
          title={t.nav.profile || 'Profil'}
        >
          <UserCircle size={17} weight="duotone" />
          {username && <span className="topbar-username">{username}</span>}
        </button>
      </div>
      <ProfileDialog isOpen={isProfileDialogOpen} onClose={() => setIsProfileDialogOpen(false)} />
    </header>
  )
}

export default TopBar

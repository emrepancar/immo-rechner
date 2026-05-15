import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useProfile } from '../context/ProfileContext'
import ProfileDialog from './ProfileDialog'
import './Sidebar.css'

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const { t } = useLanguage()
  const { username } = useProfile()
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.greeting.morning
    if (hour < 18) return t.greeting.afternoon
    return t.greeting.evening
  }

  const sections = [
    { id: 'neue-immobilie', label: t.nav.neueImmobilie, icon: '🏠' },
    { id: 'finanzierung', label: t.nav.finanzierung, icon: '💰' },
    { id: 'gespeicherte-immobilien', label: t.nav.gespeicherteObjekte, icon: '💾' },
    { id: 'zinsangebote', label: t.nav.zinsangebote, icon: '📊' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="ImmoRechner" className="logo-full" />
      </div>
      {username && (
        <div className="greeting-section">
          <p className="greeting-text">{getGreeting()}, <span className="username">{username}</span>!</p>
        </div>
      )}
      <nav className="sidebar-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          className={`nav-item footer-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setIsProfileDialogOpen(true)}
          title={t.nav.profile || 'Profile'}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">{t.nav.profile || 'Profile'}</span>
        </button>

        <button
          className={`nav-item footer-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
          title={t.nav.settings || 'Settings'}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">{t.nav.settings || 'Settings'}</span>
        </button>
      </div>

      <ProfileDialog isOpen={isProfileDialogOpen} onClose={() => setIsProfileDialogOpen(false)} />
    </aside>
  )
}

export default Sidebar

import { useLanguage } from '../context/LanguageContext'
import './Sidebar.css'

function Sidebar({ activeSection, setActiveSection }) {
  const { language, setLanguage, t } = useLanguage()

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
      <div className="language-switcher">
        <button
          className={`lang-btn ${language === 'de' ? 'active' : ''}`}
          onClick={() => setLanguage('de')}
        >
          🇩🇪 DE
        </button>
        <button
          className={`lang-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => setLanguage('en')}
        >
          🇬🇧 EN
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

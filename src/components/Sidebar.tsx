import { PlusCircle, Buildings, Calculator, Bank } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import './Sidebar.css'

interface SidebarProps {
  onNavigate: (path: string) => void
}

function Sidebar({ onNavigate }: SidebarProps) {
  const { t } = useLanguage()
  const location = useLocation()

  const sections = [
    { path: '/',                      label: t.nav.neueImmobilie,      Icon: PlusCircle },
    { path: '/gespeicherte-objekte',  label: t.nav.gespeicherteObjekte, Icon: Buildings },
    { path: '/finanzierung',          label: t.nav.finanzierung,        Icon: Calculator },
    { path: '/zinsangebote',          label: t.nav.zinsangebote,        Icon: Bank },
  ]

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {sections.map(({ path, label, Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => onNavigate(path)}
            data-tooltip={label}
          >
            <span className="nav-icon"><Icon size={22} weight="duotone" /></span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar

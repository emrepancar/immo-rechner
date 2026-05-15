import { PlusCircle, Buildings, Calculator, Bank } from '@phosphor-icons/react'
import { useLanguage } from '../context/LanguageContext'
import './Sidebar.css'

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const { t } = useLanguage()

  const sections = [
    { id: 'neue-immobilie',          label: t.nav.neueImmobilie,       Icon: PlusCircle },
    { id: 'gespeicherte-immobilien', label: t.nav.gespeicherteObjekte,  Icon: Buildings },
    { id: 'finanzierung',            label: t.nav.finanzierung,         Icon: Calculator },
    { id: 'zinsangebote',            label: t.nav.zinsangebote,         Icon: Bank },
  ]

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {sections.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeSection === id ? 'active' : ''}`}
            onClick={() => setActiveSection(id)}
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

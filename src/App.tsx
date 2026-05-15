import { useState } from 'react'
import { AppProviders } from './providers'
import { useSettings } from './context/SettingsContext'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import NeueImmobilie from './components/sections/NeueImmobilie'
import Finanzierung from './components/sections/Finanzierung'
import GespeicherteImmobilien from './components/sections/GespeicherteImmobilien'
import Zinsangebote from './components/sections/Zinsangebote'
import Settings from './components/sections/Settings'
import './App.css'

function AppContent() {
  const [activeSection, setActiveSection] = useState('neue-immobilie')
  const { hasUnsavedChanges, discardSettings } = useSettings()
  const [nextSection, setNextSection] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleNavigation = (section: string) => {
    if (activeSection === 'settings' && hasUnsavedChanges) {
      setNextSection(section)
      setShowConfirm(true)
    } else {
      setActiveSection(section)
    }
  }

  const handleConfirmDiscard = () => {
    discardSettings()
    if (nextSection) setActiveSection(nextSection)
    setShowConfirm(false)
  }

  return (
    <>
      <div className="app">
        <TopBar activeSection={activeSection} setActiveSection={handleNavigation} />
        <div className="app-body">
          <Sidebar activeSection={activeSection} setActiveSection={handleNavigation} />
          <main className="content">
            {activeSection === 'neue-immobilie' && <NeueImmobilie />}
            {activeSection === 'finanzierung' && <Finanzierung />}
            {activeSection === 'gespeicherte-immobilien' && <GespeicherteImmobilien />}
            {activeSection === 'zinsangebote' && <Zinsangebote />}
            {activeSection === 'settings' && <Settings />}
          </main>
        </div>
      </div>
      {showConfirm && (
        <div className="confirm-dialog-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Unsaved Changes</h3>
            <p>You have unsaved changes in Settings. Do you want to discard them?</p>
            <div className="confirm-dialog-buttons">
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
              <button onClick={handleConfirmDiscard} className="confirm-discard">Discard</button>
            </div>
          </div>
        </div>
      )}
      <Toast />
    </>
  )
}

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  )
}

export default App

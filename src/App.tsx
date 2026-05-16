import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
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
  const navigate = useNavigate()
  const location = useLocation()
  const { hasUnsavedChanges, discardSettings } = useSettings()
  const [nextPath, setNextPath] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleNavigation = (path: string) => {
    if (location.pathname === '/einstellungen' && hasUnsavedChanges) {
      setNextPath(path)
      setShowConfirm(true)
    } else {
      navigate(path)
    }
  }

  const handleConfirmDiscard = () => {
    discardSettings()
    if (nextPath) navigate(nextPath)
    setShowConfirm(false)
  }

  return (
    <>
      <div className="app">
        <TopBar onNavigate={handleNavigation} />
        <div className="app-body">
          <Sidebar onNavigate={handleNavigation} />
          <main className="content">
            <Routes key={location.pathname}>
              <Route path="/" element={<NeueImmobilie />} />
              <Route path="/finanzierung" element={<Finanzierung />} />
              <Route path="/gespeicherte-objekte" element={<GespeicherteImmobilien />} />
              <Route path="/zinsangebote" element={<Zinsangebote />} />
              <Route path="/einstellungen" element={<div className="section-scroll"><Settings /></div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
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
              <button onClick={handleConfirmDiscard} className="btn btn-danger confirm-discard">Discard</button>
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
    <BrowserRouter>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </BrowserRouter>
  )
}

export default App

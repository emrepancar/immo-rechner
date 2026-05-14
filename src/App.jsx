import { useState } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import NeueImmobilie from './components/sections/NeueImmobilie'
import Finanzierung from './components/sections/Finanzierung'
import GespeicherteImmobilien from './components/sections/GespeicherteImmobilien'
import Zinsangebote from './components/sections/Zinsangebote'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('neue-immobilie')

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="app">
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          <main className="content">
            {activeSection === 'neue-immobilie' && <NeueImmobilie />}
            {activeSection === 'finanzierung' && <Finanzierung />}
            {activeSection === 'gespeicherte-immobilien' && <GespeicherteImmobilien />}
            {activeSection === 'zinsangebote' && <Zinsangebote />}
          </main>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App

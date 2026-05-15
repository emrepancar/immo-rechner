import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { FALLBACK_DEFAULTS } from './src/config/defaults.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'properties.db')
const isProduction = process.env.NODE_ENV === 'production'

// Security
app.use(helmet())
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })

// Middleware
app.use(cors())
app.use(bodyParser.json())

// Validation helpers
function validateProperty(data) {
  const errors = []
  if (!data.name || !String(data.name).trim()) errors.push('Name is required')
  if (data.kaufpreis != null && data.kaufpreis < 0) errors.push('Purchase price cannot be negative')
  if (data.kaltmiete != null && data.kaltmiete < 0) errors.push('Rent cannot be negative')
  if (data.rooms != null && data.rooms < 0) errors.push('Rooms cannot be negative')
  return errors
}

function validateZinsangebot(data) {
  const errors = []
  if (!data.property_id) errors.push('Property ID is required')
  const z = parseFloat(data.zinssatz)
  if (!data.zinssatz || isNaN(z) || z <= 0 || z >= 15) errors.push('Interest rate must be between 0 and 15')
  const zb = parseInt(data.zinsbindung)
  if (data.zinsbindung && (isNaN(zb) || zb <= 0 || zb > 30)) errors.push('Fixed rate period must be between 1 and 30 years')
  return errors
}

// Serve built frontend in production
if (isProduction) {
  const distPath = path.join(__dirname, 'dist')
  app.use(express.static(distPath))
}

// Database setup
const dbPath = DB_PATH
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err)
  } else {
    console.log('Connected to SQLite database at:', dbPath)
    initializeDatabase()
  }
})

// Initialize database schema
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      rooms REAL,
      kaufpreis REAL DEFAULT 0,
      quadratmeter REAL,
      grunderwerbsteuer REAL DEFAULT ${FALLBACK_DEFAULTS.grunderwerbsteuer},
      maklerprovision REAL DEFAULT ${FALLBACK_DEFAULTS.maklerprovision},
      notarkosten REAL DEFAULT ${FALLBACK_DEFAULTS.notarkosten},
      grundbucheintrag REAL DEFAULT ${FALLBACK_DEFAULTS.grundbucheintrag},
      nebenkosten_total REAL DEFAULT 0,
      gesamtkosten REAL DEFAULT 0,
      kaltmiete REAL,
      warmmiete REAL,
      hausgeld REAL,
      inserat_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Migration: add inserat_url to existing databases
  db.run(`ALTER TABLE properties ADD COLUMN inserat_url TEXT`, () => {})

  // Migrations: add new zinsangebote fields
  db.run(`ALTER TABLE zinsangebote ADD COLUMN effektiver_jahreszins REAL`, () => {})
  db.run(`ALTER TABLE zinsangebote ADD COLUMN darlehenssumme REAL`, () => {})
  db.run(`ALTER TABLE zinsangebote ADD COLUMN monatliche_rate REAL`, () => {})
  db.run(`ALTER TABLE zinsangebote ADD COLUMN gesamtbetrag REAL`, () => {})

  db.run(`
    CREATE TABLE IF NOT EXISTS zinsangebote (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      name TEXT,
      zinssatz REAL NOT NULL,
      effektiver_jahreszins REAL,
      eigenkapital_amount REAL,
      eigenkapital_percentage REAL,
      zinsbindung INTEGER,
      darlehenssumme REAL,
      monatliche_rate REAL,
      gesamtbetrag REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `)
}

// Routes
app.use('/api', apiLimiter)

// Get all properties
app.get('/api/properties', (req, res) => {
  db.all('SELECT * FROM properties ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json(rows)
    }
  })
})

// Get single property
app.get('/api/properties/:id', (req, res) => {
  const { id } = req.params
  db.get('SELECT * FROM properties WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else if (!row) {
      res.status(404).json({ error: 'Property not found' })
    } else {
      res.json(row)
    }
  })
})

// Create property
app.post('/api/properties', (req, res) => {
  const errors = validateProperty(req.body)
  if (errors.length) return res.status(400).json({ errors })

  const {
    name,
    address,
    rooms,
    kaufpreis,
    quadratmeter,
    grunderwerbsteuer,
    maklerprovision,
    notarkosten,
    grundbucheintrag,
    nebenkosten_total,
    gesamtkosten,
    kaltmiete,
    warmmiete,
    hausgeld,
  } = req.body

  db.run(
    `INSERT INTO properties (
      name, address, rooms, kaufpreis, quadratmeter,
      grunderwerbsteuer, maklerprovision, notarkosten, grundbucheintrag,
      nebenkosten_total, gesamtkosten, kaltmiete, warmmiete, hausgeld
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, address, rooms, kaufpreis, quadratmeter,
      grunderwerbsteuer, maklerprovision, notarkosten, grundbucheintrag,
      nebenkosten_total, gesamtkosten, kaltmiete, warmmiete, hausgeld,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message })
      } else {
        res.status(201).json({
          id: this.lastID,
          message: 'Property created successfully',
        })
      }
    }
  )
})

// Update property
app.put('/api/properties/:id', (req, res) => {
  const errors = validateProperty(req.body)
  if (errors.length) return res.status(400).json({ errors })

  const { id } = req.params
  const {
    name,
    address,
    rooms,
    kaufpreis,
    quadratmeter,
    grunderwerbsteuer,
    maklerprovision,
    notarkosten,
    grundbucheintrag,
    nebenkosten_total,
    gesamtkosten,
    kaltmiete,
    warmmiete,
    hausgeld,
  } = req.body

  db.run(
    `UPDATE properties SET
      name = ?, address = ?, rooms = ?, kaufpreis = ?, quadratmeter = ?,
      grunderwerbsteuer = ?, maklerprovision = ?, notarkosten = ?, grundbucheintrag = ?,
      nebenkosten_total = ?, gesamtkosten = ?, kaltmiete = ?, warmmiete = ?, hausgeld = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      name, address, rooms, kaufpreis, quadratmeter,
      grunderwerbsteuer, maklerprovision, notarkosten, grundbucheintrag,
      nebenkosten_total, gesamtkosten, kaltmiete, warmmiete, hausgeld, id,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message })
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Property not found' })
      } else {
        res.json({ message: 'Property updated successfully' })
      }
    }
  )
})

// Delete property
app.delete('/api/properties/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM properties WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Property not found' })
    } else {
      res.json({ message: 'Property deleted successfully' })
    }
  })
})

// Get all zinsangebote for a property
app.get('/api/zinsangebote', (req, res) => {
  const { property_id } = req.query
  if (!property_id) {
    return res.status(400).json({ error: 'property_id required' })
  }
  db.all('SELECT * FROM zinsangebote WHERE property_id = ? ORDER BY created_at DESC', [property_id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json(rows || [])
    }
  })
})

// Get single zinsangebot
app.get('/api/zinsangebote/:id', (req, res) => {
  const { id } = req.params
  db.get('SELECT * FROM zinsangebote WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else if (!row) {
      res.status(404).json({ error: 'Zinsangebot not found' })
    } else {
      res.json(row)
    }
  })
})

// Create zinsangebot
app.post('/api/zinsangebote', (req, res) => {
  const errors = validateZinsangebot(req.body)
  if (errors.length) return res.status(400).json({ errors })

  const {
    property_id,
    name,
    zinssatz,
    effektiver_jahreszins,
    eigenkapital_amount,
    eigenkapital_percentage,
    zinsbindung,
    darlehenssumme,
    monatliche_rate,
    gesamtbetrag,
  } = req.body

  db.run(
    `INSERT INTO zinsangebote (
      property_id, name, zinssatz, effektiver_jahreszins,
      eigenkapital_amount, eigenkapital_percentage, zinsbindung,
      darlehenssumme, monatliche_rate, gesamtbetrag
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [property_id, name, zinssatz, effektiver_jahreszins ?? null,
     eigenkapital_amount, eigenkapital_percentage, zinsbindung,
     darlehenssumme ?? null, monatliche_rate ?? null, gesamtbetrag ?? null],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message })
      } else {
        res.status(201).json({
          id: this.lastID,
          message: 'Zinsangebot created successfully',
        })
      }
    }
  )
})

// Update zinsangebot
app.put('/api/zinsangebote/:id', (req, res) => {
  const errors = validateZinsangebot(req.body)
  if (errors.length) return res.status(400).json({ errors })

  const { id } = req.params
  const {
    property_id,
    name,
    zinssatz,
    effektiver_jahreszins,
    eigenkapital_amount,
    eigenkapital_percentage,
    zinsbindung,
    darlehenssumme,
    monatliche_rate,
    gesamtbetrag,
  } = req.body

  db.run(
    `UPDATE zinsangebote SET
      property_id = ?, name = ?, zinssatz = ?, effektiver_jahreszins = ?,
      eigenkapital_amount = ?, eigenkapital_percentage = ?, zinsbindung = ?,
      darlehenssumme = ?, monatliche_rate = ?, gesamtbetrag = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [property_id, name, zinssatz, effektiver_jahreszins ?? null,
     eigenkapital_amount, eigenkapital_percentage, zinsbindung,
     darlehenssumme ?? null, monatliche_rate ?? null, gesamtbetrag ?? null, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message })
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Zinsangebot not found' })
      } else {
        res.json({ message: 'Zinsangebot updated successfully' })
      }
    }
  )
})

// Delete zinsangebot
app.delete('/api/zinsangebote/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM zinsangebote WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Zinsangebot not found' })
    } else {
      res.json({ message: 'Zinsangebot deleted successfully' })
    }
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// Catch-all: serve frontend for non-API routes in production
if (isProduction) {
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${isProduction ? 'production' : 'development'}]`)
})

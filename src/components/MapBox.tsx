import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin } from '@phosphor-icons/react'
import './MapBox.css'

// Leaflet CSS must be loaded once
import 'leaflet/dist/leaflet.css'

interface MapBoxProps {
  address: string
}

interface GeoResult {
  lat: number
  lon: number
  display_name: string
}

import type * as LType from 'leaflet'

let L: typeof LType | null = null

async function getLeaflet(): Promise<typeof LType> {
  if (!L) {
    const mod = await import('leaflet')
    L = mod as unknown as typeof LType
  }
  return L!
}

async function geocode(address: string): Promise<GeoResult | null> {
  if (!address.trim()) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'de,en' } })
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display_name: data[0].display_name }
  } catch {
    return null
  }
}

export default function MapBox({ address }: MapBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LType.Map | null>(null)
  const markerRef = useRef<LType.Marker | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle')
  const [foundAddress, setFoundAddress] = useState('')

  // Init map once
  useEffect(() => {
    let destroyed = false
    ;(async () => {
      const leaflet = await getLeaflet()
      if (destroyed || !containerRef.current || mapRef.current) return

      // Fix default icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = leaflet.map(containerRef.current, { zoomControl: true, attributionControl: false })
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      // Default view: Germany
      map.setView([51.1657, 10.4515], 5)
      mapRef.current = map
    })()
    return () => { destroyed = true }
  }, [])

  const updateMap = useCallback(async (addr: string) => {
    if (!addr.trim()) { setStatus('idle'); return }
    setStatus('loading')
    const result = await geocode(addr)
    if (!result) { setStatus('notfound'); return }

    const leaflet = await getLeaflet()
    const map = mapRef.current
    if (!map) return

    if (markerRef.current) markerRef.current.remove()
    const marker = leaflet.marker([result.lat, result.lon]).addTo(map)
    markerRef.current = marker
    map.setView([result.lat, result.lon], 15, { animate: true })
    setFoundAddress(result.display_name)
    setStatus('found')
  }, [])

  // Debounce address changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!address.trim()) { setStatus('idle'); return }
    setStatus('loading')
    timerRef.current = setTimeout(() => updateMap(address), 700)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [address, updateMap])

  return (
    <div className="map-box">
      <div className="map-box-header">
        <MapPin size={15} weight="duotone" />
        <span>Standort</span>
        {status === 'loading' && <span className="map-status loading">Suche…</span>}
        {status === 'notfound' && <span className="map-status notfound">Nicht gefunden</span>}
      </div>
      <div className="map-box-body">
        <div ref={containerRef} className="map-container" />
        {status === 'idle' && (
          <div className="map-placeholder">
            <MapPin size={36} weight="duotone" />
            <p>Adresse eingeben, um den Standort anzuzeigen</p>
          </div>
        )}
      </div>
      {status === 'found' && foundAddress && (
        <div className="map-box-footer" title={foundAddress}>
          {foundAddress}
        </div>
      )}
    </div>
  )
}

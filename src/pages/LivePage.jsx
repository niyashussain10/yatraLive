import { useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getLiveLocation, getNextDestination } from '../firebase/firestore'
import './LivePage.css'

// Fix for default marker icon
delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ---------- helpers ----------
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
      {
        headers: {
          'User-Agent': 'YatraTracker/1.0' // Required by Nominatim
        }
      }
    )
    const data = await res.json()
    
    if (!data.address) {
      return { place: '', district: '' }
    }
    
    const address = data.address
    
    // Better priority for area names (especially for Bangalore)
    const place = 
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.village ||
      address.city_district ||
      ''
    
    const district =
      address.state_district ||
      address.county ||
      address.city ||
      address.town ||
      ''
    
    return { place, district }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return { place: '', district: '' }
  }
}

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true })
  }, [lat, lng])
  return null
}

// ---------- main ----------
function LivePage() {
  const [location, setLocation] = useState(null)
  const [nextDestination, setNextDestination] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [error, setError] = useState(null)

  const [path, setPath] = useState([])
  const [status, setStatus] = useState('MOVING')
  const [lang, setLang] = useState('en')

  const labels = {
    en: {
      title: 'Kanthapuram Usthad Kerala Yatra – Live Location',
      moving: '🟢 Moving',
      halted: '🔴 Halted',
      share: 'Share Live Link',
      nextDestination: 'Next Destination',
      arrivalTime: 'Arrival Time',
      note: 'Note',
    },
    ml: {
      title: 'കാന്തപുരം ഉസ്താദ് കേരള യാത്ര – തത്സമയ സ്ഥാനം',
      moving: '🟢 യാത്ര തുടരുന്നു',
      halted: '🔴 നിർത്തിയിരിക്കുന്നു',
      share: 'ലൈവ് ലിങ്ക് പങ്കിടുക',
      nextDestination: 'അടുത്ത ലക്ഷ്യസ്ഥാനം',
      arrivalTime: 'എത്തുന്ന സമയം',
      note: 'കുറിപ്പ്',
    },
  }

  const fetchLocation = async () => {
    try {
      const [locationData, destinationData] = await Promise.all([
        getLiveLocation(),
        getNextDestination()
      ])

      if (destinationData) {
        setNextDestination(destinationData)
      }

      if (!locationData?.lat || !locationData?.lng) return

      const lat = Number(locationData.lat)
      const lng = Number(locationData.lng)

      if (isNaN(lat) || isNaN(lng)) return

      // Use stored placeName and district if available, otherwise reverse geocode
      const placeName = locationData.placeName || ''
      const district = locationData.district || ''
      
      let placeInfo = { place: placeName, district }
      if (!placeName) {
        placeInfo = await reverseGeocode(lat, lng)
      }

      setLocation({
        lat,
        lng,
        placeName: placeInfo.place || placeName,
        district: placeInfo.district || district,
      })

      setLastUpdated(
        locationData.lastUpdated?.toDate
          ? locationData.lastUpdated.toDate()
          : new Date()
      )

      // Use status from Firestore if available, otherwise calculate from movement
      if (locationData.status) {
        setStatus(locationData.status)
      } else {
        // Auto-detect status from movement
        setPath((prev) => {
          if (prev.length === 0) {
            setStatus('MOVING')
            return [[lat, lng]]
          }
          const [pLat, pLng] = prev[prev.length - 1]
          const dist = haversine(pLat, pLng, lat, lng)
          setStatus(dist < 20 ? 'HALTED' : 'MOVING')
          return [...prev.slice(-50), [lat, lng]]
        })
        return // Exit early if auto-detecting
      }

      // Update path for polyline (when status is from Firestore)
      setPath((prev) => {
        if (prev.length === 0) return [[lat, lng]]
        return [...prev.slice(-50), [lat, lng]]
      })

      setError(null)
    } catch (err) {
      setError('Failed to fetch location')
    }
  }

  useEffect(() => {
    fetchLocation()
    const i = setInterval(fetchLocation, 12000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (!lastUpdated) return
    const i = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000))
    }, 1000)
    return () => clearInterval(i)
  }, [lastUpdated])

  const formatTimeAgo = (s) =>
    s < 60
      ? `${s}s ago`
      : s < 3600
      ? `${Math.floor(s / 60)}m ago`
      : `${Math.floor(s / 3600)}h ago`

  const shareLink = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: labels[lang].title, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied')
    }
  }

  return (
    <div className="live-page">
      <header className="live-header">
        <h1>{labels[lang].title}</h1>

        {location?.placeName && (
          <p className="current-location-name">
            📍 {location.placeName}
            {location.district && `, ${location.district}`}
          </p>
        )}

        {nextDestination?.destination && (
          <div className="next-destination-info">
            <div className="destination-header">
              <span className="destination-icon">🎯</span>
              <strong>{labels[lang].nextDestination}</strong>
            </div>
            <p className="destination-name">{nextDestination.destination}</p>
            {nextDestination.district && (
              <p className="destination-district">{nextDestination.district}</p>
            )}
            {nextDestination.arrivalTime && (
              <p className="destination-time">
                <span className="time-icon">⏰</span>
                <strong>{labels[lang].arrivalTime}:</strong> {nextDestination.arrivalTime}
              </p>
            )}
            {nextDestination.note && (
              <p className="destination-note">
                <span className="note-icon">📝</span>
                {nextDestination.note}
              </p>
            )}
          </div>
        )}

        <p className={status === 'MOVING' ? 'moving' : 'halted'}>
          {status === 'MOVING'
            ? labels[lang].moving
            : labels[lang].halted}
        </p>

        {lastUpdated && (
          <p className="last-updated">
            Last updated {formatTimeAgo(secondsAgo)}
          </p>
        )}

        <div className="top-actions">
          <button onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}>
            🌐 EN / മലയാളം
          </button>
          <button onClick={shareLink}>🔗 {labels[lang].share}</button>
        </div>
      </header>

      <main className="live-main">
        {error && <div className="error-message">{error}</div>}

        {location && (
          <div className="map-container">
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={13}
              scrollWheelZoom
            >
              <RecenterMap lat={location.lat} lng={location.lng} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={path} color="blue" />
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  <div className="popup-content">
                    <strong>📍 {location.placeName || 'Current Location'}</strong>
                    {location.district && (
                      <p className="popup-location-name">{location.district}</p>
                    )}
                    <p className="coordinates">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </main>

      <footer className="live-footer">
        Live location shown for public convenience. Location is approximate.
      </footer>
    </div>
  )
}

export default LivePage

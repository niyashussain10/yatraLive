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
          'User-Agent': 'YatraTracker/1.0'
        }
      }
    )
    const data = await res.json()
    
    if (!data.address) {
      return { place: '', district: '' }
    }
    
    const address = data.address
    
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
  }, [lat, lng, map])
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
      title: 'Kanthapuram Usthad Kerala Yatra',
      subtitle: 'Live Location',
      moving: 'Moving',
      halted: 'Stopped',
      share: 'Share',
      nextDestination: 'Next Destination',
      arrivalTime: 'Approx Arrival',
      currentDistrict: 'Current District',
      district: 'District',
      lastUpdated: 'Last updated',
    },
    ml: {
      title: 'കാന്തപുരം ഉസ്താദ് കേരള യാത്ര',
      subtitle: 'തത്സമയ സ്ഥാനം',
      moving: 'യാത്ര തുടരുന്നു',
      halted: 'നിർത്തിയിരിക്കുന്നു',
      share: 'പങ്കിടുക',
      nextDestination: 'അടുത്ത ലക്ഷ്യസ്ഥാനം',
      arrivalTime: 'എത്തുന്ന സമയം',
      currentDistrict: 'നിലവിലെ ജില്ല',
      district: 'ജില്ല',
      lastUpdated: 'അവസാനം അപ്ഡേറ്റ്',
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

      if (locationData.status) {
        setStatus(locationData.status)
      } else {
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
        return
      }

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
        <div className="header-content">
          <div>
            <h1>{labels[lang].title}</h1>
            <p className="header-subtitle">{labels[lang].subtitle}</p>
          </div>
        </div>
      </header>

      <div className="status-strip">
        <span className={`status-dot ${status === 'MOVING' ? 'moving' : 'halted'}`}></span>
        <span className="status-text">{status === 'MOVING' ? labels[lang].moving : labels[lang].halted}</span>
        <span className="status-separator">|</span>
        <span className="status-district">{location?.district || labels[lang].currentDistrict}</span>
        <span className="status-separator">|</span>
        <span className="status-time">{labels[lang].lastUpdated} {lastUpdated ? formatTimeAgo(secondsAgo) : '--'}</span>
      </div>

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
              {path.length > 1 && <Polyline positions={path} color="#22c55e" weight={4} opacity={0.8} />}
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  <div className="popup-content">
                    <strong>{location.placeName || 'Current Location'}</strong>
                    {location.district && (
                      <p>{location.district}</p>
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

      {nextDestination?.destination && (
        <div className="destination-card">
          <div className="destination-row">
            <span className="destination-label">{labels[lang].nextDestination}</span>
            <span className="destination-value">{nextDestination.destination}</span>
          </div>
          {nextDestination.district && (
            <div className="destination-row">
              <span className="destination-label">{labels[lang].district}</span>
              <span className="destination-value">{nextDestination.district}</span>
            </div>
          )}
          {nextDestination.arrivalTime && (
            <div className="destination-row">
              <span className="destination-label">{labels[lang].arrivalTime}</span>
              <span className="destination-value">{nextDestination.arrivalTime}</span>
            </div>
          )}
        </div>
      )}

      <footer className="live-footer">
        <div className="footer-content">
          <p className="footer-disclaimer">
            Live location shown for public convenience. Location is approximate.
          </p>
          <div className="footer-actions">
            <button className="footer-btn" onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}>
              {lang === 'en' ? 'മലയാളം' : 'EN'}
            </button>
            <button className="footer-btn" onClick={shareLink}>
              {labels[lang].share}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LivePage

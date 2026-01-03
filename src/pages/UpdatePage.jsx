import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { updateLiveLocation, updateNextDestination } from '../firebase/firestore'
import { getLocationDetails, geocodeAddress } from '../utils/geocoding'
import './UpdatePage.css'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'

function UpdatePage() {
  const [location, setLocation] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [district, setDistrict] = useState('')
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')
  const [yatraStatus, setYatraStatus] = useState('MOVING') // MOVING or HALTED
  const [isUpdating, setIsUpdating] = useState(false)
  const [isFetchingName, setIsFetchingName] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const intervalRef = useRef(null)
  
  // Next destination form
  const [destination, setDestination] = useState('')
  const [destDistrict, setDestDistrict] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [note, setNote] = useState('')
  const [isSavingDestination, setIsSavingDestination] = useState(false)
  const [destinationSearch, setDestinationSearch] = useState('')
  const [destinationCoords, setDestinationCoords] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState(null)

  // Kerala districts list
  const keralaDistricts = [
    'Alappuzha',
    'Ernakulam',
    'Idukki',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Kottayam',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Thrissur',
    'Wayanad',
    'Other'
  ]

  // Round to 4 decimal places for privacy
  const roundLocation = (coord) => {
    return Math.round(coord * 10000) / 10000
  }

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = roundLocation(position.coords.latitude)
        const lng = roundLocation(position.coords.longitude)
        setLocation({ lat, lng })
        setError(null)
        
        // Fetch location details
        setIsFetchingName(true)
        try {
          const details = await getLocationDetails(lat, lng)
          setLocationName(details.place)
          setDistrict(details.district)
        } catch (err) {
          console.error('Error fetching location details:', err)
          setLocationName('')
          setDistrict('')
        } finally {
          setIsFetchingName(false)
        }
      },
      (err) => {
        setError(`Error getting location: ${err.message}`)
        setLocation(null)
        setLocationName('')
        setDistrict('')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const updateLocation = async () => {
    if (!location) {
      setStatus('No location available')
      return
    }

    setIsUpdating(true)
    setError(null)
    
    // Fetch location details if not already fetched
    let placeName = locationName
    let locDistrict = district
    if (!placeName) {
      setIsFetchingName(true)
      try {
        const details = await getLocationDetails(location.lat, location.lng)
        placeName = details.place
        locDistrict = details.district
        setLocationName(placeName)
        setDistrict(locDistrict)
      } catch (err) {
        console.error('Error fetching location details:', err)
        placeName = ''
        locDistrict = ''
      } finally {
        setIsFetchingName(false)
      }
    }
    
    try {
      await updateLiveLocation(location.lat, location.lng, placeName, locDistrict, yatraStatus)
      setStatus('Location updated successfully')
      setError(null)
    } catch (err) {
      const errorMessage = err.message || 'Unknown error'
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        setError('Firestore rules not deployed. Please deploy security rules in Firebase Console.')
        setStatus('Error: Missing or insufficient permissions')
      } else {
        setError(`Error: ${errorMessage}`)
        setStatus(`Error: ${errorMessage}`)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDestinationSearch = async () => {
    if (!destinationSearch.trim()) {
      setGeocodeError('Please enter a destination to search')
      return
    }

    setIsGeocoding(true)
    setGeocodeError(null)
    
    try {
      const result = await geocodeAddress(destinationSearch)
      if (result) {
        setDestinationCoords({ lat: result.lat, lng: result.lng })
        setDestination(result.displayName)
        // Try to extract district from address
        if (result.address) {
          const district = result.address.state_district || 
                          result.address.county || 
                          result.address.city || 
                          result.address.town || ''
          if (district) {
            setDestDistrict(district)
          }
        }
        setGeocodeError(null)
      } else {
        setGeocodeError('Location not found. Please try a different search term.')
      }
    } catch (err) {
      setGeocodeError(`Error searching location: ${err.message}`)
    } finally {
      setIsGeocoding(false)
    }
  }

  const saveDestination = async (e) => {
    e.preventDefault()
    setIsSavingDestination(true)
    setError(null)
    
    try {
      // If we have coordinates, use them; otherwise try to geocode the destination name
      let lat = destinationCoords?.lat || null
      let lng = destinationCoords?.lng || null
      
      // If no coordinates but we have a destination name, try to geocode it
      if (!lat && !lng && destination.trim()) {
        try {
          const geocodeResult = await geocodeAddress(destination)
          if (geocodeResult) {
            lat = geocodeResult.lat
            lng = geocodeResult.lng
          }
        } catch (geocodeErr) {
          console.warn('Could not geocode destination:', geocodeErr)
          // Continue without coordinates
        }
      }
      
      await updateNextDestination(destination, destDistrict, arrivalTime, note, lat, lng)
      setStatus('Next destination saved successfully')
      // Clear form
      setDestination('')
      setDestDistrict('')
      setArrivalTime('')
      setNote('')
      setDestinationSearch('')
      setDestinationCoords(null)
    } catch (err) {
      setError(`Error saving destination: ${err.message}`)
    } finally {
      setIsSavingDestination(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setLocation(null)
    setLocationName('')
    setDistrict('')
    setYatraStatus('MOVING')
    setError(null)
    setStatus('')
    setPinInput('')
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Initial location fetch
      getCurrentLocation()

      // Set up auto-update every 60 seconds
      intervalRef.current = setInterval(() => {
        getCurrentLocation()
      }, 60000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && location) {
      // Only update if we're not currently fetching name
      // This prevents race conditions where updateLocation is called before locationName is set
      if (!isFetchingName) {
        // Small delay to ensure locationName is set if it was just fetched in getCurrentLocation
        const timer = setTimeout(() => {
          updateLocation()
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, isAuthenticated])

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true)
      getCurrentLocation()
    } else {
      setError('Incorrect PIN')
      setPinInput('')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="update-page">
        <div className="update-container">
          <h1>Yatra Location Update</h1>
          <p className="subtitle">Enter PIN to access</p>
          <form onSubmit={handlePinSubmit} className="pin-form">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              className="pin-input"
              maxLength="10"
            />
            <button type="submit" className="btn-primary">
              Submit
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="update-page">
      <div className="update-container">
        <div className="header-actions">
          <h1>Yatra Location Update</h1>
          <div className="header-buttons">
            <Link to="/live" className="btn-live-link">
              🔗 View Live Page
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
        
        <div className="status-section">
          {location ? (
            <div className="location-info">
              {locationName && (
                <p className="location-name">
                  <strong>📍 Current Location:</strong> {locationName}
                  {district && `, ${district}`}
                </p>
              )}
              {isFetchingName && (
                <p className="fetching-name">Fetching location name...</p>
              )}
              <p><strong>Latitude:</strong> {location.lat}</p>
              <p><strong>Longitude:</strong> {location.lng}</p>
            </div>
          ) : (
            <p>Getting location...</p>
          )}
          
          {error && <p className="error">{error}</p>}
          
          {status && (
            <p className={`status ${isUpdating ? 'updating' : 'success'}`}>
              {status}
            </p>
          )}
        </div>

        <div className="status-toggle-section">
          <label className="status-toggle-label">Yatra Status:</label>
          <div className="status-toggle-buttons">
            <button
              type="button"
              className={`status-toggle-btn ${yatraStatus === 'MOVING' ? 'active moving' : ''}`}
              onClick={() => setYatraStatus('MOVING')}
            >
              🟢 Moving
            </button>
            <button
              type="button"
              className={`status-toggle-btn ${yatraStatus === 'HALTED' ? 'active halted' : ''}`}
              onClick={() => setYatraStatus('HALTED')}
            >
              🔴 Halted
            </button>
          </div>
        </div>

        <div className="button-group">
          <button onClick={getCurrentLocation} className="btn-primary">
            Get Current Location
          </button>
          {location && (
            <button 
              onClick={updateLocation} 
              className="btn-secondary"
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          )}
        </div>

        <div className="info-box">
          <p>📍 Location will auto-update every 60 seconds</p>
          <p>🔒 Coordinates rounded to 4 decimal places for privacy</p>
        </div>

        <div className="destination-section">
          <h2>Next Destination</h2>
          <div className="destination-search-section">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search location (e.g., Kanthapuram, Kerala or address)"
                value={destinationSearch}
                onChange={(e) => setDestinationSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleDestinationSearch()
                  }
                }}
                className="form-input"
              />
              <button
                type="button"
                onClick={handleDestinationSearch}
                className="btn-search"
                disabled={isGeocoding}
              >
                {isGeocoding ? 'Searching...' : '🔍 Search'}
              </button>
            </div>
            {geocodeError && <p className="error-small">{geocodeError}</p>}
            {destinationCoords && (
              <p className="success-small">
                ✓ Location found: {destinationCoords.lat.toFixed(4)}, {destinationCoords.lng.toFixed(4)}
              </p>
            )}
          </div>
          <form onSubmit={saveDestination} className="destination-form">
            <input
              type="text"
              placeholder="Destination (auto-filled from search or enter manually)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="form-input"
              required
            />
            <select
              value={destDistrict}
              onChange={(e) => setDestDistrict(e.target.value)}
              className="form-input form-select"
              required
            >
              <option value="">Select District</option>
              {keralaDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Arrival Time (e.g., 3:00 PM)"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="form-input"
            />
            <textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-textarea"
              rows="3"
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSavingDestination}
            >
              {isSavingDestination ? 'Saving...' : 'Save Destination'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UpdatePage


/**
 * Geocode an address to get coordinates
 * Uses Nominatim (OpenStreetMap) - free and no API key required
 */
export async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YatraTracker/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to geocode address')
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        address: result.address || {}
      }
    }

    return null
  } catch (error) {
    console.error('Error geocoding address:', error)
    throw error
  }
}

/**
 * Get location name from coordinates
 */
export async function getLocationName(lat, lng) {
  try {
    const details = await getLocationDetails(lat, lng)
    if (details.place) {
      return details.place
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch (error) {
    console.error('Error getting location name:', error)
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

export async function getLocationDetails(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
      {
        headers: {
          'User-Agent': 'YatraTracker/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch location name')
    }

    const data = await response.json()
    
    if (data.address) {
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
    }

    return { place: '', district: '' }
  } catch (error) {
    console.error('Error getting location details:', error)
    return { place: '', district: '' }
  }
}

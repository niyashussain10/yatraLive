/**
 * Reverse geocoding utility using OpenStreetMap Nominatim API
 * Gets location name from coordinates with improved accuracy
 */

export async function getLocationName(lat, lng) {
  try {
    const result = await getLocationDetails(lat, lng)
    return result.place || result.district || 'Unknown Location'
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


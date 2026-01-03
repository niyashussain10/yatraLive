/**
 * Get route between two points using OSRM (Open Source Routing Machine)
 * Returns the actual road path, not a straight line
 */
export async function getRoute(startLat, startLng, endLat, endLng) {
  try {
    // Using OSRM demo server (free, no API key required)
    // Format: /route/v1/driving/{coordinates}?overview=full&geometries=geojson
    const coordinates = `${startLng},${startLat};${endLng},${endLat}`
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Failed to get route')
    }
    
    const data = await response.json()
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
      const path = route.geometry.coordinates.map(coord => [coord[1], coord[0]])
      
      return {
        path,
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting route:', error)
    // Fallback to straight line if routing fails
    return null
  }
}


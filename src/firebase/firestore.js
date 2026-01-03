import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

/**
 * Get the current live location from Firestore
 */
export async function getLiveLocation() {
  try {
    const docRef = doc(db, 'liveLocation', 'current')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error('Error getting live location:', error)
    throw error
  }
}

/**
 * Update the live location in Firestore
 */
export async function updateLiveLocation(lat, lng, placeName = '', district = '', status = 'MOVING') {
  try {
    const docRef = doc(db, 'liveLocation', 'current')
    await setDoc(docRef, {
      lat: lat,
      lng: lng,
      placeName: placeName || '',
      district: district || '',
      status: status || 'MOVING',
      lastUpdated: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error updating live location:', error)
    throw error
  }
}

/**
 * Get next destination from Firestore
 */
export async function getNextDestination() {
  try {
    const docRef = doc(db, 'yatraSchedule', 'next')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error('Error getting next destination:', error)
    throw error
  }
}

/**
 * Update next destination in Firestore
 */
export async function updateNextDestination(destination, district, arrivalTime, note) {
  try {
    const docRef = doc(db, 'yatraSchedule', 'next')
    await setDoc(docRef, {
      destination: destination || '',
      district: district || '',
      arrivalTime: arrivalTime || '',
      note: note || '',
      lastUpdated: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error updating next destination:', error)
    throw error
  }
}


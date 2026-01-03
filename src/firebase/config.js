// Firebase configuration
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBhF-1y3lOxMUHSnpd5x-oF7QU15KgHTMc",
  authDomain: "yatralive-eeaa9.firebaseapp.com",
  projectId: "yatralive-eeaa9",
  storageBucket: "yatralive-eeaa9.firebasestorage.app",
  messagingSenderId: "817612892730",
  appId: "1:817612892730:web:e9278683db36bab63b2303",
  measurementId: "G-HFEHZH1M27"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

export default app


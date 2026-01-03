# Kanthapuram Usthad Kerala Yatra - Live Location Tracker

A production-ready React web app for tracking and displaying live location of a religious yatra using Firebase Firestore and Leaflet maps.

## Features

- **Update Page** (`/update`): Admin page with PIN authentication for updating location
- **Live Page** (`/live`): Public page displaying real-time location on OpenStreetMap
- Auto-updates every 60 seconds (update page) and 12 seconds (live page)
- Privacy-focused: Coordinates rounded to 4 decimal places
- Mobile-friendly and TV screen optimized
- Next destination tracking
- Language toggle (English / Malayalam)
- Share live link functionality

## Tech Stack

- React 18 with Vite
- Firebase Firestore (free tier)
- Leaflet with OpenStreetMap tiles
- React Router for navigation
- Deployed on Vercel

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ADMIN_PIN=1234
```

Replace `1234` with your desired admin PIN.

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Copy your Firebase configuration
4. Update `src/firebase/config.js` with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### 4. Firebase Security Rules

Deploy the Firestore rules to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

Or manually copy the rules from `firestore.rules` to Firebase Console:
- Go to Firestore Database → Rules
- Paste the rules and publish

The rules allow:
- Public read access for `liveLocation/current` and `yatraSchedule/next`
- Write access until January 20, 2026

### 5. Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variable in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `VITE_ADMIN_PIN` with your PIN value

### Option 2: Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add Environment Variable: `VITE_ADMIN_PIN=your_pin`
6. Deploy

## Firestore Structure

The app uses two documents:

### 1. Live Location
- **Collection**: `liveLocation`
- **Document**: `current`
- **Fields**:
  - `lat` (number): Latitude
  - `lng` (number): Longitude
  - `placeName` (string): Current place name
  - `district` (string): District name
  - `lastUpdated` (timestamp): Last update time

### 2. Next Destination
- **Collection**: `yatraSchedule`
- **Document**: `next`
- **Fields**:
  - `destination` (string): Destination name
  - `district` (string): District name
  - `arrivalTime` (string): Expected arrival time
  - `note` (string, optional): Additional notes
  - `lastUpdated` (timestamp): Last update time

## Routes

- `/` or `/live` - Public live tracking page
- `/update` - Admin update page (PIN protected)

## Admin Features

- PIN-based authentication (from environment variable)
- GPS location tracking
- Auto-update every 60 seconds
- Manual update button
- Next destination management
- Logout functionality

## Public Features

- Real-time location display on map
- Route polyline showing movement path
- Moving/Halted status detection
- Next destination information
- Language toggle (English / Malayalam)
- Share live link button
- Auto-refresh every 12 seconds

## Privacy & Safety Features

- Coordinates rounded to 4 decimal places (~11 meters accuracy)
- No exact tracking
- No speed information displayed
- Approximate location only
- Footer disclaimer on live page

## Browser Compatibility

- Modern browsers with Geolocation API support
- HTTPS required for geolocation (automatic on Vercel)

## License

MIT

## Support

For issues or questions, please check the Firebase and Vercel documentation.

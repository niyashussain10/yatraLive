# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore Database** (start in test mode, we'll add rules)
4. Go to Project Settings → General → Your apps → Web app
5. Copy the Firebase configuration object
6. Open `src/firebase/config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...", // Your actual API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

## Step 3: Deploy Firestore Rules

### Option A: Using Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Select your project
# Use existing firestore.rules file
firebase deploy --only firestore:rules
```

### Option B: Manual (Firebase Console)
1. Go to Firestore Database → Rules
2. Copy content from `firestore.rules`
3. Paste and Publish

## Step 4: Change PIN (Optional)
Edit `src/pages/UpdatePage.jsx`:
```javascript
const PIN = '1234' // Change to your desired PIN
```

## Step 5: Test Locally
```bash
npm run dev
```

Visit:
- `http://localhost:5173/live` - Public tracking page
- `http://localhost:5173/update` - Update page (PIN: 1234)

## Step 6: Deploy to Vercel

### Using Vercel CLI:
```bash
npm install -g vercel
vercel
```

### Using Vercel Dashboard:
1. Push code to GitHub
2. Import project in Vercel
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

## Important Notes

- **HTTPS Required**: Geolocation API only works over HTTPS (automatic on Vercel)
- **Browser Permissions**: Users must allow location access on the update page
- **Firestore Limits**: Free tier allows 50K reads/day and 20K writes/day
- **PIN Security**: The PIN is client-side only. For production, consider Firebase Auth

## Troubleshooting

**Map not showing?**
- Check browser console for errors
- Ensure Leaflet CSS is loaded (check index.html)

**Location not updating?**
- Check Firebase console for write errors
- Verify Firestore rules are deployed
- Check browser console for errors

**Geolocation not working?**
- Must be on HTTPS (or localhost)
- User must grant permission
- Check browser compatibility


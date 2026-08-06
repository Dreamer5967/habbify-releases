# Firebase Setup Guide for Habbify

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter "habbify" as the project name
4. Follow the setup wizard

## Step 2: Enable Google Authentication

1. In the Firebase Console, go to **Authentication**
2. Click on **Sign-in method**
3. Enable **Google** as a sign-in provider
4. Add your domain(s) to the OAuth consent screen if needed
5. In **Authentication > Settings > Authorized domains**, add:
  - `localhost`
  - `127.0.0.1`
  - `habbify-b4d31.firebaseapp.com`
  - `habbify-b4d31.web.app` if you use the hosted site

## Step 2b: Check API Key Restrictions

If Google sign-in shows a referrer or invalid action error, open **Google Cloud Console > APIs & Services > Credentials**, select the Firebase API key, and make sure the HTTP referrer restrictions allow:

- `http://localhost:5175/*`
- `http://127.0.0.1:5175/*`
- `https://habbify-b4d31.firebaseapp.com/*`
- `https://habbify-b4d31.web.app/*`

If the key is restricted to a different project or domain, sign-in will fail even if the app code is correct.

## Step 3: Create a Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Start in **production mode**
4. Choose a region (e.g., `us-central1`)

## Step 4: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings**
2. Under "Your apps", click the web app icon `</>`
3. Copy the Firebase config values

## Step 5: Set Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`):
```bash
cp .env.example .env
```

2. Fill in your Firebase config values:
```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=1:YOUR_ID:web:YOUR_CONFIG
```

## Step 6: Firestore Security Rules (For Development)

Replace the default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      
      // Allow subcollections for authenticated users
      match /{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
    }
  }
}
```

## Step 7: Restart Dev Server

```bash
npm run dev
```

The app will now show a login screen. Click "Sign in with Google" to authenticate!

## Data Sync

- All habits, achievements, challenges, and journal entries are automatically synced to Firestore
- Data persists across devices when logged in with the same Google account
- You can export data from Settings > Export Data

## Troubleshooting

**Issue: CORS error**
- Make sure your domain is added to authorized domains in Firebase Console

**Issue: "The requested action is invalid"**
- Verify Google sign-in is enabled for the Firebase project
- Confirm the Firebase API key allows the current origin in HTTP referrer restrictions
- Confirm the Firebase authorized domains list contains the current origin
- Restart the dev server after changing console settings

**Issue: "Invalid API Key"**
- Check that all environment variables are correctly copied in `.env`

**Issue: Data not syncing**
- Ensure Firestore database is created
- Check browser console for Firebase errors
- Verify Firestore security rules allow your user

## For Production

1. Update security rules to be more restrictive
2. Set up environment variables in your hosting platform
3. Enable additional security features like reCAPTCHA
4. Configure billing in Firebase Console

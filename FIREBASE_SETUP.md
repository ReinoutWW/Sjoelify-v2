# Firebase Database Setup Guide

This guide explains how to use different databases for local development and production in the Sjoelify app.

## Option 1: Firebase Emulator Suite (Recommended)

The Firebase Emulator Suite provides a completely isolated local environment for development.

### Setup Instructions

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Install concurrently** for running multiple scripts:
   ```bash
   npm install --save-dev concurrently
   ```

3. **Create a `.env.local` file** in your project root:
   ```env
   # Copy your Firebase config from Firebase Console
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Enable emulator for local development
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

4. **Initialize Firebase Emulators**:
   ```bash
   firebase init emulators
   ```
   Select Firestore and Authentication when prompted.

5. **Run the development environment**:
   ```bash
   npm run dev:with-emulators
   ```

   Or run them separately:
   ```bash
   # Terminal 1
   npm run dev:emulators

   # Terminal 2
   npm run dev
   ```

6. **Access the Emulator UI** at http://localhost:4000

### Benefits
- Completely isolated from production data
- No risk of affecting real users
- Fast local development
- No cloud costs
- Works offline

## Option 2: Collection Prefixing

If you prefer to use the real Firebase but with separate collections:

1. **Create a collection utility** at `src/lib/firebase/collections.ts`:
   ```typescript
   const getCollectionPrefix = (): string => {
     if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_SANDBOX === 'true') {
       return 'sandbox_';
     }
     return '';
   };

   export const getCollectionName = (baseName: string): string => {
     return `${getCollectionPrefix()}${baseName}`;
   };
   ```

2. **Update your `.env.local`**:
   ```env
   NEXT_PUBLIC_USE_SANDBOX=true
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
   ```

3. **Update all collection references** in your code:
   ```typescript
   // Before
   collection(db, 'users')

   // After
   collection(db, getCollectionName('users'))
   ```

### Benefits
- Uses real Firebase infrastructure
- Easy to switch between environments
- Can view both datasets in Firebase Console

### Drawbacks
- Uses production quotas
- Requires internet connection
- Risk of accidentally using wrong collections

## Option 3: Separate Firebase Projects

For complete isolation, use different Firebase projects:

1. Create a development Firebase project
2. Create separate environment files:
   - `.env.local` (for development)
   - `.env.production` (for production)
3. Configure different Firebase credentials in each

## Recommended Approach

**Use Option 1 (Firebase Emulator Suite)** for local development because:
- It's completely free
- No risk to production data
- Works offline
- Faster performance
- Official Firebase recommendation

## Current Configuration

The app is now configured to support Firebase Emulators. To use them:

1. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` in `.env.local`
2. Run `npm run dev:with-emulators`

To use production database locally:
1. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` in `.env.local`
2. Run `npm run dev` 
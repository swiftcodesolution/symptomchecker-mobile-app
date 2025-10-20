# Google Sign-In Setup Guide

## Current Configuration Status ✅

Your Google Sign-In configuration has been updated with the following fixes:

### 1. Fixed google-services.json
- ✅ Added OAuth client configuration
- ✅ Added server client ID: `749534211951-2h8d60epknp4jbu59b7smqve2i52e0pk.apps.googleusercontent.com`

### 2. Fixed android/app/build.gradle
- ✅ Updated server_client_id to match Firebase configuration
- ✅ Package name: `com.anonymous.symptomcheckerainew.co`

### 3. Updated app.json
- ✅ Added Google Sign-In plugin configuration
- ✅ iOS URL scheme configured

### 4. Firebase Configuration
- ✅ Web Client ID configured correctly
- ✅ Google Sign-In properly initialized

## Next Steps

### 1. Clean and Rebuild
```bash
# Clean the project
npx react-native clean-project

# Clear Metro cache
npx expo start --clear

# Rebuild Android
npx expo run:android
```

### 2. Verify Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ai-boat-341cf`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Google** as a sign-in provider
5. Add your authorized domains:
   - `localhost`
   - `your-app-domain.com` (if any)

### 3. Verify Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `ai-boat-341cf`
3. Go to **APIs & Services** → **Credentials**
4. Verify you have these OAuth 2.0 client IDs:
   - **Web client**: `749534211951-2h8d60epknp4jbu59b7smqve2i52e0pk.apps.googleusercontent.com`
   - **Android client**: Should be auto-generated

### 4. Test the Configuration

After rebuilding, test Google Sign-In:

1. Open the app
2. Go to Login screen
3. Tap "Sign In With Google"
4. Should open Google account picker
5. Select account and sign in

## Troubleshooting

### If you still get "Configuration Error":

1. **Check Firebase Console**:
   - Ensure Google Sign-In is enabled
   - Verify the package name matches: `com.anonymous.symptomcheckerainew.co`

2. **Check Google Cloud Console**:
   - Verify OAuth consent screen is configured
   - Add test users if in testing mode

3. **Check Device/Emulator**:
   - Ensure Google Play Services is installed
   - Try on a physical device if using emulator

4. **Check Network**:
   - Ensure stable internet connection
   - Try on different network if needed

### Common Error Codes:

- `DEVELOPER_ERROR`: Configuration issue (usually fixed now)
- `SIGN_IN_CANCELLED`: User cancelled sign-in
- `PLAY_SERVICES_NOT_AVAILABLE`: Update Google Play Services
- `NETWORK_ERROR`: Check internet connection

## Debug Steps

Add this to your login.jsx for better debugging:

```javascript
// Add this before handleGoogleSignIn
const debugGoogleSignIn = async () => {
  try {
    console.log('🔍 Checking Google Sign-In configuration...');
    
    // Check if GoogleSignin is available
    if (!GoogleSignin) {
      console.error('❌ GoogleSignin is not available');
      return;
    }
    
    // Check Play Services
    const hasPlayServices = await GoogleSignin.hasPlayServices();
    console.log('✅ Play Services available:', hasPlayServices);
    
    // Check if user is already signed in
    const isSignedIn = await GoogleSignin.isSignedIn();
    console.log('✅ User signed in:', isSignedIn);
    
    // Get current user
    const currentUser = await GoogleSignin.getCurrentUser();
    console.log('✅ Current user:', currentUser);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// Call this in useEffect
useEffect(() => {
  debugGoogleSignIn();
}, []);
```

## Final Verification

After implementing all fixes:

1. ✅ Clean and rebuild the project
2. ✅ Test on physical device (recommended)
3. ✅ Ensure Google Play Services is up to date
4. ✅ Check internet connection
5. ✅ Verify Firebase project settings

The configuration error should now be resolved! 🎉 
# Google Sign-In Fix Guide

## 🚨 Current Issues Identified

Based on your code analysis, here are the main issues with your Google Sign-In:

### 1. **Configuration Mismatch**
- Your Firebase config uses the correct web client ID
- But there might be SHA-1 fingerprint issues

### 2. **Missing Google Play Services Configuration**
- Android manifest needs additional Google Play Services meta-data

### 3. **Potential Network/Device Issues**
- Google Play Services might not be available on emulator
- Network connectivity issues

## 🔧 Fixes Applied

### ✅ Fixed Firebase Configuration
- Added `scopes: ['profile', 'email']` to Google Sign-In config
- Enhanced error handling in login component

### ✅ Fixed Android Manifest
- Added proper Google Play Services meta-data
- Ensured Google Sign-In configuration is complete

## 📋 Step-by-Step Verification

### Step 1: Get Your SHA-1 Fingerprint
```bash
./get-sha1.sh
```

### Step 2: Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `ai-boat-341cf`
3. Navigate to **APIs & Services** > **Credentials**
4. Find your Android OAuth 2.0 client
5. Update SHA-1 fingerprint with the one from step 1
6. **Wait 5-10 minutes** for changes to propagate

### Step 3: Verify Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `ai-boat-341cf`
3. Navigate to **Authentication** > **Sign-in method**
4. Ensure **Google** is enabled
5. Add your domain to authorized domains

### Step 4: Clean and Rebuild
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Clear Metro cache
npx react-native start --reset-cache

# Rebuild
npx react-native run-android
```

## 🧪 Testing Steps

### Test 1: Physical Device (Recommended)
1. Use a physical Android device
2. Ensure Google Play Services is installed and updated
3. Test Google Sign-In

### Test 2: Emulator (If Physical Device Not Available)
1. Use an emulator with Google Play Services
2. Install Google Play Services if not available
3. Test Google Sign-In

### Test 3: Debug Logs
Check console logs for:
- ✅ "Google Sign-In configured successfully"
- ✅ "Google Play Services available: true"
- ❌ Any error messages

## 🚨 Common Error Solutions

### Error: "DEVELOPER_ERROR"
**Cause**: SHA-1 fingerprint mismatch or wrong web client ID
**Solution**: 
1. Update SHA-1 in Google Cloud Console
2. Wait 5-10 minutes
3. Clean and rebuild

### Error: "PLAY_SERVICES_NOT_AVAILABLE"
**Cause**: Google Play Services not available
**Solution**:
1. Use physical device instead of emulator
2. Update Google Play Services
3. Install Google Play Services on emulator

### Error: "SIGN_IN_CANCELLED"
**Cause**: User cancelled the sign-in
**Solution**: This is normal user behavior, no fix needed

### Error: "NETWORK_ERROR"
**Cause**: Network connectivity issues
**Solution**:
1. Check internet connection
2. Try on different network
3. Check firewall settings

## 🔍 Debug Information

### Current Configuration
- **Package Name**: `com.anonymous.symptomcheckerainew.co`
- **Web Client ID**: `749534211951-2h8d60epknp4jbu59b7smqve2i52e0pk.apps.googleusercontent.com`
- **Project ID**: `ai-boat-341cf`

### Files Modified
- ✅ `app/config/firebase.js` - Added scopes configuration
- ✅ `android/app/src/main/AndroidManifest.xml` - Added Google Play Services meta-data
- ✅ `app/auth/login.jsx` - Enhanced error handling

## 📞 Still Having Issues?

If you're still experiencing problems:

1. **Run the SHA-1 script**: `./get-sha1.sh`
2. **Update Google Cloud Console** with the correct SHA-1
3. **Wait 10-15 minutes** for changes to propagate
4. **Test on physical device** with Google Play Services
5. **Check console logs** for specific error messages
6. **Verify all configurations** using the checklist above

## 🎯 Quick Test

After applying all fixes:

1. Clean and rebuild your app
2. Test on a physical Android device
3. Try Google Sign-In
4. Check console logs for success/error messages

The most common issue is SHA-1 fingerprint mismatch, so make sure to update that in Google Cloud Console! 
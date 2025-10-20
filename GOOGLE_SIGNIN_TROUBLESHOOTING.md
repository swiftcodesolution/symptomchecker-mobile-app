# Google Sign-In DEVELOPER_ERROR Troubleshooting Guide

## Error: DEVELOPER_ERROR

This error occurs when Google Sign-In is not properly configured. Here's how to fix it:

## Step 1: Verify Google Cloud Console Configuration

### 1.1 Check OAuth 2.0 Client IDs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `ai-boat-341cf`
3. Navigate to **APIs & Services** > **Credentials**
4. Verify you have these client IDs:
   - **Web client (auto created by Google Service)**
   - **Android client** for package: `com.anonymous.symptomcheckerainew.co`

### 1.2 Add Android OAuth Client (if missing)
1. Click **Create Credentials** > **OAuth 2.0 Client IDs**
2. Choose **Android** as application type
3. Package name: `com.anonymous.symptomcheckerainew.co`
4. SHA-1 fingerprint: `5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88`
5. Click **Create**

## Step 2: Verify Firebase Console Configuration

### 2.1 Enable Google Sign-In in Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ai-boat-341cf`
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** as a sign-in provider
5. Add your authorized domains

### 2.2 Check Project Settings
1. Go to **Project Settings**
2. Verify your Android app is registered with package name: `com.anonymous.symptomcheckerainew.co`
3. Download the updated `google-services.json` if needed

## Step 3: Verify Code Configuration

### 3.1 Check Firebase Configuration
Your `app/config/firebase.js` should have:
```javascript
GoogleSignin.configure({
  webClientId: '1003256259399-nauj7ht0arjdg1h8v0ru4su2qmvcgpsl.apps.googleusercontent.com',
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});
```

### 3.2 Check Android Configuration
Your `android/app/build.gradle` should have:
```gradle
defaultConfig {
    applicationId 'com.anonymous.symptomcheckerainew.co'
    // ... other configs
    resValue "string", "server_client_id", "1003256259399-nauj7ht0arjdg1h8v0ru4su2qmvcgpsl.apps.googleusercontent.com"
}
```

### 3.3 Check AndroidManifest.xml
Your `android/app/src/main/AndroidManifest.xml` should have:
```xml
<meta-data
    android:name="com.google.android.gms.version"
    android:value="@integer/google_play_services_version" />
```

## Step 4: Common Issues and Solutions

### 4.1 SHA-1 Fingerprint Mismatch
**Problem**: The SHA-1 fingerprint in Google Cloud Console doesn't match your app's fingerprint.

**Solution**: 
1. Get your current SHA-1:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
2. Update the SHA-1 in Google Cloud Console
3. Wait 5-10 minutes for changes to propagate

### 4.2 Package Name Mismatch
**Problem**: Package name in Google Cloud Console doesn't match your app's package name.

**Solution**: 
1. Verify your package name is: `com.anonymous.symptomcheckerainew.co`
2. Update Google Cloud Console if different

### 4.3 Web Client ID Issues
**Problem**: Wrong or missing web client ID.

**Solution**:
1. In Google Cloud Console, find **Web client (auto created by Google Service)**
2. Copy the **Client ID**
3. Update your Firebase configuration

### 4.4 Google Play Services Issues
**Problem**: Google Play Services not available or outdated.

**Solution**:
1. Update Google Play Services on your device/emulator
2. For emulators, install Google Play Services
3. Test on a physical device

## Step 5: Testing Steps

### 5.1 Clean and Rebuild
```bash
# Clean the project
cd android && ./gradlew clean
cd ..

# Clear Metro cache
npx react-native start --reset-cache

# Rebuild
npx react-native run-android
```

### 5.2 Test on Physical Device
1. Use a physical Android device (not emulator)
2. Ensure Google Play Services is installed and updated
3. Test Google Sign-In

### 5.3 Debug Logs
Check console logs for these messages:
- ✅ "Google Sign-In configured successfully"
- ✅ "Google Play Services available: true"
- ❌ Any error messages

## Step 6: Advanced Troubleshooting

### 6.1 Check Network Connectivity
Ensure your device has internet access and can reach Google services.

### 6.2 Verify Google Services JSON
1. Download fresh `google-services.json` from Firebase Console
2. Replace the existing file in `android/app/`
3. Clean and rebuild

### 6.3 Test with Minimal Configuration
Try this minimal configuration:
```javascript
GoogleSignin.configure({
  webClientId: '1003256259399-nauj7ht0arjdg1h8v0ru4su2qmvcgpsl.apps.googleusercontent.com',
});
```

## Step 7: Alternative Solutions

### 7.1 Use Different Web Client ID
If the current web client ID doesn't work, try:
1. Create a new OAuth 2.0 client in Google Cloud Console
2. Choose "Web application" as type
3. Use the new client ID

### 7.2 Check Firebase Project
Ensure you're using the correct Firebase project:
- Project ID: `ai-boat-341cf`
- Verify in Firebase Console

## Step 8: Verification Checklist

- [ ] Google Cloud Console has Android OAuth client with correct package name
- [ ] Google Cloud Console has correct SHA-1 fingerprint
- [ ] Firebase Console has Google Sign-In enabled
- [ ] `google-services.json` is up to date
- [ ] `webClientId` in code matches Google Cloud Console
- [ ] `server_client_id` in build.gradle matches web client ID
- [ ] AndroidManifest.xml has Google Play Services meta-data
- [ ] Testing on physical device with Google Play Services
- [ ] Clean rebuild after configuration changes

## Step 9: Still Having Issues?

If you're still getting DEVELOPER_ERROR:

1. **Double-check all configurations** using the checklist above
2. **Wait 10-15 minutes** after making changes (Google services can take time to propagate)
3. **Test on a different device** to rule out device-specific issues
4. **Check Google Cloud Console logs** for any authentication errors
5. **Verify your Google account** has access to the project

## Contact Information

If you continue to have issues:
1. Check the [official troubleshooting guide](https://react-native-google-signin.github.io/docs/troubleshooting)
2. Verify all steps in this guide
3. Check console logs for specific error messages 
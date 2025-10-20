# Biometric Login Troubleshooting Guide

## Common Issues and Solutions

### 1. "No stored credentials" Error
**Problem**: Biometric authentication shows "No stored credentials" error.

**Solution**:
- Login manually first with your email and password
- When prompted, enable biometric login by selecting "Yes"
- This will store your credentials securely for future biometric login

### 2. Biometric Button Not Working
**Problem**: Biometric button is disabled or not responding.

**Possible Causes**:
- Biometric authentication not enabled on device
- No biometric data stored
- Device doesn't support biometric authentication

**Solutions**:
- Check if your device has fingerprint/face recognition set up
- Login manually first to enable biometric login
- Long press the biometric button to reset settings if needed

### 3. Biometric Authentication Fails
**Problem**: Biometric authentication succeeds but login fails.

**Possible Causes**:
- Stored credentials are outdated (password changed)
- Network connectivity issues
- Firebase authentication problems

**Solutions**:
- Try manual login to update stored credentials
- Check internet connection
- Long press biometric button to reset and login manually again

### 4. App Crashes During Biometric Auth
**Problem**: App crashes when trying to use biometric authentication.

**Solutions**:
- Restart the app
- Check if biometric authentication is properly set up on device
- Try manual login first

## How to Test Biometric Functionality

1. **Access Test Page**: Navigate to `/test-biometric` in your app
2. **Check Status**: Verify biometric hardware and enrollment status
3. **Test Authentication**: Use the test button to verify biometric works
4. **Check Credentials**: Verify stored credentials are present
5. **Reset if Needed**: Clear biometric data and start fresh

## Debug Steps

1. **Check Console Logs**: Look for biometric-related console messages
2. **Verify Device Settings**: Ensure biometric authentication is enabled on device
3. **Test Manual Login**: Login manually first to establish credentials
4. **Enable Biometric**: Accept the biometric setup prompt after manual login
5. **Test Biometric Login**: Try biometric authentication

## Common Error Messages

- **"Biometric Not Enabled"**: Login manually first to enable biometric
- **"No stored credentials"**: Login manually first to store credentials
- **"Authentication failed"**: Try again or use manual login
- **"Network error"**: Check internet connection
- **"Password has changed"**: Login manually to update stored credentials

## Reset Biometric Settings

If you're having persistent issues:

1. Long press the biometric button on login screen
2. Select "Reset" to clear biometric data
3. Login manually again
4. Enable biometric when prompted

## Device Requirements

- Device must support biometric authentication (fingerprint/face recognition)
- Biometric authentication must be set up on the device
- App must have permission to use biometric authentication

## Security Notes

- Credentials are stored securely in device's keychain/keystore
- Biometric data is never stored on servers
- You can reset biometric settings anytime
- Manual login is always available as fallback 
# DEVELOPER_ERROR Fix Guide

## 🚨 आपका SHA-1 Fingerprint:
```
5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88
```

## 📋 Step-by-Step Fix:

### Step 1: Google Cloud Console में जाएं
1. [Google Cloud Console](https://console.cloud.google.com/) पर जाएं
2. Project select करें: `ai-boat-341cf`
3. **APIs & Services** > **Credentials** पर जाएं

### Step 2: Android OAuth Client को Update करें
1. **OAuth 2.0 Client IDs** में जाएं
2. आपका Android client ढूंढें (package name: `com.anonymous.symptomcheckerainew.co`)
3. उस पर **click** करें
4. **SHA-1 fingerprint** field में यह डालें:
   ```
   5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88
   ```
5. **Save** करें

### Step 3: Firebase Console में जाएं
1. [Firebase Console](https://console.firebase.google.com/) पर जाएं
2. Project select करें: `ai-boat-341cf`
3. **Authentication** > **Sign-in method** पर जाएं
4. **Google** को enable करें
5. **Authorized domains** में अपना domain add करें

### Step 4: Wait करें
**⚠️ बहुत महत्वपूर्ण:** Google services को update होने में 5-10 minutes लगते हैं। इसलिए changes के बाद wait करें।

### Step 5: App को Clean और Rebuild करें
```bash
# Android को clean करें
cd android && ./gradlew clean && cd ..

# Metro cache को clear करें
npx react-native start --reset-cache

# App को rebuild करें
npx react-native run-android
```

## 🧪 Testing:

### Physical Device पर Test करें (Recommended)
1. Physical Android device use करें (emulator नहीं)
2. Google Play Services installed होना चाहिए
3. Google Sign-In button पर click करें

### Console Logs Check करें
App में यह logs देखें:
- ✅ "Google Sign-In configured successfully"
- ✅ "Google Play Services available: true"
- ❌ कोई error messages

## 🚨 अगर अभी भी Error आ रहा है:

### 1. SHA-1 को Double Check करें
```bash
./get-sha1.sh
```
यह command run करके SHA-1 को verify करें

### 2. Google Cloud Console में जाकर Check करें
- SHA-1 fingerprint सही है या नहीं
- Package name सही है या नहीं: `com.anonymous.symptomcheckerainew.co`

### 3. Wait करें
Google services को propagate होने में time लगता है। 10-15 minutes wait करें।

### 4. Different Device पर Test करें
अगर एक device पर काम नहीं कर रहा, तो दूसरे device पर try करें।

## 🔍 Debug Information:

### Current Configuration:
- **Package Name**: `com.anonymous.symptomcheckerainew.co`
- **Web Client ID**: `749534211951-2h8d60epknp4jbu59b7smqve2i52e0pk.apps.googleusercontent.com`
- **SHA-1**: `5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88`

### Most Common Cause:
DEVELOPER_ERROR का सबसे common cause है **SHA-1 fingerprint mismatch**। इसलिए Google Cloud Console में सही SHA-1 डालना बहुत important है।

## 📞 अगर अभी भी Problem है:

1. **SHA-1 को verify करें** - `./get-sha1.sh` run करें
2. **Google Cloud Console में जाएं** और SHA-1 update करें
3. **10-15 minutes wait करें**
4. **Physical device पर test करें**
5. **Console logs check करें**

यह steps follow करने के बाद DEVELOPER_ERROR fix हो जाना चाहिए! 
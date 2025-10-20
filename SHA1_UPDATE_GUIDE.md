# SHA-1 Fingerprint Update Guide

## 🚨 आपका SHA-1 Fingerprint:
```
5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88
```

## 📋 Step-by-Step Instructions:

### Step 1: Google Cloud Console में जाएं
1. Browser में यह URL open करें: **https://console.cloud.google.com/**
2. अपने Google account से login करें

### Step 2: Project Select करें
1. Top-left corner में project dropdown पर click करें
2. **ai-boat-341cf** project को select करें
3. अगर यह project नहीं दिख रहा, तो search करें

### Step 3: APIs & Services में जाएं
1. Left sidebar में **APIs & Services** पर click करें
2. **Credentials** पर click करें

### Step 4: Android OAuth Client ढूंढें
1. **OAuth 2.0 Client IDs** section में जाएं
2. ऐसा client ढूंढें जिसमें:
   - **Application type**: Android
   - **Package name**: `com.anonymous.symptomcheckerainew.co`
3. उस client पर **click** करें

### Step 5: SHA-1 Fingerprint Update करें
1. **SHA-1 certificate fingerprints** field में जाएं
2. Current SHA-1 को **delete** करें
3. यह नया SHA-1 डालें:
   ```
   5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88
   ```
4. **Save** button पर click करें

### Step 6: Wait करें
**⚠️ बहुत महत्वपूर्ण:** Google services को update होने में **5-10 minutes** लगते हैं। इसलिए changes के बाद wait करें।

## 🧪 Verification Steps:

### Step 7: App को Clean और Rebuild करें
```bash
# Android को clean करें
cd android && ./gradlew clean && cd ..

# Metro cache को clear करें
npx react-native start --reset-cache

# App को rebuild करें
npx react-native run-android
```

### Step 8: Physical Device पर Test करें
1. **Physical Android device** use करें (emulator नहीं)
2. Google Play Services installed होना चाहिए
3. App में Google Sign-In button पर click करें

## 🔍 Troubleshooting:

### अगर Android OAuth Client नहीं मिल रहा:
1. **Create Credentials** पर click करें
2. **OAuth 2.0 Client IDs** select करें
3. **Android** application type select करें
4. Package name: `com.anonymous.symptomcheckerainew.co`
5. SHA-1: `5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88`
6. **Create** करें

### अगर अभी भी Error आ रहा है:
1. **10-15 minutes** और wait करें
2. **Different device** पर test करें
3. **Google Play Services** update करें
4. **Internet connection** check करें

## 📱 Current Configuration:
- **Package Name**: `com.anonymous.symptomcheckerainew.co`
- **Web Client ID**: `749534211951-2h8d60epknp4jbu59b7smqve2i52e0pk.apps.googleusercontent.com`
- **SHA-1 Fingerprint**: `5F:BE:69:13:AF:1C:94:24:C7:35:24:5C:B8:32:BE:DE:23:64:7C:88`

## ✅ Success Indicators:
- Google Sign-In button पर click करने के बाद Google account selection screen आएगा
- कोई DEVELOPER_ERROR नहीं आएगा
- Console में success logs दिखेंगे

## 🚨 Important Notes:
- **Wait करना बहुत important है** - Google services को propagate होने में time लगता है
- **Physical device use करें** - emulator में issues हो सकते हैं
- **Google Play Services** installed होना चाहिए
- **Internet connection** stable होना चाहिए

इन steps को follow करने के बाद SHA-1 fingerprint mismatch fix हो जाना चाहिए! 
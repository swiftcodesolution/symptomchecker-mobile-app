#!/bin/bash

echo "🔍 Getting SHA-1 fingerprint for Google Sign-In..."
echo ""

# Get debug SHA-1
echo "📱 Debug SHA-1 (for development):"
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1

echo ""
echo "🏗️  Release SHA-1 (for production):"
echo "If you have a release keystore, run:"
echo "keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias"
echo ""

echo "📋 Next steps:"
echo "1. Copy the SHA-1 fingerprint above"
echo "2. Go to Google Cloud Console: https://console.cloud.google.com/"
echo "3. Navigate to APIs & Services > Credentials"
echo "4. Find your Android OAuth 2.0 client"
echo "5. Update the SHA-1 fingerprint"
echo "6. Wait 5-10 minutes for changes to propagate"
echo ""

echo "🔧 Current configuration check:"
echo "Package name: com.anonymous.symptomcheckerainew.co"
echo "Web Client ID: 749534211951-2h8d60epknp4jbu59b7smqve2i52e0pk.apps.googleusercontent.com"
echo "" 
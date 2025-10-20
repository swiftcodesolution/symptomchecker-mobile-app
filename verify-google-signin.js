const { GoogleSignin } = require('@react-native-google-signin/google-signin');

console.log('🔍 Verifying Google Sign-In Configuration...\n');

// Test Google Sign-In configuration
async function verifyGoogleSignIn() {
  try {
    console.log('1. Testing Google Play Services...');
    const hasPlayServices = await GoogleSignin.hasPlayServices({ 
      showPlayServicesUpdateDialog: false 
    });
    console.log('✅ Google Play Services available:', hasPlayServices);

    console.log('\n2. Testing Google Sign-In configuration...');
    const isSignedIn = await GoogleSignin.isSignedIn();
    console.log('✅ Google Sign-In configured successfully');
    console.log('📱 User signed in:', isSignedIn);

    if (isSignedIn) {
      console.log('\n3. Getting current user info...');
      const userInfo = await GoogleSignin.getCurrentUser();
      console.log('✅ Current user:', userInfo?.user?.email || 'No user info');
    }

    console.log('\n🎉 Google Sign-In configuration is working!');
    console.log('\n📋 Next steps:');
    console.log('1. Test on a physical Android device');
    console.log('2. Ensure Google Play Services is installed');
    console.log('3. Try the sign-in button in your app');

  } catch (error) {
    console.error('❌ Google Sign-In verification failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if you\'re testing on a physical device');
    console.log('2. Ensure Google Play Services is installed');
    console.log('3. Verify SHA-1 fingerprint in Google Cloud Console');
    console.log('4. Wait 5-10 minutes after updating SHA-1');
  }
}

// Run verification
verifyGoogleSignIn(); 
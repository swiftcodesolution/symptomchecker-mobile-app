// Simple Firebase test
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBmEQNyMOt6rBr6R-cC8XbV-TRO1i8-x90",
  authDomain: "ai-boat-341cf.firebaseapp.com",
  projectId: "ai-boat-341cf",
  storageBucket: "ai-boat-341cf.firebasestorage.app",
  messagingSenderId: "749534211951",
  appId: "1:749534211951:android:cfdd80fe6db9de4e2c829a"
};

console.log('Testing Firebase initialization...');

try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
  
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
  
  console.log('✅ Firebase test successful');
} catch (error) {
  console.error('❌ Firebase test failed:', error);
} 
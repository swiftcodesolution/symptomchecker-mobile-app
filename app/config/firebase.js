import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// Firebase configuration for React Native
const firebaseConfig = {
  apiKey: "AIzaSyDccdzFwGCITQRpBldYiHDNnplCJVNVIQk",
  authDomain: "health-app-7a8b0.firebaseapp.com",
  projectId: "health-app-7a8b0",
  storageBucket: "health-app-7a8b0.firebasestorage.app",
  messagingSenderId: "920643427452",
  appId: "1:920643427452:web:e62ca8f9760546d6647df9",
  measurementId: "G-TD7EB67828"
};

console.log('Firebase config:', firebaseConfig);

// Initialize Firebase
let app = null;
let firebaseAuth = null;

try {
  console.log('Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');

  // Initialize Auth with persistence for React Native
  try {
    firebaseAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase Auth initialized with persistence');
  } catch (authError) {
    console.log('Failed to initialize Auth with persistence, using fallback:', authError);
    firebaseAuth = getAuth(app);
    console.log('Firebase Auth initialized without persistence');
  }

  // Test if auth is working
  if (firebaseAuth) {
    console.log('Firebase Auth is ready to use');
  } else {
    console.error('Firebase Auth is null after initialization');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Error details:', error.message);
}

// Initialize Firestore
let firestore = null;
try {
  firestore = getFirestore(app);
  console.log('Firestore initialized successfully');
} catch (error) {
  console.error('Firestore initialization error:', error);
}

export const saveChatMessage = async (userId, message, isUser = true) => {
  try {
    if (!firestore) {
      console.error('Firestore not initialized');
      return null;
    }

    const chatRef = collection(firestore, 'chats');
    const docRef = await addDoc(chatRef, {
      userId,
      message,
      isUser,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    console.log('Chat message saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving chat message: ', error);
    return null;
  }
};

export const getChatHistory = (userId, callback) => {
  try {
    if (!firestore) {
      console.error('Firestore not initialized');
      return () => { };
    }

    const chatRef = collection(firestore, 'chats');
    const q = query(
      chatRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });
  } catch (error) {
    console.error('Error getting chat history: ', error);
    return () => { };
  }
};

// Export with null checks
export { app, firebaseAuth, firestore };
export default { app, firebaseAuth, firestore };

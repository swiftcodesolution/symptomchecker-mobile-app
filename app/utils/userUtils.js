import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Store user data in Firestore
export const storeUserDataInFirestore = async (user, additionalData = {}) => {
  try {
    const userDocRef = doc(firestore, 'users', user.uid);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      provider: additionalData.provider || 'email',
      ...additionalData
    };
    
    await setDoc(userDocRef, userData, { merge: true });
    console.log('User data stored in Firestore successfully');
    return true;
    
  } catch (error) {
    console.error('Error storing user data in Firestore:', error);
    return false;
  }
};

// Get user data from Firestore
export const getUserDataFromFirestore = async (uid) => {
  try {
    const userDocRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No user document found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user data from Firestore:', error);
    return null;
  }
};

// Update user data in Firestore
export const updateUserDataInFirestore = async (uid, updateData) => {
  try {
    const userDocRef = doc(firestore, 'users', uid);
    
    const updateObject = {
      ...updateData,
      lastUpdatedAt: new Date()
    };
    
    await setDoc(userDocRef, updateObject, { merge: true });
    console.log('User data updated in Firestore successfully');
    return true;
    
  } catch (error) {
    console.error('Error updating user data in Firestore:', error);
    return false;
  }
};

// Check if user has completed onboarding
export const checkUserOnboardingStatus = async (uid) => {
  try {
    const userData = await getUserDataFromFirestore(uid);
    
    if (userData && userData.answers) {
      return true; // User has completed onboarding
    }
    
    return false; // User needs to complete onboarding
  } catch (error) {
    console.error('Error checking user onboarding status:', error);
    return false;
  }
}; 
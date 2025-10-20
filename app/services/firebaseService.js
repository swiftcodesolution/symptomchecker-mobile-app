import { firestore, firebaseAuth } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const COLLECTIONS = {
  PERSONAL_DETAILS: 'personalDetails',
  INSURANCE: 'insurance',
  DOCTORS: 'doctors',
  PHARMACIES: 'pharmacies',
  CONTACTS: 'personalContacts',
  EMERGENCY_CONTACTS: 'emergencyContacts',
  SOS_DOCTOR: 'sosDoctor',
};

// Get current user ID
const getCurrentUserId = () => {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
};

// Personal Details
export const getPersonalDetails = async () => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(firestore, COLLECTIONS.PERSONAL_DETAILS, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting personal details:', error);
    throw error;
  }
};

// --- NEW: SOS Doctor (single) ---
export const getSosDoctor = async () => {
  try {
    const userId = getCurrentUserId();
    const ref = doc(firestore, COLLECTIONS.SOS_DOCTOR, userId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: ref.id, ...snap.data() } : null;
  } catch (e) {
    console.error('Error getting SOS doctor:', e);
    throw e;
  }
};


export const saveSosDoctor = async (details) => {
  try {
    const userId = getCurrentUserId();
    const ref = doc(firestore, COLLECTIONS.SOS_DOCTOR, userId);
    // setDoc upserts; ensures exactly ONE doctor for this user in SOS
    await setDoc(
      ref,
      {
        ...details,
        userId,
        updatedAt: new Date(),
        // optional: keep createdAt the first time only
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('Error saving SOS doctor:', e);
    throw e;
  }
};

export const deleteSosDoctor = async () => {
  try {
    const userId = getCurrentUserId();
    const ref = doc(firestore, COLLECTIONS.SOS_DOCTOR, userId);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.error('Error deleting SOS doctor:', e);
    throw e;
  }
};

export const savePersonalDetails = async (details) => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(firestore, COLLECTIONS.PERSONAL_DETAILS, userId);
    await setDoc(docRef, { ...details, userId, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving personal details:', error);
    throw error;
  }
};

// Insurance
export const getInsuranceDetails = async () => {
  try {
    const userId = getCurrentUserId();
    const q = query(collection(firestore, COLLECTIONS.INSURANCE), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const insurance = [];
    querySnapshot.forEach((doc) => {
      insurance.push({ id: doc.id, ...doc.data() });
    });
    return insurance;
  } catch (error) {
    console.error('Error getting insurance details:', error);
    throw error;
  }
};

export const getEmergencyContacts = async () => {
  try {
    const userId = getCurrentUserId();
    const q = query(collection(firestore, COLLECTIONS.EMERGENCY_CONTACTS), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const contacts = [];
    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() });
    });
    return contacts;
  } catch (error) {
    console.error('Error getting emergency contacts:', error);
    throw error;
  }
};

export const saveEmergencyContact = async (contact) => {
  try {
    const userId = getCurrentUserId();
    if (contact.id) {
      const docRef = doc(firestore, COLLECTIONS.EMERGENCY_CONTACTS, contact.id);
      await updateDoc(docRef, { ...contact, updatedAt: new Date() });
    } else {
      await addDoc(collection(firestore, COLLECTIONS.EMERGENCY_CONTACTS), {
        ...contact,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving emergency contact:', error);
    throw error;
  }
};

export const deleteEmergencyContact = async (id) => {
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.EMERGENCY_CONTACTS, id));
    return true;
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    throw error;
  }
};

export const saveInsuranceDetails = async (details) => {
  try {
    const userId = getCurrentUserId();
    if (details.id) {
      // Update existing
      const docRef = doc(firestore, COLLECTIONS.INSURANCE, details.id);
      await updateDoc(docRef, { ...details, updatedAt: new Date() });
    } else {
      // Add new
      await addDoc(collection(firestore, COLLECTIONS.INSURANCE), {
        ...details,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving insurance details:', error);
    throw error;
  }
};

export const deleteInsuranceDetails = async (id) => {
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.INSURANCE, id));
    return true;
  } catch (error) {
    console.error('Error deleting insurance details:', error);
    throw error;
  }
};

// Doctors
export const getDoctorDetails = async () => {
  try {
    const userId = getCurrentUserId();
    const q = query(collection(firestore, COLLECTIONS.DOCTORS), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const doctors = [];
    querySnapshot.forEach((doc) => {
      doctors.push({ id: doc.id, ...doc.data() });
    });
    return doctors;
  } catch (error) {
    console.error('Error getting doctor details:', error);
    throw error;
  }
};

export const saveDoctorDetails = async (details) => {
  try {
    const userId = getCurrentUserId();
    
    console.log('🔍 saveDoctorDetails called with:', details);
    console.log('🔍 isPrimary value:', details.isPrimary);
    
    // If setting as primary, first remove primary from all other doctors
    if (details.isPrimary) {
      console.log('🔍 Setting as primary, removing primary from others');
      const existingDoctors = await getDoctorDetails();
      for (const doctor of existingDoctors) {
        if (doctor.isPrimary && doctor.id !== details.id) {
          console.log('🔍 Removing primary from doctor:', doctor.id);
          const docRef = doc(firestore, COLLECTIONS.DOCTORS, doctor.id);
          await updateDoc(docRef, { isPrimary: false, updatedAt: new Date() });
        }
      }
    }
    
    // If this is a new doctor and it's the first one, set as primary by default
    if (!details.id) {
      const existingDoctors = await getDoctorDetails();
      console.log('🔍 New doctor, existing count:', existingDoctors.length);
      if (existingDoctors.length === 0) {
        console.log('🔍 First doctor, setting as primary');
        details.isPrimary = true;
      }
    }
    
    if (details.id) {
      const docRef = doc(firestore, COLLECTIONS.DOCTORS, details.id);
      await updateDoc(docRef, { ...details, updatedAt: new Date() });
    } else {
      await addDoc(collection(firestore, COLLECTIONS.DOCTORS), {
        ...details,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving doctor details:', error);
    throw error;
  }
};

export const deleteDoctorDetails = async (id) => {
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.DOCTORS, id));
    return true;
  } catch (error) {
    console.error('Error deleting doctor details:', error);
    throw error;
  }
};

// Get primary doctor
export const getPrimaryDoctor = async () => {
  try {
    const userId = getCurrentUserId();
    const q = query(
      collection(firestore, COLLECTIONS.DOCTORS), 
      where('userId', '==', userId),
      where('isPrimary', '==', true)
    );
    const querySnapshot = await getDocs(q);
    console.log('🔍 Primary doctor query result:', querySnapshot.empty ? 'No primary doctor found' : 'Found primary doctor');
    if (querySnapshot.empty) {
      return null;
    }
    const doc = querySnapshot.docs[0];
    const result = { id: doc.id, ...doc.data() };
    console.log('🔍 Primary doctor data:', result);
    return result;
  } catch (error) {
    console.error('Error getting primary doctor:', error);
    throw error;
  }
};

// Pharmacies
export const getPharmacyDetails = async () => {
  try {
    const userId = getCurrentUserId();
    const q = query(collection(firestore, COLLECTIONS.PHARMACIES), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const pharmacies = [];
    querySnapshot.forEach((doc) => {
      pharmacies.push({ id: doc.id, ...doc.data() });
    });
    return pharmacies;
  } catch (error) {
    console.error('Error getting pharmacy details:', error);
    throw error;
  }
};

export const savePharmacyDetails = async (details) => {
  try {
    const userId = getCurrentUserId();
    if (details.id) {
      const docRef = doc(firestore, COLLECTIONS.PHARMACIES, details.id);
      await updateDoc(docRef, { ...details, updatedAt: new Date() });
    } else {
      await addDoc(collection(firestore, COLLECTIONS.PHARMACIES), {
        ...details,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving pharmacy details:', error);
    throw error;
  }
};

export const deletePharmacyDetails = async (id) => {
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.PHARMACIES, id));
    return true;
  } catch (error) {
    console.error('Error deleting pharmacy details:', error);
    throw error;
  }
};

// Personal Contacts
export const getPersonalContacts = async () => {
  try {
    const userId = getCurrentUserId();
    const q = query(collection(firestore, COLLECTIONS.CONTACTS), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const contacts = [];
    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() });
    });
    return contacts;
  } catch (error) {
    console.error('Error getting personal contacts:', error);
    throw error;
  }
};

export const savePersonalContact = async (contact) => {
  try {
    const userId = getCurrentUserId();
    if (contact.id) {
      const docRef = doc(firestore, COLLECTIONS.CONTACTS, contact.id);
      await updateDoc(docRef, { ...contact, updatedAt: new Date() });
    } else {
      await addDoc(collection(firestore, COLLECTIONS.CONTACTS), {
        ...contact,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving personal contact:', error);
    throw error;
  }
};

export const deletePersonalContact = async (id) => {
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.CONTACTS, id));
    return true;
  } catch (error) {
    console.error('Error deleting personal contact:', error);
    throw error;
  }
};

// Add new contact
export const addContactDetails = async (contactData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'users', user.uid, 'contacts'), {
      ...contactData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

// Update existing contact
export const updateContactDetails = async (contactId, contactData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'users', user.uid, 'contacts', contactId), {
      ...contactData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};
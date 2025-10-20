import { firestore } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';

class MedicationService {
  constructor() {
    this.collectionName = 'medications';
  }

  // Add new medication
  async addMedication(medicationData) {
    try {
      const docRef = await addDoc(collection(firestore, this.collectionName), {
        ...medicationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Medication added successfully with ID:', docRef.id);
      return { id: docRef.id, ...medicationData };
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  }

  // Update existing medication
  async updateMedication(medicationId, updatedData) {
    try {
      const medicationRef = doc(firestore, this.collectionName, medicationId);
      await updateDoc(medicationRef, {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Medication updated successfully');
      return { id: medicationId, ...updatedData };
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  }

  // Delete medication
  async deleteMedication(medicationId) {
    try {
      await deleteDoc(doc(firestore, this.collectionName, medicationId));
      console.log('Medication deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  // Get all medications
  async getAllMedications() {
    try {
      const q = query(
        collection(firestore, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const medications = [];
      
      querySnapshot.forEach((doc) => {
        medications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Medications fetched successfully:', medications.length);
      return medications;
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  }

  // Get medication by ID
  async getMedicationById(medicationId) {
    try {
      const medicationRef = doc(firestore, this.collectionName, medicationId);
      const medicationDoc = await getDocs(medicationRef);
      
      if (medicationDoc.exists()) {
        return { id: medicationDoc.id, ...medicationDoc.data() };
      } else {
        throw new Error('Medication not found');
      }
    } catch (error) {
      console.error('Error fetching medication by ID:', error);
      throw error;
    }
  }
}

export default new MedicationService(); 
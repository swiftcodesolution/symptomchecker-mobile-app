import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { firestore } from '../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FirebaseTest = () => {
  const [testResult, setTestResult] = useState('');
  const auth = getAuth();

  const testFirebaseConnection = async () => {
    try {
      setTestResult('Testing Firebase connection...');
      
      // Test if we can access Firestore
      const testDoc = await addDoc(collection(firestore, 'test'), {
        timestamp: new Date().toISOString(),
        message: 'Firebase connection test'
      });
      
      setTestResult(`✅ Firebase connection successful! Test document created with ID: ${testDoc.id}`);
      
      // Clean up test document
      // Note: In a real app, you'd want to delete this test document
      
    } catch (error) {
      console.error('Firebase test error:', error);
      setTestResult(`❌ Firebase connection failed: ${error.message}`);
    }
  };

  const testMedicinesCollection = async () => {
    try {
      setTestResult('Testing medicines collection...');
      
      const user = auth.currentUser;
      if (!user) {
        setTestResult('❌ No user logged in. Please login first.');
        return;
      }

      // Test adding a medicine
      const medicineData = {
        name: 'Test Medicine',
        dosage: '500mg',
        frequency: '2 times per day',
        timeToTake: '9:00 AM',
        refillDate: '01/01/2025',
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(firestore, 'medicines'), medicineData);
      
      // Test fetching medicines
      const medicinesQuery = query(collection(firestore, 'medicines'), where('userId', '==', user.uid));
      const snapshot = await getDocs(medicinesQuery);
      
      setTestResult(`✅ Medicines collection test successful! Added medicine with ID: ${docRef.id}. Found ${snapshot.size} medicines for user.`);
      
    } catch (error) {
      console.error('Medicines collection test error:', error);
      setTestResult(`❌ Medicines collection test failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Test</Text>
      
      <TouchableOpacity style={styles.testButton} onPress={testFirebaseConnection}>
        <Text style={styles.buttonText}>Test Firebase Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.testButton} onPress={testMedicinesCollection}>
        <Text style={styles.buttonText}>Test Medicines Collection</Text>
      </TouchableOpacity>
      
      {testResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default FirebaseTest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6B705B',
  },
  testButton: {
    backgroundColor: '#6B705B',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  resultText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
}); 
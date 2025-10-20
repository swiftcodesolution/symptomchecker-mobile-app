import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestBiometric() {
  const [biometricStatus, setBiometricStatus] = useState({});
  const [storedCredentials, setStoredCredentials] = useState({});

  useEffect(() => {
    checkBiometricStatus();
    checkStoredCredentials();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
      
      setBiometricStatus({
        hasHardware,
        isEnrolled,
        biometricEnabled: biometricEnabled === 'true'
      });
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const checkStoredCredentials = async () => {
    try {
      const email = await AsyncStorage.getItem('biometricEmail');
      const password = await AsyncStorage.getItem('biometricPassword');
      
      setStoredCredentials({
        hasEmail: !!email,
        hasPassword: !!password,
        email: email ? `${email.substring(0, 3)}...` : null
      });
    } catch (error) {
      console.error('Error checking stored credentials:', error);
    }
  };

  const testBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Test Biometric Authentication',
        fallbackLabel: 'Enter Passcode',
      });
      
      Alert.alert('Test Result', `Success: ${result.success}\nError: ${result.error || 'None'}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const clearBiometricData = async () => {
    try {
      await AsyncStorage.removeItem('biometricEmail');
      await AsyncStorage.removeItem('biometricPassword');
      await AsyncStorage.setItem('biometricEnabled', 'false');
      checkStoredCredentials();
      checkBiometricStatus();
      Alert.alert('Success', 'Biometric data cleared');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const setTestCredentials = async () => {
    try {
      await AsyncStorage.setItem('biometricEmail', 'test@example.com');
      await AsyncStorage.setItem('biometricPassword', 'testpassword');
      await AsyncStorage.setItem('biometricEnabled', 'true');
      checkStoredCredentials();
      checkBiometricStatus();
      Alert.alert('Success', 'Test credentials set');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Biometric Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biometric Status</Text>
        <Text>Has Hardware: {biometricStatus.hasHardware ? 'Yes' : 'No'}</Text>
        <Text>Is Enrolled: {biometricStatus.isEnrolled ? 'Yes' : 'No'}</Text>
        <Text>Biometric Enabled: {biometricStatus.biometricEnabled ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stored Credentials</Text>
        <Text>Has Email: {storedCredentials.hasEmail ? 'Yes' : 'No'}</Text>
        <Text>Has Password: {storedCredentials.hasPassword ? 'Yes' : 'No'}</Text>
        <Text>Email Preview: {storedCredentials.email || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.button} onPress={testBiometricAuth}>
          <Text style={styles.buttonText}>Test Biometric Auth</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={setTestCredentials}>
          <Text style={styles.buttonText}>Set Test Credentials</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={clearBiometricData}>
          <Text style={styles.buttonText}>Clear Biometric Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => {
          checkBiometricStatus();
          checkStoredCredentials();
        }}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6B705B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
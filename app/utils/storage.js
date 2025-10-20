// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
// या secure storage के लिए
// import * as SecureStore from 'expo-secure-store';

// Phone number save करने के लिए
export const savePhoneNumber = async (phoneNumber) => {
  try {
    await AsyncStorage.setItem('user_phone_number', phoneNumber);
    console.log('Phone number saved successfully');
  } catch (error) {
    console.error('Error saving phone number:', error);
  }
};

// Address save करने के लिए
export const saveAddress = async (address) => {
  try {
    await AsyncStorage.setItem('user_address', address);
    console.log('Address saved successfully');
  } catch (error) {
    console.error('Error saving address:', error);
  }
};

// Data retrieve करने के लिए
export const getSavedData = async () => {
  try {
    const [phone, address] = await Promise.all([
      AsyncStorage.getItem('user_phone_number'),
      AsyncStorage.getItem('user_address')
    ]);
    return { phone, address };
  } catch (error) {
    console.error('Error retrieving data:', error);
    return { phone: null, address: null };
  }
};
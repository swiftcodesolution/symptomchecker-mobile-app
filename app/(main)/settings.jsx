// Settings.js
import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Modal, TextInput, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AnimatedBackground from '../components/AnimatedBackground';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  schedulePushNotification, 
  cancelAllNotifications,
  registerForPushNotificationsAsync 
} from '../utils/notificationUtils';
import { savePhoneNumber, saveAddress, getSavedData } from '../utils/storage';
import { firestore, firebaseAuth } from "../config/firebase";
import * as ImagePicker from 'expo-image-picker';

import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc } from "firebase/firestore";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { setDoc, getDoc } from "firebase/firestore";

// Redux imports
import { useDispatch, useSelector } from 'react-redux';
import { 
  loadProfileImage, 
  saveProfileImage, 
  updateUserProfile,
  selectProfileImage,
  selectUserData,
  selectProfileLoading,
  selectProfileError,
  clearError
} from '../redux/slices/userProfileSlice';
import { selectAnswers } from '../redux/slices/userInfoSlice';
import { questionsData } from '../collect-user-info';

const defaultProfileImg = require('../../assets/user.webp');
const { width } = Dimensions.get("window");


const Settings = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [expandedInfo, setExpandedInfo] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });
  
  // Redux hooks
  const dispatch = useDispatch();
  const profileImage = useSelector(selectProfileImage);
  const userData = useSelector(selectUserData);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError = useSelector(selectProfileError);
  const localAnswers = useSelector(selectAnswers);
  
  // Form states
  const [displayName, setDisplayName] = useState(userData.displayName || '');
  const [email, setEmail] = useState(userData.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load phone and address from Firestore/Redux (same as medical-history)
  const loadSavedContacts = useCallback(async () => {
    try {
      // Find the indices for phone and address in questionsData
      const phoneIndex = questionsData.findIndex(q => q.question.includes('Phone Number'));
      const addressIndex = questionsData.findIndex(q => q.question.includes('Home Address'));
      
      // Try to get from Redux first
      let phoneValue = '';
      let addressValue = '';
      
      if (localAnswers && Object.keys(localAnswers).length > 0) {
        phoneValue = localAnswers[phoneIndex]?.answer || '';
        addressValue = localAnswers[addressIndex]?.answer || '';
      }
      
      // If not in Redux, try to load from Firestore
      if (!phoneValue && !addressValue) {
        const user = firebaseAuth.currentUser;
        if (user) {
          const snap = await getDoc(doc(firestore, 'users', user.uid));
          if (snap.exists() && Array.isArray(snap.data()?.answers)) {
            const fbAnswers = snap.data().answers;
            phoneValue = fbAnswers[phoneIndex]?.answer || '';
            addressValue = fbAnswers[addressIndex]?.answer || '';
          }
        }
      }
      
      console.log('🔍 Settings: Loaded saved contacts from Firestore/Redux:', { phoneValue, addressValue });
      setPhoneNumber(phoneValue);
      setAddress(addressValue);
    } catch (error) {
      console.error('Error loading saved contacts:', error);
    }
  }, [localAnswers]);

  useEffect(() => {
    dispatch(loadProfileImage());
    loadSavedContacts();
  }, [dispatch, loadSavedContacts]);

  // Update form fields when userData changes (only name and email)
  useEffect(() => {
    setDisplayName(userData.displayName);
    setEmail(userData.email);
  }, [userData]);

  // Show error alerts if any
  useEffect(() => {
    if (profileError) {
      showErrorAlert(profileError);
      dispatch(clearError());
    }
  }, [profileError, dispatch]);

  const showSuccessAlert = (message) => {
    setAlert({ visible: true, title: 'Success!', message, type: 'success' });
    setTimeout(() => setAlert({ visible: false, title: '', message: '', type: 'info' }), 3000);
  };

  const showErrorAlert = (message) => {
    setAlert({ visible: true, title: 'Error!', message, type: 'error' });
    setTimeout(() => setAlert({ visible: false, title: '', message: '', type: 'info' }), 3000);
  };

  const infoContents = {
    4: 'We value your privacy. Your data is securely stored and never shared with third parties without your consent. Read our full privacy policy for more details.',
    5: 'By using this app, you agree to our terms of service. Please review them carefully to understand your rights and responsibilities.',
    6: 'Symptom Checker AI\nVersion 1.0.0\nThis app helps you track symptoms, manage medications, and access health resources. For support, contact us anytime.'
  };

  const settingsItems = [
    {
      id: 0,
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'person-outline',
      type: 'action',
      action: () => setEditProfileModal(true),
    },
    {
      id: 1,
      title: 'Notifications',
      subtitle: 'Enable push notifications',
      icon: 'notifications-outline',
      type: 'switch',
      value: notifications,
      onValueChange: setNotifications,
    },
    {
      id: 4,
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield-checkmark-outline',
      type: 'info',
    },
    {
      id: 5,
      title: 'Terms of Service',
      subtitle: 'Read our terms of service',
      icon: 'document-text-outline',
      type: 'info',
    },
    {
      id: 6,
      title: 'About App',
      subtitle: 'Version 1.0.0',
      icon: 'information-circle-outline',
      type: 'info',
    },
  ];

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchPreferences = async () => {
      try {
        const userPrefsRef = doc(firestore, 'userPreferences', user.uid);
        const docSnap = await getDoc(userPrefsRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setNotificationsEnabled(data.medicationNotifications || false);
        }
        setLoadingPreferences(false);
      } catch (error) {
        console.error('Error fetching preferences:', error);
        setLoadingPreferences(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const toggleInfo = (id) => {
    setExpandedInfo(expandedInfo === id ? null : id);
  };

  const saveNotificationPreference = async (value) => {
    if (!user) {
      console.log('No user found, cannot save preferences');
      return false;
    }
  
    try {
      const userPrefsRef = doc(firestore, 'userPreferences', user.uid);
      await setDoc(userPrefsRef, {
        medicationNotifications: value,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      console.log('Notification preference saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving preference:', error);
      return false;
    }
  };

  const scheduleAllNotifications = async () => {
    if (!notificationsEnabled) return;
    
    // This would need access to medicines data
    // for (const med of medicines) {
    //   if (med.timeToTake) {
    //     await schedulePushNotification(
    //       med.id,
    //       `Time to take ${med.name}`,
    //       `It's time to take your ${med.name} (${med.dosage})`,
    //       med.timeToTake
    //     );
    //   }
    // }
  };

  const handleNotificationToggle = async (value) => {
    try {
      // First update the UI state optimistically
      setNotificationsEnabled(value);
      
      // Then attempt to save the preference
      const saveSuccess = await saveNotificationPreference(value);
      
      if (!saveSuccess) {
        // If save failed, revert the UI state
        setNotificationsEnabled(!value);
        throw new Error('Failed to save preference');
      }
      
      // Handle notifications based on the new state
      if (value) {
        // If enabling, schedule all notifications
        await scheduleAllNotifications();
        showSuccessAlert('Notifications enabled!');
      } else {
        // If disabling, cancel all notifications
        await cancelAllNotifications();
        showSuccessAlert('Notifications disabled');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showErrorAlert('Failed to update notification settings');
    }
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert('Sorry, we need camera roll permissions to change your profile picture.');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploadingImage(true);
      try {
        // Save image using Redux async action
        await dispatch(saveProfileImage(result.assets[0].uri)).unwrap();
        showSuccessAlert('Profile picture updated!');
        // Force reload profile image to ensure all components update
        dispatch(loadProfileImage());
      } catch (error) {
        console.error('Error saving image:', error);
        showErrorAlert('Failed to save image');
      }
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    console.log('🔍 Settings: Updating profile with:', { displayName, email, phoneNumber, address });
    
    try {
      // Update name and email using Redux async action (saves to users/{uid} collection)
      await dispatch(updateUserProfile({ displayName, email, phoneNumber: phoneNumber.trim(), address: address.trim() })).unwrap();
      
      // Save phone and address to AsyncStorage (same as search-history)
      if (phoneNumber.trim()) {
        console.log("🔍 Settings: Saving phone number to AsyncStorage:", phoneNumber.trim());
        await savePhoneNumber(phoneNumber.trim());
      }
      if (address.trim()) {
        console.log("🔍 Settings: Saving address to AsyncStorage:", address.trim());
        await saveAddress(address.trim());
      }
      
      // Update phone and address in Firestore (same structure as medical-history)
      const phoneIndex = questionsData.findIndex(q => q.question.includes('Phone Number'));
      const addressIndex = questionsData.findIndex(q => q.question.includes('Home Address'));
      
      if (phoneIndex >= 0 || addressIndex >= 0) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        const existingData = docSnap.exists() ? docSnap.data() : { answers: [] };
        
        // Ensure answers array exists and has enough elements
        const answers = Array.isArray(existingData.answers) 
          ? [...existingData.answers] 
          : Array(questionsData.length).fill(null).map(() => ({ answer: '', summarizedAnswer: '' }));
        
        // Update phone number at the correct index
        if (phoneIndex >= 0 && phoneNumber.trim()) {
          const phoneQuestion = questionsData[phoneIndex];
          const summarizedAnswer = phoneQuestion ? `Patient's phone number is ${phoneNumber.trim()}.` : '';
          answers[phoneIndex] = {
            answer: phoneNumber.trim(),
            summarizedAnswer: summarizedAnswer
          };
        }
        
        // Update address at the correct index
        if (addressIndex >= 0 && address.trim()) {
          const addressQuestion = questionsData[addressIndex];
          const summarizedAnswer = addressQuestion ? `Patient's address is ${address.trim()}.` : '';
          answers[addressIndex] = {
            answer: address.trim(),
            summarizedAnswer: summarizedAnswer
          };
        }
        
        // Save updated answers to Firestore
        await setDoc(userDocRef, { 
          answers: answers,
          updatedAt: new Date().toISOString() 
        }, { merge: true });
        
        console.log('🔍 Settings: Updated phone and address in Firestore at indices:', { phoneIndex, addressIndex });
      }
      
      // Reload saved contacts to update the form
      await loadSavedContacts();
      
      console.log('🔍 Settings: Profile updated successfully');
      showSuccessAlert('Profile updated successfully!');
      setEditProfileModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorAlert('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      showErrorAlert('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      showErrorAlert('Password should be at least 6 characters');
      return;
    }
    
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      showSuccessAlert('Password changed successfully!');
      setChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showErrorAlert('Current password is incorrect');
      } else {
        showErrorAlert('Failed to change password');
      }
    }
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          profileImage={profileImage ? { uri: profileImage } : defaultProfileImg}
          greeting={`Hello ${user?.displayName || 'User'}`}
          location="SC, 702 USA"
          sos={true}
          medical={true}
          key={profileImage} // Force re-render when profile image changes
        />
        
        {/* Alert Banner */}
        {alert.visible && (
          <View style={[
            styles.alertBanner, 
            alert.type === 'success' ? styles.successBanner : styles.errorBanner
          ]}>
            <Text style={styles.alertText}>{alert.message}</Text>
          </View>
        )}
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Settings</Text>
          
          <View style={styles.contentSection}>
            <View style={styles.settingsList}>
              {settingsItems.map((item) => (
                <View key={item.id} style={{ width: '100%' }}>
                  <TouchableOpacity 
                    style={styles.settingCard}
                    onPress={item.action || (() => item.type === 'info' && toggleInfo(item.id))}
                  >
                    <View style={styles.settingLeft}>
                      <Ionicons 
                        name={item.icon} 
                        size={width * 0.1}
                        color={theme.primary} 
                        style={styles.settingIcon} 
                      />
                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>{item.title}</Text>
                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    {item.type === 'switch' ? (
                      <Switch
                        value={notificationsEnabled}
                        onValueChange={handleNotificationToggle}
                        thumbColor={notificationsEnabled ? '#6B705B' : '#ccc'}
                        trackColor={{ false: '#ccc', true: '#A3A380' }}
                        disabled={loadingPreferences}
                      />
                    ) : item.type === 'info' ? (
                      <TouchableOpacity style={styles.linkButton} onPress={() => toggleInfo(item.id)}>
                        <Ionicons name={expandedInfo === item.id ? 'chevron-up' : 'chevron-down'} size={20} color={theme.primary} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.linkButton}>
                        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  {item.type === 'info' && expandedInfo === item.id && (
                    <View style={styles.infoContent}>
                      <Text style={styles.infoText}>{infoContents[item.id]}</Text>
                    </View>
                  )}
                </View>
              ))}
              
              {/* Change Password Option */}
              <View style={{ width: '100%' }}>
                <TouchableOpacity 
                  style={styles.settingCard}
                  onPress={() => setChangePasswordModal(true)}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={24} 
                      color={theme.primary} 
                      style={styles.settingIcon} 
                    />
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>Change Password</Text>
                      <Text style={styles.settingSubtitle}>Update your password</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.linkButton}>
                    <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={editProfileModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditProfileModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditProfileModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              {/* Profile Image Section */}
              <View style={styles.profileImageSection}>
                <Image 
                  source={profileImage ? { uri: profileImage } : defaultProfileImg} 
                  style={styles.profileImage}
                  key={profileImage} // Force re-render when profile image changes
                />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={pickImage}
                  disabled={uploadingImage || profileLoading}
                >
                  <Text style={styles.changeImageText}>
                    {uploadingImage ? 'Uploading...' : 'Change Image'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.saveButton, profileLoading && styles.disabledButton]}
                onPress={handleUpdateProfile}
                disabled={profileLoading}
              >
                <Text style={styles.saveButtonText}>
                  {profileLoading ? 'Updating...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              
            </View>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={changePasswordModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setChangePasswordModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setChangePasswordModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.saveButton, profileLoading && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={profileLoading}
              >
                <Text style={styles.saveButtonText}>
                  {profileLoading ? 'Updating...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36,
    color: '#4d5a5a',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 18,
  },
  contentSection: {
    paddingHorizontal: 18,
  },
  settingsList: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d3cdc3',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    color: '#222',
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  linkButton: {
    padding: 8,
  },
  infoContent: {
    backgroundColor: '#ede8e0',
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6B705B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changeImageButton: {
    backgroundColor: '#6B705B',
    padding: 10,
    borderRadius: 5,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
  },
  alertBanner: {
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  successBanner: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  alertText: {
    color: '#155724',
    fontSize: 14,
  },
});

export default Settings;
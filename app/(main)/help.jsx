import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Linking, TextInput, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AnimatedBackground from '../components/AnimatedBackground';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useSelector, useDispatch } from 'react-redux';
import { selectProfileImage, loadProfileImage } from '../redux/slices/userProfileSlice';

const defaultProfileImg = require('../../assets/user.webp');

const Help = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [expandedItem, setExpandedItem] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const profileImage = useSelector(selectProfileImage);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [quickLinks, setQuickLinks] = useState([
    { id: 1, title: 'Company Website', url: 'https://youhealthcompanion.com', icon: 'link-outline' },
    { id: 2, title: 'Support Email', url: 'mailto:support@youhealthcompanion.com', icon: 'mail-outline' }
  ]);

  useEffect(() => {
    dispatch(loadProfileImage());
  }, [dispatch]);

  const helpItems = [
    {
      id: 1,
      title: 'How to use Symptom Checker?',
      content: 'Open the Symptom Checker tab and describe your symptoms in detail. Our AI will analyze your symptoms and provide potential conditions and recommendations.',
      icon: 'medical-outline',
    },
    {
      id: 2,
      title: 'How to add medications?',
      content: 'Go to Medicine Cabinet and tap the + button to add new medications. You can scan barcodes or manually enter medication information.',
      icon: 'medical-outline',
    },
    {
      id: 3,
      title: 'How to view medical history?',
      content: 'Navigate to Medical History to see all your previous symptom checks and medical records. You can search and filter by date.',
      icon: 'time-outline',
    },
    {
      id: 4,
      title: 'How to use SOS feature?',
      content: 'Tap the SOS button in the header or drawer menu for emergency situations. This will provide quick access to emergency contacts and services.',
      icon: 'warning-outline',
    },
    {
      id: 5,
      title: 'How to update profile?',
      content: 'Go to Settings and tap on your profile picture to update personal information, medical conditions, and preferences.',
      icon: 'person-outline',
    },
    {
      id: 6,
      title: 'How to contact support?',
      content: 'For technical support or questions, email us at support@youhealthcompanion.com or use the contact form in Settings.',
      icon: 'mail-outline',
    },
  ];

  const toggleExpanded = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const addQuickLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      Alert.alert('Error', 'Please enter both title and URL');
      return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/|mailto:)/;
    if (!urlPattern.test(linkUrl.trim())) {
      Alert.alert('Error', 'Please enter a valid URL (starting with http://, https://, or mailto:)');
      return;
    }

    const newLink = {
      id: Date.now(),
      title: linkTitle.trim(),
      url: linkUrl.trim(),
      icon: 'link-outline'
    };

    setQuickLinks([...quickLinks, newLink]);
    setLinkTitle('');
    setLinkUrl('');
    Alert.alert('Success', 'Quick link added successfully!');
  };

  const removeQuickLink = (id) => {
    if (id <= 2) {
      Alert.alert('Cannot Remove', 'Default links cannot be removed');
      return;
    }
    setQuickLinks(quickLinks.filter(link => link.id !== id));
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
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Help & Support</Text>
          
          <View style={styles.contentSection}>
            <View style={styles.helpList}>
              {helpItems.map((item) => (
                <View key={item.id} style={styles.helpCard}>
                  <TouchableOpacity 
                    style={styles.helpHeader}
                    onPress={() => toggleExpanded(item.id)}
                  >
                    <View style={styles.helpLeft}>
                      <Ionicons 
                        name={item.icon} 
                        size={24} 
                        color={theme.primary} 
                        style={styles.helpIcon} 
                      />
                      <Text style={styles.helpTitle}>{item.title}</Text>
                    </View>
                    <Ionicons 
                      name={expandedItem === item.id ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={theme.primary} 
                    />
                  </TouchableOpacity>
                  
                  {expandedItem === item.id && (
                    <View style={styles.helpContent}>
                      <Text style={styles.helpText}>{item.content}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Still need help?</Text>
              <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL('mailto:support@youhealthcompanion.com')}>
                <Ionicons name="mail-outline" size={20} color="#fff" style={styles.contactIcon} />
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactButton, { marginTop: 10, backgroundColor: '#22577A' }]} onPress={() => Linking.openURL('https://youhealthcompanion.com')}>
                <Ionicons name="information-circle-outline" size={20} color="#fff" style={styles.contactIcon} />
                <Text style={styles.contactButtonText}>About the App & Company</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickAccessSection}>
              <Text style={styles.quickAccessTitle}>Quick Access Links</Text>
              <Text style={styles.quickAccessSubtitle}>For Ted: Add your custom links here</Text>
              
              <View style={styles.linkForm}>
                <Text style={styles.formLabel}>Add New Quick Access Link:</Text>
                <View style={styles.formRow}>
                  <Text style={styles.formInputLabel}>Title:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter link title..."
                    placeholderTextColor="#999"
                    value={linkTitle}
                    onChangeText={setLinkTitle}
                  />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formInputLabel}>URL:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="https://example.com"
                    placeholderTextColor="#999"
                    value={linkUrl}
                    onChangeText={setLinkUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={addQuickLink}>
                  <Ionicons name="add-outline" size={20} color="#fff" style={styles.addIcon} />
                  <Text style={styles.addButtonText}>Add Link</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quickLinksList}>
                <Text style={styles.quickLinksTitle}>Current Quick Links:</Text>
                {quickLinks.map((link) => (
                  <View key={link.id} style={styles.quickLinkItem}>
                    <Ionicons name={link.icon} size={16} color={theme.primary} />
                    <Text style={styles.quickLinkText}>{link.title}</Text>
                    <View style={styles.quickLinkActions}>
                      <TouchableOpacity 
                        style={styles.openButton}
                        onPress={() => Linking.openURL(link.url)}
                      >
                        <Ionicons name="open-outline" size={16} color={theme.primary} />
                      </TouchableOpacity>
                      {link.id > 2 && (
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => removeQuickLink(link.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#dc3545" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default Help;

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
  helpList: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  helpCard: {
    backgroundColor: '#d3cdc3',
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpIcon: {
    marginRight: 12,
  },
  helpTitle: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
    flex: 1,
  },
  helpContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  contactSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  contactTitle: {
    fontSize: 20,
    color: '#4d5a5a',
    fontWeight: '600',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B705B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickAccessSection: {
    marginTop: 30,
    paddingHorizontal: 18,
  },
  quickAccessTitle: {
    fontSize: 24,
    color: '#4d5a5a',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickAccessSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  linkForm: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  formLabel: {
    fontSize: 16,
    color: '#4d5a5a',
    fontWeight: '600',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  formInputLabel: {
    fontSize: 14,
    color: '#666',
    width: 50,
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#999',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickLinksList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickLinksTitle: {
    fontSize: 16,
    color: '#4d5a5a',
    fontWeight: '600',
    marginBottom: 12,
  },
  quickLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  quickLinkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
  },
}); 
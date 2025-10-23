import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { getPersonalDetails, getInsuranceDetails, getDoctorDetails, getPharmacyDetails, getPersonalContacts } from '../services/firebaseService';
import { captureRef } from 'react-native-view-shot';
import RNShare from 'react-native-share';

const { width } = Dimensions.get('window');

const ShareDetailsModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [userData, setUserData] = useState({
    personalDetails: null,
    insuranceList: [],
    doctorList: [],
    pharmacyList: [],
    contactsList: [],
    medicalHistory: null,
  });

  const qrContainerRef = useRef();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load all data from Firebase services
      const [personal, insurance, doctors, pharmacies, contacts] = await Promise.all([
        getPersonalDetails(),
        getInsuranceDetails(),
        getDoctorDetails(),
        getPharmacyDetails(),
        getPersonalContacts(),
      ]);

      // Load medical history from Firestore
      let medicalHistory = null;
      if (user) {
        try {
          const snap = await getDoc(doc(firestore, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            medicalHistory = data.answers || [];
          }
        } catch (error) {
          console.warn('Error loading medical history:', error);
        }
      }

      const allUserData = {
        personalDetails: personal,
        insuranceList: insurance || [],
        doctorList: doctors || [],
        pharmacyList: pharmacies || [],
        contactsList: contacts || [],
        medicalHistory,
        userInfo: {
          name: user?.displayName || '',
          email: user?.email || '',
        }
      };

      setUserData(allUserData);
      
      // Generate QR code data
      generateQRData(allUserData);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = (data) => {
    try {
      // Create a clean, organized medical profile
      const medicalProfile = {
        "PATIENT MEDICAL PROFILE": {
          "Generated On": new Date().toLocaleString(),
          "Profile ID": `MED-${Date.now()}`,
        },
        
        "BASIC INFORMATION": {
          "Full Name": data.userInfo.name || 'Not provided',
          "Email Address": data.userInfo.email || 'Not provided',
          "Phone Number": data.personalDetails?.contactNo || 'Not provided',
          "Home Address": data.personalDetails?.address || 'Not provided',
        }
      };

      // Add comprehensive medical history if available
      const medicalHistory = formatMedicalHistoryForQR(data.medicalHistory);
      if (medicalHistory !== "No medical history available") {
        // Organize medical history into logical sections
        const organizedHistory = {
          "PERSONAL INFORMATION": {},
          "MEDICAL CONDITIONS": {},
          "SURGICAL HISTORY": {},
          "MEDICATIONS": {},
          "FAMILY HISTORY": {},
          "LIFESTYLE FACTORS": {},
          "INSURANCE DETAILS": {},
          "ADDITIONAL INFORMATION": {}
        };

        // Categorize questions into sections
        Object.entries(medicalHistory).forEach(([question, answer]) => {
          if (question.includes("Date of Birth") || question.includes("Age") || 
              question.includes("Gender") || question.includes("Ethnicity") ||
              question.includes("Height") || question.includes("Weight") ||
              question.includes("Home Address") || question.includes("City") ||
              question.includes("State") || question.includes("Zip Code") ||
              question.includes("Phone Number")) {
            organizedHistory["PERSONAL INFORMATION"][question] = answer;
          } else if (question.includes("blood pressure") || question.includes("diabetes") ||
                     question.includes("heart disease") || question.includes("allergies") ||
                     question.includes("cancer") || question.includes("fever")) {
            organizedHistory["MEDICAL CONDITIONS"][question] = answer;
          } else if (question.includes("surgeries") || question.includes("hospitalized")) {
            organizedHistory["SURGICAL HISTORY"][question] = answer;
          } else if (question.includes("medications")) {
            organizedHistory["MEDICATIONS"][question] = answer;
          } else if (question.includes("family history")) {
            organizedHistory["FAMILY HISTORY"][question] = answer;
          } else if (question.includes("smoke") || question.includes("alcohol") ||
                     question.includes("recreational drugs") || question.includes("weight changes")) {
            organizedHistory["LIFESTYLE FACTORS"][question] = answer;
          } else if (question.includes("Insurance") || question.includes("Policy") ||
                     question.includes("Blood Group") || question.includes("Subscriber")) {
            organizedHistory["INSURANCE DETAILS"][question] = answer;
          } else {
            organizedHistory["ADDITIONAL INFORMATION"][question] = answer;
          }
        });

        // Only add sections that have content
        Object.entries(organizedHistory).forEach(([section, content]) => {
          if (Object.keys(content).length > 0) {
            medicalProfile[section] = content;
          }
        });
      }

      // Add insurance information
      if (data.insuranceList.length > 0) {
        medicalProfile["INSURANCE INFORMATION"] = {};
        data.insuranceList.forEach((ins, index) => {
          medicalProfile["INSURANCE INFORMATION"][`Policy ${index + 1}`] = {
            "Insurance Company": ins.companyName || 'Not provided',
            "Policy Number": ins.policyNo || 'Not provided',
            "Expiry Date": ins.expiryDate || 'Not provided',
          };
        });
      }

      // Add doctor information
      if (data.doctorList.length > 0) {
        medicalProfile["DOCTOR INFORMATION"] = {};
        data.doctorList.forEach((doc, index) => {
          medicalProfile["DOCTOR INFORMATION"][`Doctor ${index + 1}`] = {
            "Doctor Name": doc.doctorName || 'Not provided',
            "Specialization": doc.specialization || 'Not provided',
            "Contact Number": doc.contactNo || doc.phoneNo || 'Not provided',
          };
        });
      }

      // Add pharmacy information
      if (data.pharmacyList.length > 0) {
        medicalProfile["PHARMACY INFORMATION"] = {};
        data.pharmacyList.forEach((pharm, index) => {
          medicalProfile["PHARMACY INFORMATION"][`Pharmacy ${index + 1}`] = {
            "Pharmacy Name": pharm.pharmacyName || 'Not provided',
            "Address": pharm.address || 'Not provided',
            "Contact Number": pharm.contactNo || 'Not provided',
          };
        });
      }

      // Add emergency contacts
      if (data.contactsList.length > 0) {
        medicalProfile["EMERGENCY CONTACTS"] = {};
        data.contactsList.forEach((contact, index) => {
          medicalProfile["EMERGENCY CONTACTS"][`Contact ${index + 1}`] = {
            "Name": contact.Name || 'Not provided',
            "Relation": contact.Relation || 'Not provided',
            "Phone Number": contact.ContactNumber || 'Not provided',
          };
        });
      }

      setQrData(JSON.stringify(medicalProfile, null, 2));
    } catch (error) {
      console.error('Error generating QR data:', error);
      Alert.alert('Error', 'Failed to generate QR code data.');
    }
  };

  const formatMedicalHistoryForQR = (answers) => {
    if (!answers || !Array.isArray(answers)) return "No medical history available";
    
    // Complete list of all onboarding questions from collect-user-info
    const allQuestions = [
      "Date of Birth (MM/DD/YYYY)",
      "Age",
      "Gender (Male/Female/Other)",
      "Ethnicity",
      "Home Address",
      "City",
      "State",
      "Zip Code",
      "Phone Number",
      "Height (ft/in)",
      "Weight (lbs)",
      "Have you had any surgeries in the past?",
      "If yes, please explain your past surgeries:",
      "Have you ever been hospitalized?",
      "If yes, please explain your hospitalizations:",
      "Do you have high blood pressure?",
      "If yes, please explain your high blood pressure:",
      "Do you have diabetes?",
      "If yes, please explain your diabetes:",
      "Do you have heart disease?",
      "If yes, please explain your heart disease:",
      "Do you have any known allergies?",
      "If yes, please explain your allergies:",
      "Do you currently smoke tobacco?",
      "If yes, please explain your smoking habits:",
      "Do you consume alcohol?",
      "If yes, please explain your alcohol consumption:",
      "Do you use recreational drugs?",
      "If yes, please explain your recreational drug use:",
      "Have you experienced any recent weight changes?",
      "If yes, please explain your weight changes:",
      "Have you had a fever in the past month?",
      "If yes, please explain your fever:",
      "Do you have a history of cancer?",
      "If yes, please explain your cancer history:",
      "Is there any family history of serious illness (e.g., cancer, heart disease)?",
      "If yes, please explain your family history:",
      "Please list all current medications you are taking, including dosage and frequency:",
      "Please list all past surgeries, including the date and reason for each:",
      "Please provide any additional health information or concerns:",
      "What is your Primary Insurance Provider?",
      "What is your Policy Number?",
      "What is your Blood Group Number?",
      "What is the Subscriber Name?",
      "What is the Relationship to Patient?",
      "What is your Secondary Insurance Provider (if any)?",
      "What is your Secondary Policy Number?",
      "What is your Secondary Group Number?",
    ];

    const medicalHistory = {};
    
    // Process all answers with their corresponding questions
    answers.forEach((answer, index) => {
      if (index < allQuestions.length) {
        const question = allQuestions[index];
        const answerText = answer?.answer || 'Not provided';
        
        // Only add if we have a valid answer
        if (answerText && 
            answerText !== 'Not provided' && 
            answerText !== 'No answer provided' && 
            answerText.trim() !== '') {
          medicalHistory[question] = answerText;
        }
      }
    });

    return Object.keys(medicalHistory).length > 0 ? medicalHistory : "No medical history available";
  };

  // Share QR Code as Image
  const shareQRCodeAsImage = async () => {
    try {
      if (!qrContainerRef.current) {
        Alert.alert('Error', 'QR code not ready yet.');
        return;
      }

      // Capture QR code container as image
      const uri = await captureRef(qrContainerRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // Share the image using react-native-share
      const shareOptions = {
        title: 'Share Medical QR Code',
        message: `Medical QR Code for ${userData.userInfo.name}\n\nScan this QR code to access complete medical information including personal details, medical history, insurance, and emergency contacts.`,
        url: `file://${uri}`,
        type: 'image/png',
        subject: `Medical QR Code - ${userData.userInfo.name}`,
      };

      await RNShare.open(shareOptions);
    } catch (error) {
      console.error('Error sharing QR code image:', error);
      // Don't show alert if user cancels the share
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share QR code image.');
      }
    }
  };

  // Share as Text Message (Detailed Information)
  const shareAsText = async () => {
    try {
      const shareMessage = `MEDICAL PROFILE - ${userData.userInfo.name}

📋 PERSONAL INFORMATION:
• Name: ${userData.userInfo.name}
• Email: ${userData.userInfo.email}
• Phone: ${userData.personalDetails?.contactNo || 'Not provided'}
• Address: ${userData.personalDetails?.address || 'Not provided'}

🏥 MEDICAL SUMMARY:
• Insurance Policies: ${userData.insuranceList.length}
• Doctors: ${userData.doctorList.length} 
• Pharmacies: ${userData.pharmacyList.length}
• Emergency Contacts: ${userData.contactsList.length}

💊 IMPORTANT DETAILS:
• Complete medical history available via QR code
• Current medications and dosages
• Insurance information with policy numbers
• Emergency contact details

For complete information, please scan the QR code which contains all medical details in a structured format.`;
      
      await Share.share({
        message: shareMessage,
        title: 'My Medical Information',
      });
    } catch (error) {
      console.error('Error sharing as text:', error);
      Alert.alert('Error', 'Failed to share medical information.');
    }
  };

  const renderQRCode = () => {
    if (!qrData) return null;

    const qrSize = Math.min(width * 0.7, 300);

    return (
      <View ref={qrContainerRef} style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrData}
            size={qrSize}
            color="#000000"
            backgroundColor="#FFFFFF"
            logoSize={30}
            logoMargin={2}
            logoBorderRadius={15}
            quietZone={10}
          />
        </View>
        <Text style={styles.qrDescription}>
          Scan this QR code to access your complete medical information
        </Text>
        
        {/* Only 2 Share Buttons as requested */}
        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={shareQRCodeAsImage}>
            <Ionicons name="qr-code-outline" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share QR Code</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.shareButton, styles.textButton]} onPress={shareAsText}>
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share as Text</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDataSummary = () => {
    const { personalDetails, insuranceList, doctorList, pharmacyList, contactsList, medicalHistory } = userData;
    
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Your QR Code Contains:</Text>
        
        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>📋 Complete Patient Information</Text>
          <Text style={styles.summaryText}>
            • Full Name, Email Address, Phone Number, Address{'\n'}
            • Date of Birth, Age, Gender, Ethnicity{'\n'}
            • Height, Weight, Blood Group{'\n'}
            • All Personal Details from Onboarding
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>🏥 Comprehensive Medical History</Text>
          <Text style={styles.summaryText}>
            • Medical Conditions (Blood Pressure, Diabetes, Heart Disease, Allergies){'\n'}
            • Surgical History (Past Surgeries, Hospitalizations){'\n'}
            • Current Medications with Dosage & Frequency{'\n'}
            • Family Medical History & Cancer History{'\n'}
            • Lifestyle Factors (Smoking, Alcohol, Drug Use, Weight Changes)
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>🏥 Healthcare Providers & Insurance</Text>
          <Text style={styles.summaryText}>
            • {insuranceList.length} Insurance Policy(s) with Company & Policy Numbers{'\n'}
            • {doctorList.length} Doctor(s) with Names, Specializations & Contacts{'\n'}
            • {pharmacyList.length} Pharmacy(ies) with Names, Addresses & Contacts{'\n'}
            • {contactsList.length} Emergency Contact(s) with Names, Relations & Phone Numbers
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share Your Details by QR Code</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22577A" />
            <Text style={styles.loadingText}>Generating your QR code...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderQRCode()}
            {renderDataSummary()}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Share your medical information easily via QR code image or text message. Perfect for emergencies and doctor visits.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
  },
  shareButtonsContainer: {
    // flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 15,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22577A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    justifyContent: 'center',
  },
  textButton: {
    backgroundColor: '#38A3A5',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22577A',
    marginBottom: 16,
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 16,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginBottom: 50,
  },
  footerText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ShareDetailsModal;
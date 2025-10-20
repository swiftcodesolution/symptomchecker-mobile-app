import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SmallButton from "../../components/SmallButton";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import AnimatedBackground from "../../components/AnimatedBackground";
import Header from "../../components/Header";
import EditPersonalDetailsModal from "../../components/EditPersonalDetailsModal";
import EditInsuranceModal from "../../components/EditInsuranceModal";
import EditDoctorModal from "../../components/EditDoctorModal";
import EditPharmacyModal from "../../components/EditPharmacyModal";
import EditPersonalContactsModal from "../../components/EditPersonalContactsModal";
import Icon from "react-native-vector-icons/Feather";
import DoctorDirectory from "../../components/DoctorDirectory";
import InsuranceDirectory from "../../components/InsuranceDirectory";
import PharmacyDirectory from "../../components/PharmacyDirectory";
import ContactsDirectory from "../../components/ContactsDirectory";
import PersonalDetailsView from "../../components/PersonalDetailsView";
import { getAuth } from 'firebase/auth';
import { useFocusEffect } from "@react-navigation/native";

import {
  getPersonalDetails,
  getInsuranceDetails,
  getDoctorDetails,
  getPharmacyDetails,
  getPersonalContacts,
  deleteInsuranceDetails,
  deleteDoctorDetails,
  deletePharmacyDetails,
  deletePersonalContact,
  getPrimaryDoctor,
} from "../../services/firebaseService";

// 🔴 Fallback: read `users/<uid>` → answers[]
import { firebaseAuth, firestore } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";

const profileImg = require("../../../assets/user.webp");
const HEADER_HEIGHT = 300;

// ---------- helpers to map answers[] -> personalDetails ----------
const getByQuestion = (answers, startsWith) => {
  const idx = answers.findIndex(
    (a) => (a?.question || "")?.toLowerCase().startsWith(startsWith.toLowerCase())
  );
  if (idx === -1) return "";
  return (answers[idx]?.answer || "").trim();
};

const mapAnswersToPersonalDetails = (answers = []) => {
  const name = getByQuestion(answers, "What is your Full Name");
  const contactNo = getByQuestion(answers, "What is your Phone Number");
  email = getByQuestion(answers, "What is your Email Address");
  const addr = getByQuestion(answers, "What is your Home Address");
  const city = getByQuestion(answers, "What is your City");
  const state = getByQuestion(answers, "What is your State");
  const zip = getByQuestion(answers, "What is your Zip Code");

  const addressParts = [addr, city, state, zip].filter(Boolean);
  const address = addressParts.join(", ");

  const hasAny =
    (name && name.length) ||
    (contactNo && contactNo.length) ||
    (email && email.length) ||
    (address && address.length);

  if (!hasAny) return null;

  return { name, contactNo, email, address };
};

const MedicalWallet = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const anim = useRef(new Animated.Value(0)).current;
   const auth = getAuth();
     const user = auth.currentUser;
     console.log("user", user.email);
     

  // View (directory) modal toggles
  const [showDoctors, setShowDoctors] = useState(false);
  const [showInsuranceDir, setShowInsuranceDir] = useState(false);
  const [showPharmacyDir, setShowPharmacyDir] = useState(false);
  const [showContactsDir, setShowContactsDir] = useState(false);
  const [showPersonalView, setShowPersonalView] = useState(false);

  // Data states
  const [personalDetails, setPersonalDetails] = useState(null);
  const [insuranceList, setInsuranceList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [pharmacyList, setPharmacyList] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [primaryDoctor, setPrimaryDoctor] = useState(null);

  // Modals
  const [personalModalVisible, setPersonalModalVisible] = useState(false);
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [doctorModalVisible, setDoctorModalVisible] = useState(false);
  const [pharmacyModalVisible, setPharmacyModalVisible] = useState(false);

  // Edit states
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingPharmacy, setEditingPharmacy] = useState(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [personal, insurance, doctors, pharmacies, contacts, primary] = await Promise.all([
        getPersonalDetails(),
        getInsuranceDetails(),
        getDoctorDetails(),
        getPharmacyDetails(),
        getPersonalContacts(),
        getPrimaryDoctor(),
      ]);

      let mergedPersonal = personal;

      const user = firebaseAuth.currentUser;

      const nothingInPersonal =
        !personal ||
        (!personal.name && !personal.contactNo && !personal.email && !personal.address);

      if (nothingInPersonal) {
        if (user) {
          const snap = await getDoc(doc(firestore, "users", user.uid));
          const answersArr = snap.exists() ? snap.data()?.answers || [] : [];
          const withQuestions = answersArr.map((a, i) => ({
            ...a,
            question:
              [
                "What is your Full Name?",
                "What is your Date of Birth (MM/DD/YYYY)?",
                "What is your Age?",
                "What is your Gender (Male/Female/Other)?",
                "What is your Ethnicity?",
                "What is your Home Address?",
                "What is your City?",
                "What is your State?",
                "What is your Zip Code?",
                "What is your Phone Number?",
                "What is your Email Address?",
                "What is your Height (ft/in)?",
                "What is your Weight (lbs)?",
              ][i] || "",
          }));
          const mapped = mapAnswersToPersonalDetails(withQuestions);
          if (mapped) mergedPersonal = mapped;
        }
      }

      setPersonalDetails(mergedPersonal || null);
      setInsuranceList(insurance || []);
      setDoctorList(doctors || []);
      setPharmacyList(pharmacies || []);
      setContactsList(contacts || []);
      setPrimaryDoctor(primary);
      
      // Debug logging
      console.log("🔍 Doctor data loaded:", doctors);
      console.log("🔍 Primary doctor:", primary);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

    useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  // Contacts
  const handleAddContact = () => {
    setEditingContact(null);
    setContactsModalVisible(true);
  };
  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setContactsModalVisible(true);
  };

  // Insurance
  const handleAddInsurance = () => {
    setEditingInsurance(null);
    setInsuranceModalVisible(true);
  };
  const handleEditInsurance = (insurance) => {
    setEditingInsurance(insurance);
    setInsuranceModalVisible(true);
  };
  const handleDeleteInsurance = (id) => {
    Alert.alert("Delete Insurance", "Are you sure you want to delete this insurance?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteInsuranceDetails(id);
            await loadAllData();
            Alert.alert("Success", "Insurance deleted successfully!");
          } catch (e) {
            Alert.alert("Error", "Failed to delete insurance.");
          }
        },
      },
    ]);
  };

  // Pharmacy
  const handleAddPharmacy = () => {
    setEditingPharmacy(null);
    setPharmacyModalVisible(true);
  };
  const handleEditPharmacy = (pharmacy) => {
    setEditingPharmacy(pharmacy);
    setPharmacyModalVisible(true);
  };
  const handleDeletePharmacy = (id) => {
    Alert.alert("Delete Pharmacy", "Are you sure you want to delete this pharmacy?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePharmacyDetails(id);
            await loadAllData();
            Alert.alert("Success", "Pharmacy deleted successfully!");
          } catch (e) {
            Alert.alert("Error", "Failed to delete pharmacy.");
          }
        },
      },
    ]);
  };

  // header animation
  const animateHeader = (show) => {
    Animated.timing(anim, {
      toValue: show ? 0 : -HEADER_HEIGHT,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const delta = currentY - lastScrollY.current;
    if (Math.abs(delta) < 10) return;
    if (delta > 0 && isHeaderVisible && currentY > 40) {
      setIsHeaderVisible(false);
      animateHeader(false);
    } else if (delta < 0 && !isHeaderVisible && currentY < 60) {
      setIsHeaderVisible(true);
      animateHeader(true);
    }
    lastScrollY.current = currentY;
  };

  const handleEditPersonal = () => setPersonalModalVisible(true);


  console.log("personalDetails", personalDetails);
  

  const renderPersonalDetails = () => {
    if (!personalDetails) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No personal details added yet</Text>
        </View>
      );
    }
    return (
      <View style={styles.detailsContent}>
        {!!user?.displayName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{user?.displayName}</Text>
          </View>
        )}
        {/* {!!personalDetails.contactNo && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact No:</Text>
            <Text style={styles.detailValue}>{personalDetails.contactNo}</Text>
          </View>
        )} */}
        {!!user.email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{user.email}</Text>
          </View>
        )}
        {/* {!!personalDetails.address && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{personalDetails.address}</Text>
          </View>
        )} */}
      </View>
    );
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.contentSection}>
          <Animated.View
            style={[
              styles.animatedContent,
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                marginLeft: "5%",
                transform: [{ translateY: anim }],
                opacity: anim.interpolate({
                  inputRange: [-HEADER_HEIGHT, 0],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Header
              profileImage={profileImg}
              greeting="Hello Scott"
              location="SC, 702 USA"
              sos={true}
              medical={true}
            />
            <Text style={styles.pageTitle}>Medical Wallet</Text>
          </Animated.View>

          <View style={styles.listWrapper}>
            <ScrollView
              style={styles.scrollViewStyles}
              contentContainerStyle={styles.scrollViewStylesInner}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <View style={styles.contentPadding}>
                {/* Personal Details */}
                <View style={[styles.card, { marginTop: HEADER_HEIGHT }]}>
                  <View style={styles.titleBox}>
                    <Text style={styles.sectionHeading}>Personal Details</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <SmallButton btnText="View" pressFunction={() => setShowPersonalView(true)} />
                      {/* <SmallButton btnText="Edit" pressFunction={handleEditPersonal} /> */}
                    </View>
                  </View>
                  {renderPersonalDetails()}
                </View>

                {/* Insurance Details */}
                <View style={styles.card}>
                  <View style={styles.titleBox}>
                    <Text style={styles.sectionHeading}>Insurance Details</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <SmallButton btnText="View" pressFunction={() => setShowInsuranceDir(true)} />
                      {/* <SmallButton btnText="Add" pressFunction={handleAddInsurance} /> */}
                    </View>
                  </View>

                  {/* compact list */}
                  {insuranceList.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No insurance details added yet</Text>
                      <TouchableOpacity onPress={handleAddInsurance} style={styles.addButton}>
                        <Text style={styles.addButtonText}>Add Insurance</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.tableHeaderRow}>
                        <Text style={styles.tableHeader}>Company</Text>
                        <Text style={styles.tableHeader}>Policy No</Text>
                        {/* <Text style={styles.tableHeader}>Expiry</Text>
                        <Text style={styles.tableHeader}>Action</Text> */}
                      </View>
                      {insuranceList.map((insurance, index) => (
                        <View key={insurance.id || index} style={styles.tableRow}>
                          <Text style={styles.tableCell}>{insurance.companyName || "—"}</Text>
                          <Text style={styles.tableCell}>{insurance.policyNo || "—"}</Text>
                          {/* <Text style={styles.tableCell}>{insurance.expiryDate || "—"}</Text>
                          <View style={[styles.tableCell, { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: -4 }]}>
                            <TouchableOpacity onPress={() => handleEditInsurance(insurance)} style={styles.iconButton}>
                              <Icon name="edit" size={18} color="#22577A" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteInsurance(insurance.id)} style={styles.iconButton}>
                              <Icon name="trash-2" size={18} color="#dc3545" />
                            </TouchableOpacity>
                          </View> */}
                        </View>
                      ))}
                    </>
                  )}
                </View>

                {/* Doctor Details (compact) */}
                <View style={styles.card}>
                  <View style={styles.titleBox}>
                    <Text style={styles.sectionHeading}>Doctor Details</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <SmallButton btnText="View" pressFunction={() => setShowDoctors(true)} />
                    </View>
                  </View>

                  {doctorList.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No doctor details added yet</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingDoctor(null);
                          setDoctorModalVisible(true);
                        }}
                        style={styles.addButton}
                      >
                        <Text style={styles.addButtonText}>Add Doctor</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.tableHeaderRow}>
                        <Text style={styles.tableHeader}>Name</Text>
                        <Text style={styles.tableHeader}>Contact</Text>
                        <Text style={styles.tableHeader}>Status</Text>
                      </View>
                      {doctorList.map((doctor, index) => (
                        <View key={doctor.id || index} style={styles.tableRow}>
                          <Text style={styles.tableCell}>{doctor.doctorName || "—"}</Text>
                          <Text style={styles.tableCell}>{doctor.phoneNo || "—"}</Text>
                          <View style={styles.tableCell}>
                            {doctor.isPrimary ? (
                              <View style={styles.primaryBadge}>
                                <Icon name="star" size={12} color="#FFD700" />
                                <Text style={styles.primaryText}>Primary</Text>
                              </View>
                            ) : (
                              <Text style={styles.normalText}>Regular</Text>
                            )}
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.addButtonRow}
                        onPress={() => {
                          setEditingDoctor(null);
                          setDoctorModalVisible(true);
                        }}
                      >
                        <Text style={styles.addButtonRowText}>+ Add New Doctor</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Personal Contacts */}
                <View style={styles.card}>
                  <View style={styles.titleBox}>
                    <Text style={styles.sectionHeading}>Personal Contacts</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <SmallButton btnText="View" pressFunction={() => setShowContactsDir(true)} />
                    </View>
                  </View>

                  {contactsList.length > 0 ? (
                    <>
                      <View style={styles.tableHeaderRow}>
                        <Text style={styles.tableHeader}>Name</Text>
                        <Text style={styles.tableHeader}>Relation</Text>
                        {/* <Text style={styles.tableHeader}>Contact</Text> */}
                        {/* <Text style={styles.tableHeader}>Action</Text> */}
                      </View>
                      {contactsList.map((contact, index) => (
                        <View key={contact.id || index} style={styles.tableRow}>
                          <Text style={styles.tableCell}>{contact.Name}</Text>
                          <Text style={styles.tableCell}>{contact.Relation}</Text>
                          {/* <Text style={styles.tableCell}>{contact.ContactNumber}</Text>
                          <View style={[styles.tableCell, { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: -4 }]}>
                            <TouchableOpacity onPress={() => handleEditContact(contact)} style={styles.iconButton}>
                              <Icon name="edit" size={18} color="#22577A" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: async () => {
                                      try {
                                        await deletePersonalContact(contact.id);
                                        await loadAllData();
                                      } catch (e) {
                                        Alert.alert("Error", "Failed to delete contact.");
                                      }
                                    },
                                  },
                                ]);
                              }}
                              style={styles.iconButton}
                            >
                              <Icon name="trash-2" size={18} color="#dc3545" />
                            </TouchableOpacity>
                          </View> */}
                        </View>
                      ))}
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No contacts added yet</Text>
                    </View>
                  )}
                </View>

                {/* Preferred Pharmacy */}
                <View style={styles.card}>
                  <View style={styles.titleBox}>
                    <Text style={styles.sectionHeading}>Preferred Pharmacy</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <SmallButton btnText="View" pressFunction={() => setShowPharmacyDir(true)} />
                    </View>
                  </View>

                  {/* compact list */}
                  {pharmacyList.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No pharmacy added yet</Text>
                      <TouchableOpacity onPress={handleAddPharmacy} style={styles.addButton}>
                        <Text style={styles.addButtonText}>Add Pharmacy</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.tableHeaderRow}>
                        <Text style={styles.tableHeader}>Pharmacy</Text>
                        <Text style={styles.tableHeader}>Address</Text>
                        {/* <Text style={styles.tableHeader}>Phone</Text>
                        <Text style={styles.tableHeader}>Action</Text> */}
                      </View>
                      {pharmacyList.map((pharmacy, index) => (
                        <View key={pharmacy.id || index} style={styles.tableRow}>
                          <Text style={styles.tableCell}>{pharmacy.pharmacyName || "—"}</Text>
                          <Text style={styles.tableCell} numberOfLines={1}>{pharmacy.address || "—"}</Text>
                          {/* <Text style={styles.tableCell}>{pharmacy.contactNo || "—"}</Text>
                          <View style={[styles.tableCell, { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: -4 }]}>
                            <TouchableOpacity onPress={() => handleEditPharmacy(pharmacy)} style={styles.iconButton}>
                              <Icon name="edit" size={18} color="#22577A" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeletePharmacy(pharmacy.id)} style={styles.iconButton}>
                              <Icon name="trash-2" size={18} color="#dc3545" />
                            </TouchableOpacity>
                          </View> */}
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addButtonRow} onPress={handleAddPharmacy}>
                        <Text style={styles.addButtonRowText}>+ Add New Pharmacy</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Modals */}
        <EditPersonalDetailsModal
          visible={personalModalVisible}
          onClose={() => setPersonalModalVisible(false)}
          currentDetails={personalDetails}
          onSave={() => {
            loadAllData();
            setShowPersonalView(true);
          }}
          name={user?.displayName || ""}
        />
        <EditInsuranceModal
          visible={insuranceModalVisible}
          onClose={() => setInsuranceModalVisible(false)}
          currentInsurance={editingInsurance}
          onSave={() => {
            loadAllData();
            setShowInsuranceDir(true);
          }}
        />
        <EditDoctorModal
          visible={doctorModalVisible}
          onClose={() => setDoctorModalVisible(false)}
          currentDoctor={editingDoctor}
          onSave={() => {
            loadAllData();
            setShowDoctors(true);
          }}
        />
        <EditPersonalContactsModal
          visible={contactsModalVisible}
          onClose={() => setContactsModalVisible(false)}
          currentContact={editingContact}
          onSave={() => {
            loadAllData();
            setShowContactsDir(true);
          }}
        />
        <EditPharmacyModal
          visible={pharmacyModalVisible}
          onClose={() => setPharmacyModalVisible(false)}
          currentPharmacy={editingPharmacy}
          onSave={() => {
            loadAllData();
            setShowPharmacyDir(true);
          }}
        />

        {/* Directory / View modals */}
        <DoctorDirectory visible={showDoctors} onClose={() => setShowDoctors(false)} />
        <InsuranceDirectory visible={showInsuranceDir} onClose={() => setShowInsuranceDir(false)} />
        <PharmacyDirectory visible={showPharmacyDir} onClose={() => setShowPharmacyDir(false)} />
        <ContactsDirectory visible={showContactsDir} onClose={() => setShowContactsDir(false)} />
        <PersonalDetailsView
          visible={showPersonalView}
          onClose={() => setShowPersonalView(false)}
          currentDetails={personalDetails}
          onUpdated={() => loadAllData()}
        />
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default MedicalWallet;

const styles = StyleSheet.create({
  pageTitle: {
    textAlign: "center",
    fontSize: 22,
    color: "#465D69",
    fontWeight: "500",
    marginBottom: 10,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#E9E7E1",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  titleBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeading: { color: "#22577A", fontSize: 20, fontWeight: "bold" },
  detailsContent: { gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, flexWrap: "wrap" },
  detailLabel: { fontWeight: "bold", color: "#22577A", marginRight: 6 },
  detailValue: { color: "#444", marginRight: 10 },
  emptyState: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#666", fontSize: 16, marginBottom: 10 },
  addButton: { backgroundColor: "#22577A", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#D7F9F1", borderRadius: 8, paddingVertical: 6, marginBottom: 4 },
  tableHeader: { flex: 1, fontWeight: "bold", color: "#22577A", textAlign: "center" },
  tableRow: { flexDirection: "row", paddingVertical: 4 },
  tableCell: { flex: 1, color: "#444", textAlign: "center" },
  scrollViewStyles: { flex: 1 },
  scrollViewStylesInner: { gap: 20, paddingBottom: 20 },
  contentPadding: { paddingHorizontal: 18 },
  contentSection: { paddingHorizontal: 18, flex: 1 },
  animatedContent: { zIndex: 1, backgroundColor: "transparent", width: "100%" },
  listWrapper: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 18, color: "#22577A", fontWeight: "bold" },
  iconButton: { padding: 6, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)" },
  addButtonRow: { backgroundColor: "#f5f5f5", paddingVertical: 12, borderRadius: 6, marginTop: 8, alignItems: "center" },
  addButtonRowText: { color: "#22577A", fontWeight: "600" },
  primaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    alignSelf: "center",
  },
  primaryText: {
    fontSize: 10,
    color: "#B8860B",
    fontWeight: "bold",
    marginLeft: 2,
  },
  normalText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

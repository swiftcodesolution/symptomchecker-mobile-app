// screens/Sos.js
import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SmallButton from "../components/SmallButton";
import { useTheme } from "../theme/ThemeContext";
import { useSelector, useDispatch } from 'react-redux';
import { selectProfileImage, loadProfileImage } from '../redux/slices/userProfileSlice';
import Icon from "react-native-vector-icons/MaterialIcons";
import AnimatedBackground from "../components/AnimatedBackground";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from "../components/Header";
import EditPersonalDetailsModal from "../components/EditPersonalDetailsModal";
import { getAuth } from 'firebase/auth';
import {
  getPersonalDetails,
  getEmergencyContacts,
  saveEmergencyContact,
  deleteEmergencyContact,
  // ---- SOS single-doctor APIs ----
  getSosDoctor,
  saveSosDoctor,
  deleteSosDoctor,
  // ---- MULTI doctors list (compact + table) ----
  getDoctorDetails,
  getPrimaryDoctor
} from "../services/firebaseService";
import EditDoctorModal from "../components/EditDoctorModal";
import EditEmergencyContactModal from "../components/EditEmergencyContactModal";
import CustomAlert1 from "../components/CustomAlert1";
import DoctorsTableModal from "../components/DoctorsTableModal";
import PersonalDetailsView from "../components/PersonalDetailsView";

const Sos = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const profileImage = useSelector(selectProfileImage);
   const auth = getAuth();
     const user = auth.currentUser;

  const [personalDetails, setPersonalDetails] = useState(null);
  const [personalModalVisible, setPersonalModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
    const [showPersonalView, setShowPersonalView] = useState(false);

  const [editVisible, setEditVisible] = useState(false);

  // 🟢 SINGLE doctor object for SOS
  const [sosDoctor, setSosDoctor] = useState(null);

  // 🟢 MULTI doctors list (for compact lines + table modal)
  const [doctors, setDoctors] = useState([]);
  const [doctorsModalVisible, setDoctorsModalVisible] = useState(false);
  const [primaryDoctor, setPrimaryDoctor] = useState(null);

  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [editingContact, setEditingContact] = useState(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const [editingDoctor, setEditingDoctor] = useState(null); // used by SOS edit only
  const [doctorModalVisible, setDoctorModalVisible] = useState(false); // SOS modal only

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'default',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });

  const navigation = useNavigation();
  const openAdd = () => {
    setCurrentRow(null);
    setEditVisible(true);
  };

  const handlePress = () => {
    // Always call 911 for emergency
    Linking.openURL('tel:911');
  };

  useEffect(() => {
    dispatch(loadProfileImage());
    loadAllData();
  }, [dispatch]);

  // Reload data when SOS page is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 SOS page focused, reloading data...');
      loadAllData();
    }, [])
  );

  const handleEditPersonal = () => {
    setPersonalModalVisible(true);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [personal, sosDoc, contacts, docs, primary] = await Promise.all([
        getPersonalDetails(),
        getSosDoctor(),         // ✅ single doc for SOS
        getEmergencyContacts(),
        getDoctorDetails(),     // ✅ full doctors list
        getPrimaryDoctor()      // ✅ primary doctor
      ]);
      setPersonalDetails(personal);
      setSosDoctor(sosDoc);
      setEmergencyContacts(contacts);
      setDoctors(docs || []);
      setPrimaryDoctor(primary);
      
      // Debug logging
      console.log('🔍 SOS page - Doctor data loaded:', docs);
      console.log('🔍 SOS page - Primary doctor:', primary);
      console.log('🔍 SOS page - Primary doctor phone:', primary?.phoneNo);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('setDoctors==>>>>> ', doctors.length);


  // ---------------- SOS Doctor handlers (single) ----------------
  const handleAddDoctor = () => {
    if (sosDoctor) {
      setAlertConfig({
        title: 'Only One SOS Doctor',
        message: 'You can keep only one doctor in SOS. Please edit or delete the current doctor first.',
        type: 'default',
        confirmText: 'OK',
        cancelText: null,
      });
      setAlertVisible(true);
      return;
    }
    setEditingDoctor(null);
    setDoctorModalVisible(true);
  };

  const handleEditDoctor = () => {
    if (!sosDoctor) return;
    setEditingDoctor(sosDoctor);
    setDoctorModalVisible(true);
  };

  const handleDeleteDoctor = () => {
    if (!sosDoctor) return;
    setAlertConfig({
      title: 'Delete SOS Doctor',
      message: 'Are you sure you want to remove your SOS doctor?',
      type: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteSosDoctor();
          await loadAllData();
          setAlertConfig({
            title: 'Removed',
            message: 'SOS doctor removed successfully.',
            type: 'success',
            confirmText: 'OK',
            cancelText: null,
          });
          setAlertVisible(true);
        } catch (e) {
          setAlertConfig({
            title: 'Error',
            message: 'Failed to delete SOS doctor.',
            type: 'error',
            confirmText: 'OK',
            cancelText: null,
          });
          setAlertVisible(true);
        }
      },
    });
    setAlertVisible(true);
  };

    const handleDoctorsModalClose = () => {
    setDoctorsModalVisible(false);
    // Modal close होते ही data refresh करें
    loadAllData();
  };

  // ---------------- Emergency Contacts handlers ----------------
  const handleAddContact = () => {
    setEditingContact(null);
    setContactModalVisible(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setContactModalVisible(true);
  };

  const handleDeleteContact = (id) => {
    setAlertConfig({
      title: 'Delete Contact',
      message: 'Are you sure you want to delete this contact?',
      type: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        deleteEmergencyContact(id)
          .then(() => {
            loadAllData();
            setAlertConfig({
              title: 'Success',
              message: 'Contact deleted successfully!',
              type: 'success',
              confirmText: 'OK',
              cancelText: null,
            });
            setAlertVisible(true);
          })
          .catch((error) => {
            setAlertConfig({
              title: 'Error',
              message: 'Failed to delete contact.',
              type: 'error',
              confirmText: 'OK',
              cancelText: null,
            });
            setAlertVisible(true);
          });
      },
    });
    setAlertVisible(true);
  };

  const renderEmergencyContacts = () => {
    if (!emergencyContacts?.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No emergency contacts added yet</Text>
          <TouchableOpacity onPress={handleAddContact} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Contact</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.cardBox, { padding: 0 }]}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHeader}>Name</Text>
          <Text style={styles.tableHeader}>Relation</Text>
          <Text style={styles.tableHeader}>Contact</Text>
          <Text style={styles.tableHeader}>Actions</Text>
        </View>
        {emergencyContacts.map((contact) => (
          <View key={contact.id} style={styles.tableRow}>
            <Text style={styles.tableCell}>{user?.displayName}</Text>
            <Text style={styles.tableCell}>{contact.relation}</Text>
            <Text style={styles.tableCell}>{contact.phone}</Text>
            <View style={styles.actionCell}>
              <TouchableOpacity onPress={() => handleEditContact(contact)} style={styles.iconButton}>
                <Icon name="edit" size={18} color="#22577A" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteContact(contact.id)} style={styles.iconButton}>
                <Icon name="delete" size={18} color="#EB2F29" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPersonalDetails = () => {
      if (!user?.displayName) {
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

  // ---------- COMPACT DOCTORS LIST (client's requirement) ----------
  const renderDoctorsCompact = () => {
    if (!doctors?.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No doctors added yet</Text>
          <TouchableOpacity onPress={() => setDoctorsModalVisible(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Doctor</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={{ gap: 6 }}>
        {/* Show Primary Doctor First */}
        {primaryDoctor && (
          <View style={styles.primaryDoctorCard}>
            <View style={styles.primaryDoctorHeader}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.primaryDoctorLabel}>Primary Doctor</Text>
            </View>
            <Text style={styles.primaryDoctorName}>{primaryDoctor.doctorName}</Text>
            {primaryDoctor.phoneNo && (
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${primaryDoctor.phoneNo}`)}
              >
                <Icon name="phone" size={14} color="#22577A" />
                <Text style={styles.callButtonText}>Call: {primaryDoctor.phoneNo}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Show All Doctors */}
        {doctors.map((d) => {
          const spec = d.specialization ? String(d.specialization) : '';
          const line = `${d.doctorName || 'Unknown'} — ${spec || 'Specialization not set'}`;
          return (
            <Text
              key={d.id}
              style={styles.compactLine}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {line}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderDoctor = () => {
    if (!sosDoctor) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No SOS doctor set</Text>
          <TouchableOpacity onPress={handleAddDoctor} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Doctor</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const d = sosDoctor;
    return (
      <View style={styles.listItem}>
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle}>{d.doctorName}</Text>
          {!!d.specialization && <Text style={styles.listItemSubtitle}>{d.specialization}</Text>}
          {!!d.phoneNo && <Text style={styles.listItemDetail}>Phone: {d.phoneNo}</Text>}
          {!!d.hospitalName && <Text style={styles.listItemDetail}>Hospital: {d.hospitalName}</Text>}
        </View>
        <View style={styles.listItemActions}>
          <TouchableOpacity onPress={handleEditDoctor} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteDoctor} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22577A" />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </SafeAreaView>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <Header
            profileImage={profileImage ? { uri: profileImage } : require("../../assets/user.webp")}
            greeting="Hello Scott"
            location="SC, 702 USA"
            sos={false}
            medical={true}
            key={profileImage}
          />

          {/* SOS Button */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity style={styles.sosBtn} onPress={handlePress}>
              <Icon name="call" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.sosBtnText}>
                Click here to dial 911
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingLeft: 16, paddingRight: 16 }}>
            {/* Personal Details */}
            <View style={[styles.card]}>
              <View style={styles.titleBox}>
                <Text style={styles.sectionHeading}>Personal Details</Text>
                <SmallButton btnText="View" pressFunction={() => setShowPersonalView(true)} />
              </View>
              {renderPersonalDetails()}
            </View>

            {/* Emergency Contacts */}
            <View style={[styles.card]}>
              <View style={styles.titleBox}>
                <Text style={styles.sectionHeading}>Emergency Details</Text>
                <SmallButton btnText="Add" pressFunction={handleAddContact} />
              </View>
              {renderEmergencyContacts()}
            </View>

            {/* SOS Doctor (SINGLE) */}
            {/* <View style={styles.card}>
              <View style={styles.titleBox}>
                <Text style={styles.sectionHeading}>Doctor (SOS)</Text>
                <SmallButton btnText="Add" pressFunction={handleAddDoctor} />
              </View>
              {renderDoctor()}
            </View> */}

            {/* Doctors (ALL) — compact lines + View button */}
            <View style={styles.card}>
              <View style={styles.titleBox}>
                <Text style={styles.sectionHeading}>Doctors(sos)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {/* <SmallButton btnText="View" pressFunction={() => setDoctorsModalVisible(true)} /> */}
                  {doctors.length === 0 ? (
                    <SmallButton btnText="Add" pressFunction={() => setDoctorsModalVisible(true)} />
                  ) : (
                    <SmallButton btnText="View" pressFunction={() => setDoctorsModalVisible(true)} />
                  )}
                </View>
              </View>
              {/* Client’s requested format: name — specialization… each on new line with ellipsis */}
              {renderDoctorsCompact()}
            </View>
          </View>
        </ScrollView>

        {/* Modals */}
        <EditPersonalDetailsModal
          visible={personalModalVisible}
          onClose={() => setPersonalModalVisible(false)}
          currentDetails={personalDetails}
          onSave={() => {
            loadAllData();
          }}
        />

         <PersonalDetailsView
          visible={showPersonalView}
          onClose={() => setShowPersonalView(false)}
          currentDetails={personalDetails}
          onUpdated={() => loadAllData()}
        />

        <CustomAlert1
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          onConfirm={() => {
            setAlertVisible(false);
            if (alertConfig.onConfirm) alertConfig.onConfirm();
          }}
          onCancel={() => {
            setAlertVisible(false);
            if (alertConfig.onCancel) alertConfig.onCancel();
          }}
        />

        {/* IMPORTANT: this modal should return `details` in onSave (SOS single) */}
        <EditDoctorModal
          visible={doctorModalVisible}
          onClose={() => setDoctorModalVisible(false)}
          currentDoctor={editingDoctor}
          onSave={async (details) => {
            try {
              await saveSosDoctor(details);   // ✅ write to single-doc SOS store
              await loadAllData();
            } finally {
              setDoctorModalVisible(false);
            }
          }}
        />

        <EditEmergencyContactModal
          visible={contactModalVisible}
          onClose={() => setContactModalVisible(false)}
          currentContact={editingContact}
          onSave={() => {
            loadAllData();
          }}
        />

        {/* FULL TABLE for Doctors list */}
        <DoctorsTableModal
          visible={doctorsModalVisible}
           onClose={handleDoctorsModalClose} 
          onChanged={loadAllData}   // refresh parent when any CRUD happens
          doctors={doctors}
        />
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default Sos;

const styles = StyleSheet.create({
  sosBtn: {
    flexDirection: 'row',
    backgroundColor: '#EB2F29',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 350,
    marginBottom: 0,
  },
  sosBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  // COMPACT line (name — specialization…)
  compactLine: {
    color: '#2a3a44',
    fontSize: 15,
  },

  cardBox: {
    backgroundColor: '#cfd6df',
    borderRadius: 20,
    padding: 18,
    marginTop: 0,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0d6cb',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeader: {
    flex: 1,
    color: '#6b6b6b',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCell: {
    flex: 1,
    color: '#6b6b6b',
    fontSize: 16,
    textAlign: 'left',
  },
  actionCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#22577A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detailsContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#22577A',
    marginRight: 6,
  },
  detailValue: {
    color: '#444',
    marginRight: 10,
  },
  bloodGroup: {
    backgroundColor: '#D7F9F1',
    color: '#22577A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#E9E7E1',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  titleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#22577A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontWeight: 'bold',
    color: '#22577A',
    fontSize: 16,
  },
  listItemSubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  listItemDetail: {
    color: '#444',
    fontSize: 12,
    marginTop: 1,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#22577A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#22577A',
    fontWeight: 'bold',
  },
  primaryDoctorCard: {
    backgroundColor: '#FFF8DC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  primaryDoctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  primaryDoctorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginLeft: 4,
  },
  primaryDoctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22577A',
    marginBottom: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22577A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

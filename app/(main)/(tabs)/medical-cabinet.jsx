"use client"

import { ScrollView, StyleSheet, Text, View, Switch, TouchableOpacity, Alert } from "react-native"
import { useTheme } from "../../theme/ThemeContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import MedicalModal from "../../components/MedicalModal"
import MedicationDetailsModal from "../../components/MedicationDetailsModal"
import AddMedicineModal from "../../components/AddMedicineModal"
import CustomAlert from "../../components/CustomAlert"
import { useNavigation } from "@react-navigation/native"
import Icon from "react-native-vector-icons/Feather"
import AnimatedBackground from "../../components/AnimatedBackground"
import Header from "../../components/Header"
import { firestore } from "../../config/firebase"
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { setDoc, getDoc } from "firebase/firestore"
import {
  schedulePushNotification,
  cancelScheduledNotification,
  cancelAllNotifications,
  registerForPushNotificationsAsync,
} from "../../utils/notificationUtils"

const profileImg = require("../../../assets/user.webp")

const MedicalCabinet = () => {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const [modalVisible, setModalVisible] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [addMedicineModalVisible, setAddMedicineModalVisible] = useState(false)
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "info" })
  const [loadingPreferences, setLoadingPreferences] = useState(true)

  const auth = getAuth()
  const user = auth.currentUser

  useEffect(() => {
    registerForPushNotificationsAsync()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchPreferences = async () => {
      try {
        const userPrefsRef = doc(firestore, "userPreferences", user.uid)
        const docSnap = await getDoc(userPrefsRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setNotificationsEnabled(data.medicationNotifications || false)
        }
        setLoadingPreferences(false)
      } catch (error) {
        console.error("Error fetching preferences:", error)
        setLoadingPreferences(false)
      }
    }

    fetchPreferences()
  }, [user])

  // Save notification preference to Firebase
  const saveNotificationPreference = async (value) => {
    if (!user) {
      console.log("No user found, cannot save preferences")
      return false
    }

    try {
      const userPrefsRef = doc(firestore, "userPreferences", user.uid)
      await setDoc(
        userPrefsRef,
        {
          medicationNotifications: value,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      console.log("Notification preference saved successfully")
      return true
    } catch (error) {
      console.error("Error saving preference:", error)
      return false
    }
  }

  const scheduleAllNotifications = async () => {
    if (!notificationsEnabled) return

    for (const med of medicines) {
      if (med.timeToTake) {
        await scheduleNotificationForMedicine(med)
      }
    }
  }

  const handleNotificationToggle = async (value) => {
    try {
      // First update the UI state optimistically
      setNotificationsEnabled(value)

      // Then attempt to save the preference
      const saveSuccess = await saveNotificationPreference(value)

      if (!saveSuccess) {
        // If save failed, revert the UI state
        setNotificationsEnabled(!value)
        throw new Error("Failed to save preference")
      }

      // Handle notifications based on the new state
      if (value) {
        // If enabling, schedule all notifications
        await scheduleAllNotifications()
        showSuccessAlert("Notifications enabled!")
      } else {
        // If disabling, cancel all notifications
        await cancelAllNotifications()
        showSuccessAlert("Notifications disabled")
      }
    } catch (error) {
      console.error("Error toggling notifications:", error)
      showErrorAlert("Failed to update notification settings")
    }
  }

  const scheduleNotificationForMedicine = async (medicine) => {
    if (!notificationsEnabled || !medicine.timeToTake) {
      console.log(`❌ Not scheduling: notifications disabled or no time for ${medicine.name}`)
      return null
    }

    try {
      // Cancel existing notification first
      if (medicine.notificationId) {
        await cancelScheduledNotification(medicine.notificationId)
      }
      
      console.log(`🕒 Scheduling notification for ${medicine.name} at ${medicine.timeToTake}`)
      const notificationId = await schedulePushNotification(medicine)
      
      // Update medicine with notification ID in Firebase
      if (notificationId) {
        try {
          const medicineRef = doc(firestore, "medicines", medicine.id)
          await updateDoc(medicineRef, {
            notificationId: notificationId,
            lastScheduled: new Date().toISOString()
          })
        } catch (updateError) {
          console.error("Error updating notification ID:", updateError)
        }
      }
      
      console.log(`✅ Scheduled notification for ${medicine.name}, ID: ${notificationId}`)
      return notificationId
    } catch (error) {
      console.error(`❌ Error scheduling notification for ${medicine.name}:`, error)
      throw error
    }
  }

  // Helper function to show alerts
  const showAlert = (title, message, type = "info") => {
    setAlert({ visible: true, title, message, type })
  }

  const hideAlert = () => {
    setAlert({ visible: false, title: "", message: "", type: "info" })
  }

  // Success alert
  const showSuccessAlert = (message) => {
    showAlert("Success!", message, "success")
  }

  // Error alert
  const showErrorAlert = (message) => {
    showAlert("Error!", message, "error")
  }

  // Warning alert
  const showWarningAlert = (message) => {
    showAlert("Warning!", message, "warning")
  }

  // Fetch medicines from Firebase
  useEffect(() => {
    console.log("🔍 useEffect triggered, user:", user ? user.uid : "no user")

    if (!user) {
      console.log("❌ No user found, setting empty medicines")
      setMedicines([])
      setLoading(false)
      return
    }

    console.log("✅ User found, setting up Firebase listener for user:", user.uid)

    const unsubscribe = onSnapshot(
      query(collection(firestore, "medicines"), where("userId", "==", user.uid)),
      async (snapshot) => {
        console.log("📦 Firebase snapshot received, docs count:", snapshot.docs.length)
        const medicinesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("📋 Medicine data:", { id: doc.id, ...data })
          return {
            id: doc.id,
            ...data,
          }
        })
        console.log("💊 Final medicines array:", medicinesData)
        setMedicines(medicinesData)
        setLoading(false)
      },
      (error) => {
        console.error("❌ Error fetching medicines:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  const scheduleNotificationsForAllMedicines = async () => {
    if (!notificationsEnabled) {
      showWarningAlert("Please enable notifications first")
      return
    }

    try {
      let scheduledCount = 0;
      let failedCount = 0;
      
      for (const med of medicines) {
        if (med.timeToTake) {
          try {
            await scheduleNotificationForMedicine(med);
            scheduledCount++;
          } catch (error) {
            console.error(`Failed to schedule ${med.name}:`, error)
            failedCount++;
          }
        }
      }
      
      if (scheduledCount > 0) {
        showSuccessAlert(`Scheduled notifications for ${scheduledCount} medicines${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
      } else if (failedCount > 0) {
        showErrorAlert(`Failed to schedule notifications for ${failedCount} medicines`);
      } else {
        showWarningAlert("No medicines with scheduled times found");
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
      showErrorAlert("Failed to schedule notifications");
    }
  }

  const openModal = () => {
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
  }

  const openAddMedicineModal = () => {
    setEditingMedicine(null)
    setAddMedicineModalVisible(true)
  }

  const closeAddMedicineModal = () => {
    setAddMedicineModalVisible(false)
    setEditingMedicine(null)
  }

  const handleMedicineAdded = (newMedicine) => {
    console.log("Medicine added/updated successfully")
    // Auto-schedule notification for new medicine if notifications are enabled
    if (notificationsEnabled && newMedicine && newMedicine.timeToTake) {
      setTimeout(async () => {
        try {
          await scheduleNotificationForMedicine(newMedicine)
          console.log("✅ Auto-scheduled notification for new medicine")
        } catch (error) {
          console.error("❌ Failed to auto-schedule notification:", error)
        }
      }, 1000)
    }
  }

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine)
    setAddMedicineModalVisible(true)
    setDetailsModalVisible(false)
  }

  const handleDeleteMedicine = async (medicineId, medicineName) => {
    Alert.alert("Delete Medicine", `Are you sure you want to delete ${medicineName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Cancel notification first
            await cancelScheduledNotification(medicineId)
            // Then delete medicine
            await deleteDoc(doc(firestore, "medicines", medicineId))
            showSuccessAlert("Medicine deleted successfully!")
          } catch (error) {
            console.error("Error deleting medicine:", error)
            showErrorAlert("Failed to delete medicine. Please try again.")
          }
        },
      },
    ])
  }

  // Add Schedule Notifications Button to UI
  const renderScheduleButton = () => {
    if (medicines.length === 0 || !notificationsEnabled) return null
    
    const medicinesWithTime = medicines.filter(med => med.timeToTake).length
    
    return (
      <TouchableOpacity 
        style={[styles.addMedicineButton, styles.scheduleButton]} 
        onPress={scheduleNotificationsForAllMedicines}
      >
        <Icon name="bell" size={24} color="#fff" />
        <Text style={styles.addMedicineText}>
          Schedule Notifications ({medicinesWithTime})
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header profileImage={profileImg} greeting="Hello Scott" location="SC, 702 USA" sos={true} medical={true} />

          <Text style={styles.pageTitle}>Medicine Cabinet</Text>

          {/* Enable Notifications */}
          <View style={styles.notificationRow}>
            <Text style={styles.enableNotifText}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              thumbColor={notificationsEnabled ? "#6B705B" : "#ccc"}
              trackColor={{ false: "#ccc", true: "#A3A380" }}
              disabled={loadingPreferences}
            />
          </View>

          {/* Add Medicine Button */}
          <View style={styles.addMedicineContainer}>
            <TouchableOpacity style={styles.addMedicineButton} onPress={openAddMedicineModal}>
              <Icon name="plus" size={24} color="#fff" />
              <Text style={styles.addMedicineText}>Add Medicine</Text>
            </TouchableOpacity>
            
            {/* Schedule Notifications Button */}
            {/* {renderScheduleButton()} */}
          </View>

          {/* Medication List Section */}
          <View style={{ paddingHorizontal: 18 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Medication List</Text>
              <Text style={styles.medicationCount}>({medicines.length})</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading medicines...</Text>
              </View>
            ) : medicines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="package" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No medicines added yet</Text>
                <Text style={styles.emptySubText}>Tap "Add Medicine" to get started</Text>
              </View>
            ) : (
              <View style={styles.medListTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.tableHeader}>Name</Text>
                  <Text style={styles.tableHeader}>Dosage</Text>
                  <Text style={styles.tableHeader}>Time</Text>
                </View>
                {medicines.map((med, idx) => (
                  <TouchableOpacity
                    style={styles.tableRow}
                    key={med.id}
                    onPress={() => {
                      setSelectedMedication(med)
                      setDetailsModalVisible(true)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tableCell}>{med.name}</Text>
                    <Text style={styles.tableCell}>{med.dosage}</Text>
                    <Text style={styles.tableCell}>{med.timeToTake || "Not set"}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Modals */}
        <MedicationDetailsModal
          visible={detailsModalVisible}
          medication={selectedMedication}
          onClose={() => setDetailsModalVisible(false)}
          onEdit={handleEditMedicine}
          onDelete={(medicineId) => handleDeleteMedicine(medicineId, selectedMedication?.name)}
        />

        <AddMedicineModal
          visible={addMedicineModalVisible}
          onClose={closeAddMedicineModal}
          onMedicineAdded={handleMedicineAdded}
          editingMedicine={editingMedicine}
          showSuccessAlert={showSuccessAlert}
          showErrorAlert={showErrorAlert}
          notificationsEnabled={notificationsEnabled}
          scheduleNotificationForMedicine={scheduleNotificationForMedicine}
        />

        <MedicalModal visible={modalVisible} onClose={closeModal} />

        {/* Custom Alert */}
        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
          autoClose={true}
          autoCloseTime={3000}
        />
      </SafeAreaView>
    </AnimatedBackground>
  )
}

export default MedicalCabinet

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    marginBottom: 50,
  },
  profileWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  menuBtn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#F3EFE6",
    zIndex: 9999999999,
  },
  menuIconBox: { flex: 1, alignItems: "flex-start" },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#EFEDE7",
    borderRadius: 12,
    opacity: 0.7,
  },
  profileImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#fff",
    marginTop: 10,
  },
  sosBox: { flex: 1, alignItems: "flex-end" },
  sosButton: {
    backgroundColor: "#E63946",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginRight: 2,
    marginTop: 2,
  },
  sosText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  helloText: {
    textAlign: "center",
    fontSize: 44,
    color: "#495057",
    fontWeight: "400",
    marginTop: 10,
    letterSpacing: 1,
  },
  locationText: {
    textAlign: "center",
    color: "#6B705B",
    fontSize: 16,
    marginBottom: 18,
    opacity: 0.7,
  },
  pageTitle: {
    textAlign: "center",
    fontSize: 32,
    color: "#6B705B",
    fontWeight: "400",
    marginBottom: 18,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
  },
  enableNotifText: {
    color: "#24507A",
    fontSize: 18,
    fontWeight: "500",
    marginRight: 10,
  },
  addMedicineContainer: {
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  addMedicineButton: {
    backgroundColor: "#6B705B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    gap: 10,
    marginBottom: 10,
  },
  scheduleButton: {
    backgroundColor: "#24507A",
  },
  addMedicineText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeader: {
    color: "#24507A",
    fontSize: 32,
    fontWeight: "600",
  },
  medicationCount: {
    color: "#6B705B",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: "#6B705B",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#E9E9E0",
    borderRadius: 24,
    marginHorizontal: 2,
  },
  emptyText: {
    color: "#6B705B",
    fontSize: 18,
    fontWeight: "500",
    marginTop: 10,
  },
  emptySubText: {
    color: "#6B705B",
    fontSize: 14,
    opacity: 0.7,
    marginTop: 5,
  },
  medListTable: {
    backgroundColor: "#E9E9E0",
    borderRadius: 24,
    padding: 10,
    marginHorizontal: 2,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#E5DED6",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeader: {
    flex: 1,
    color: "#6B705B",
    fontWeight: "600",
    fontSize: 18,
    textAlign: "left",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D6D6CE",
  },
  tableCell: {
    flex: 1,
    color: "#495057",
    fontSize: 16,
    textAlign: "left",
  },
})
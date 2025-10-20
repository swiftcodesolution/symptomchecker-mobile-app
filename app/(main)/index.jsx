// screens/Dashboard.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedBackground from '../components/AnimatedBackground';
import Header from '../components/Header';
import ShareDetailsModal from '../components/ShareDetailsModal';

// 🔹 import SOS doctor getter (single-doc per user) + full list fallback
import { getSosDoctor, getDoctorDetails, getPrimaryDoctor } from '../services/firebaseService';

const profileImg = require('../../assets/user.webp'); // Placeholder image

const tiles = [
  { label: 'Symptom\nChecker', icon: require('../../assets/menu-icons/card1.png'), route: '/(main)/(tabs)' },
  { label: 'Medical\nWallet', icon: require('../../assets/card2.png'), route: '/(main)/(tabs)/medical-wallet' },
  { label: 'Medicine\nCabinet', icon: require('../../assets/card3.png'), route: '/(main)/(tabs)/medical-cabinet' },
  { label: 'Medical\nLibrary', icon: require('../../assets/card4.png'), route: '/(main)/(tabs)/medical-library' },
  { label: 'Medical\nHistory', icon: require('../../assets/card5.png'), route: '/(main)/medical-history' },
  { label: 'Share\nYour Details', icon: require('../../assets/qr.png'), isShareDetails: true },
  { label: 'Call\nYour\nDoctor', route: '/sos', isDoctor: true }, // special onPress
  { label: 'SOS\nEmergency', route: '/sos', isSOS: true },
];

// Helper to chunk tiles into rows of 2
const chunkTiles = (arr, size) => {
  const res = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
};

// sanitize phone to digits & leading +
const sanitizePhone = (input) => {
  if (!input) return '';
  const trimmed = String(input).trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/[^\d]/g, '');
  return plus + digits;
};

const Dashboard = () => {
  const router = useRouter();
  const tileRows = chunkTiles(tiles, 2);

  // Keep the selected/primary doctor in state (SOS single-doc first, else first doctors-list row)
  const [primaryDoctor, setPrimaryDoctor] = useState(null);
  
  // Modal state for Share Details
  const [showShareModal, setShowShareModal] = useState(false);

  const loadPrimaryDoctor = useCallback(async () => {
    try {
      console.log('Loading primary doctor data...');
      // 1) Try SOS single-doc first
      const sosDoc = await getSosDoctor();
      console.log('SOS Doctor data:', sosDoc);
      if (sosDoc && (sosDoc.phoneNo || sosDoc.doctorName)) {
        console.log('Using SOS doctor as primary:', sosDoc);
        setPrimaryDoctor(sosDoc);
        return;
      }
      // 2) Fallback to the primary doctor from the doctors list
      const primaryDoc = await getPrimaryDoctor();
      console.log('Primary doctor from doctors list:', primaryDoc);
      if (primaryDoc) {
        console.log('Using primary doctor from doctors list:', primaryDoc);
        setPrimaryDoctor(primaryDoc);
        return;
      }
      // 3) Last fallback - first doctor from the list
      const list = await getDoctorDetails();
      console.log('Doctor list:', list);
      const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
      console.log('Using first doctor from list as fallback:', first);
      setPrimaryDoctor(first || null);
    } catch (e) {
      console.warn('Failed to load primary doctor:', e);
      setPrimaryDoctor(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPrimaryDoctor();
  }, [loadPrimaryDoctor]);

  // Refresh when the screen gains focus (e.g., after editing on SOS screen)
  useFocusEffect(
    useCallback(() => {
      console.log('Index screen focused - reloading primary doctor data');
      loadPrimaryDoctor();
    }, [loadPrimaryDoctor])
  );

  // Also reload when component mounts
  useEffect(() => {
    console.log('Index screen mounted - loading primary doctor data');
    loadPrimaryDoctor();
  }, [loadPrimaryDoctor]);

  const handleCallDoctor = () => {
    console.log('Current primary doctor:', primaryDoctor);
    if (primaryDoctor && primaryDoctor.phoneNo) {
      // Call the primary doctor's number
      const phoneNumber = sanitizePhone(primaryDoctor.phoneNo);
      console.log('Calling doctor number:', phoneNumber);
      if (phoneNumber) {
        Linking.openURL(`tel:${phoneNumber}`);
      } else {
        Alert.alert('No Phone Number', 'Primary doctor phone number is not available. Calling emergency services instead.', [
          { text: 'Call 911', onPress: () => Linking.openURL('tel:911') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
    } else {
      // Fallback to 911 if no primary doctor or phone number
      Alert.alert('No Doctor Available', 'No primary doctor found. Calling emergency services instead.', [
        { text: 'Call 911', onPress: () => Linking.openURL('tel:911') },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  // Manual refresh function (you can call this if needed)
  const refreshDoctorData = () => {
    console.log('Manually refreshing doctor data...');
    loadPrimaryDoctor();
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Header
            profileImage={profileImg}
            greeting="Hello Scott"
            location="SC, 702 USA"
            sos={false}
          />
          <View style={styles.tilesGrid}>
            {tileRows.map((row, rowIdx) => (
              <View style={styles.tileRow} key={rowIdx}>
                {row.map((tile) => {
                  // SOS tile: long rectangle → go to /sos
                  if (tile.isSOS) {
                    return (
                      <TouchableOpacity
                        key={tile.label}
                        style={[styles.tile, styles.sosTile, styles.sosTileLong]}
                        onPress={() => router.push(tile.route)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.tileLabel, styles.sosLabel]}>
                          SOS{'\n'}Emergency
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  // Share Your Details tile: open modal
                  if (tile.isShareDetails) {
                    return (
                      <TouchableOpacity
                        key={tile.label}
                        style={styles.tile}
                        onPress={() => setShowShareModal(true)}
                        activeOpacity={0.8}
                      >
                        <Image source={tile.icon} style={styles.tileIcon} />
                        <Text style={styles.tileLabel}>{tile.label}</Text>
                      </TouchableOpacity>
                    );
                  }

                  // Call Your Doctor tile: dial if exists, else alert
                  if (tile.isDoctor) {
                    return (
                      <TouchableOpacity
                        key={tile.label}
                        style={[styles.tile, styles.sosTile]}
                        onPress={handleCallDoctor}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.tileLabel, styles.sosLabel]}>
                          Call{'\n'}Your{'\n'}Doctor
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  // default tiles
                  return (
                    <TouchableOpacity
                      key={tile.label}
                      style={styles.tile}
                      onPress={() => router.push(tile.route)}
                      activeOpacity={0.8}
                    >
                      <Image source={tile.icon} style={styles.tileIcon} />
                      <Text style={styles.tileLabel}>{tile.label}</Text>
                    </TouchableOpacity>
                  );
                })}
                {/* If last row has only 1 tile, keep grid aligned (except when that tile is SOS) */}
                {row.length === 1 && !row[0].isSOS && (
                  <View style={[styles.tile, { backgroundColor: 'transparent', elevation: 0 }]} />
                )}
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Share Details Modal */}
        <ShareDetailsModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  tilesGrid: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  tileRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 18,
  },
  tile: {
    flex: 1,
    maxWidth: 180,
    height: 140,
    backgroundColor: '#e3ded3',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tileIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  tileLabel: {
    fontSize: 22,
    color: '#222',
    textAlign: 'center',
    fontWeight: '400',
  },
  sosTile: {
    backgroundColor: '#c62828',
  },
  sosTileLong: {
    maxWidth: 380, // wider
    height: 140, // thinner
  },
  sosLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 26,
    textAlign: 'center',
    minWidth: 60,
  },
});

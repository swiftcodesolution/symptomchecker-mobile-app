import React, {useEffect} from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectProfileImage, loadProfileImage } from '../redux/slices/userProfileSlice';

const defaultProfileImg = require("../../assets/user.webp");

const Header = ({ greeting, location, sos = false, medical = false }) => {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = getAuth();
  const user = auth.currentUser;

  const profileImage = useSelector(selectProfileImage);

  useEffect(() => {
    dispatch(loadProfileImage());
  }, [dispatch]);

  const handleGoBack = () => {
    navigation.goBack()
  }

  return (
    <>
      {/* Header row with menu button and profile image */}
      <View style={styles.headerRow}>
        {medical ? (
          <TouchableOpacity style={styles.menuBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#4d5a5a" />
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'center', flexDirection: 'column' }}>
            <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <View style={styles.hamburger}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </View>
            </TouchableOpacity>
            <Text style={styles.menuLabel}>Menu</Text>
          </View>
        )}
        <View style={styles.profileImgWrapper}>
          <Image 
            source={profileImage ? { uri: profileImage } : defaultProfileImg} 
            style={styles.profileImg}
            key={profileImage} // Force re-render when profile image changes
          />
        </View>
        {sos ? (
          <TouchableOpacity style={styles.sosBtn} onPress={() => router.push('/sos')}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {/* Profile info */}
      <View style={styles.profileContainer}>
        <Text style={styles.greeting}>Hello {user?.displayName || ''}</Text>
        {/* <Text style={styles.location}>{location}</Text> */}
      </View>
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  menuBtn: {
    backgroundColor: '#f3efe6',
    borderRadius: 12,
    padding: 10,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 24,
  },
  menuLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#4d5a5a',
    textAlign: 'center',
    marginLeft: 20,
  },
  hamburger: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 18,
    height: 3,
    backgroundColor: '#888',
    marginVertical: 2,
    borderRadius: 2,
  },
  profileImgWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  profileImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: 0,
    marginBottom: 10,
  },
  sosBtn: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
    minWidth: 48,
  },
  sosText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'center',
    minWidth: 30,
  },
  profileContainer: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 44,
    fontWeight: '400',
    color: '#42505c',
    textAlign: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#6c7a89',
    textAlign: 'center',
    marginBottom: 24,
  },
}); 
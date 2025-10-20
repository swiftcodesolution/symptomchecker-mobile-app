import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TitleText from "./TitleText";
import { useTheme } from "../theme/ThemeContext";
import Header from "./Header";
import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import { selectProfileImage, loadProfileImage } from "../redux/slices/userProfileSlice";

const defaultProfileImg = require("../../assets/user.webp");

const CustomDrawer = (props) => {
  const dispatch = useDispatch();
  const auth = getAuth();
  const user = auth.currentUser;
  const profileImage = useSelector(selectProfileImage);
  const { theme } = useTheme();

  const handlePress = () => {
    console.log(`btn pressed!`);
  };

  useEffect(() => {
    dispatch(loadProfileImage());
  }, [dispatch]);

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawer}
      contentContainerStyle={styles.drawerInner}
    >
      <View style={styles.userInfo}>
        <Image
          source={profileImage ? { uri: profileImage } : defaultProfileImg}
          style={styles.profilePic}
          key={profileImage} // Force re-render when profile image changes
        />
        <TitleText
          title={`Hello ${user?.displayName || 'User'}`}
          style={[styles.userName, { color: theme.btnText }]}
        />


        <TouchableOpacity
          style={styles.sosBtn}
          onPress={() => {
            router.push("sos");
          }}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>
      

      <View style={styles.menuList}>
        <DrawerItem
          label="Home"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/home.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          focused={true}
          onPress={() => {
            console.log("Navigating to home...");
            props.navigation.navigate("index");
          }}
          style={[styles.menuItem, { backgroundColor: 'transparent' }]}
          labelStyle={[styles.menuItemName, { color: theme.primary }]}
        />
        <DrawerItem
          label="Symptom Checker"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/card1.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          focused={true}
          onPress={() => {
            router.push("(main)/(tabs)");
          }}
          style={[styles.menuItem, { backgroundColor: 'transparent' }]}
          labelStyle={[styles.menuItemName, { color: theme.primary }]}
        />
        <DrawerItem
          label="Medical Wallet"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/medical-wallet.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={() => {
            router.push("(main)/(tabs)/medical-wallet");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
        <DrawerItem
          label="Medicine Cabinet"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/medical-cabinet.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={() => {
            router.push("(main)/(tabs)/medical-cabinet");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
        <DrawerItem
          label="Medical Library"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/medical-library.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={() => {
            router.push("(main)/(tabs)/medical-library");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
        <DrawerItem
          label="Medical History"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/medical-history.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={() => {
            router.push("(main)/medical-history");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
        <DrawerItem
          label="Chat History"
          icon={({ size, tintColor }) => (
            <Ionicons name="time-outline" size={size} color={theme.primary} />
          )}
          onPress={() => {
            router.push("(main)/search-history");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
        {/* <DrawerItem
          label="Subscription"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/subscription.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={() => {
            router.push("(main)/subscription");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        /> */}
        <DrawerItem
          label="Settings"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/settings.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={() => {
            router.push("(main)/settings");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
        <DrawerItem
          label="Help"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/help.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={() => {
            router.push("(main)/help");
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
        <DrawerItem
          label="Logout"
          icon={({ size, tintColor }) => (
            <Image
              source={require("../../assets/menu-icons/logout.png")}
              style={[
                styles.menuIcon,
                { tintColor: theme.primary, size: size },
              ]}
            />
          )}
          onPress={async () => {
            try {
              // Preserve important data before clearing AsyncStorage
              const keysToPreserve = [
                'biometricEmail',
                'biometricPassword',
                'biometricEnabled',
                'onboarding'
              ];
              const preserved = await AsyncStorage.multiGet(keysToPreserve);

              await AsyncStorage.clear();

              // Restore preserved keys if they existed
              const toRestore = preserved.filter(([key, value]) => value !== null);
              if (toRestore.length > 0) {
                await AsyncStorage.multiSet(toRestore);
              }

              // Close the drawer first
              props.navigation.closeDrawer();

              await AsyncStorage.removeItem('personalInfo');
              // Wait a short moment before navigating
              setTimeout(() => {
                router.replace("/auth/login");
              }, 300);
            } catch (error) {
              console.error('Logout error:', error);
              props.navigation.closeDrawer();
              setTimeout(() => {
                router.replace("/auth/login");
              }, 300);
            }
          }}
          style={styles.menuItem}
          labelStyle={styles.menuItemName}
        />
      </View>
    </DrawerContentScrollView>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  drawer: { flex: 1 },
  drawerInner: { justifyContent: "space-between" },

  userInfo: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 40,
  },

  profilePic: {
    width: 90,
    height: 90,
    objectFit: "cover",
    borderRadius: 100,
    boxShadow: "0 10px 20px 6px rgba(0,0,0,0.3)",
  },
  userName: { textAlign: "center" },

  sosBtn: {
    backgroundColor: "#EB2F29",
    padding: 10,
    borderRadius: 10,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: "auto",
  },
  sosText: { 
    color: "#fff", 
    fontSize: 18, 
    textAlign: 'center',
    minWidth: 30,
    fontWeight: 'bold',
  },

  menuList: { gap: 1 },
  menuItem: { gap: 10 },
  menuIcon: { width: 20, height: 20 },
  menuItemName: { textTransform: "capitalize" },
});

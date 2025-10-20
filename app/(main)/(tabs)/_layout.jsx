import { Tabs } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import Icon2 from "react-native-vector-icons/SimpleLineIcons";
import { useTheme } from "../../theme/ThemeContext";
import { Image } from "react-native";

const TabLayout = () => {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#2E2F2D',
        tabBarStyle: {
          backgroundColor: '#6B705B',
          borderTopWidth: 0,
          height: 72,
        },
        tabBarLabelStyle: {
          fontFamily: 'Avenir',
          fontSize: 10,
          letterSpacing: 0.5,
          marginBottom: 4,
          fontWeight: '400',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../../../assets/menu-icons/home.png")}
              style={{ tintColor: color, width: 17, height: 17, marginBottom: 2 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Symptom Checker",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../../../assets/menu-icons/card1.png")}
              style={{ tintColor: color, width: 17, height: 17, marginBottom: 2 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="medical-cabinet"
        options={{
          title: "Medical Cabinet",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../../../assets/menu-icons/medical-cabinet.png")}
              style={{ tintColor: color, width: 17, height: 17, marginBottom: 2 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="medical-wallet"
        options={{
          title: "Medical Wallet",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../../../assets/menu-icons/medical-wallet.png")}
              style={{ tintColor: color, width: 17, height: 17, marginBottom: 2 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="medical-library"
        options={{
          title: "Medical Library",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../../../assets/menu-icons/medical-library.png")}
              style={{ tintColor: color, width: 17, height: 17, marginBottom: 2 }}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;

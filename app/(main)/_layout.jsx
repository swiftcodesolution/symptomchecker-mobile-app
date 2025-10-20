import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import CustomDrawer from "../components/CustomDrawer";

const MainLayout = () => {
  return (
    <GestureHandlerRootView>
      <Drawer
        screenOptions={{ headerShown: false }}
        drawerContent={(props) => <CustomDrawer {...props} />}
      >
        <Drawer.Screen name="index" />
        <Drawer.Screen name="(tabs)" />
        <Drawer.Screen name="medical-history" />
        <Drawer.Screen name="search-history" />
        <Drawer.Screen name="sos" />
        <Drawer.Screen name="emergency-corner" />
        <Drawer.Screen name="mainchat" />
      </Drawer>
    </GestureHandlerRootView>
  );
};

export default MainLayout;

import { StyleSheet, TextInput, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeContext";

const Searchbar = ({ placeholder, style, value, onChangeText }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.searchbar, style]}>
      <Icon name="search" size={24} color={theme.primary || "#465D69"} style={styles.icon} />
      <TextInput 
        placeholder={placeholder || "Search..."}
        placeholderTextColor="#465D69"
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
};

export default Searchbar;

const styles = StyleSheet.create({
  searchbar: {
    backgroundColor: "rgba(107, 112, 91, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    padding: "6%",
    borderRadius: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#465D69",
    marginLeft: 10,
    padding: 0, // Important for Android
  },
  icon: {
    marginRight: 10,
  },
});
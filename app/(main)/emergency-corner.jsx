import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomHeader from "../components/CustomHeader";
import TitleText from "../components/TitleText";
import SubText from "../components/SubText";
import SmallButton from "../components/SmallButton";
import ThreeColumnBox from "../components/ThreeColumnBox";
import PharmacyList from "../components/PharmacyList";
import TipCard from "../components/TipCard";
import { useTheme } from "../theme/ThemeContext";

const EmergencyCorner = () => {
  const { theme } = useTheme();

  const handlePress = () => {
    console.log(`btn pressed!`);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <CustomHeader />

        <View>
          <TitleText title="Emergency Corner" style={styles.pageTitle} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollViewStyles}
        contentContainerStyle={styles.scrollViewStylesInner}
      >
        <View style={styles.section}>
          <View style={styles.titleBox}>
            <SubText
              textContent="Emergency Details"
              style={styles.sectionHeading}
            />
            <SmallButton btnText="Manage" pressFunction={handlePress} />
          </View>
          <ThreeColumnBox />
        </View>

        <View style={styles.section}>
          <View style={styles.titleBox}>
            <SubText
              textContent="Tip of the Day"
              style={styles.sectionHeading}
            />
            <SmallButton btnText="Complete Guide" pressFunction={handlePress} />
          </View>
          <TipCard />
        </View>

        <View style={styles.section}>
          <View style={styles.titleBox}>
            <SubText
              textContent="Nearby Facility"
              style={styles.sectionHeading}
            />
            <SmallButton btnText="See All" pressFunction={handlePress} />
          </View>
          <PharmacyList />
        </View>
      </ScrollView>
    </View>
  );
};

export default EmergencyCorner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  pageTitle: { textAlign: "center", marginTop: 40 },

  scrollViewStylesInner: { gap: 20, paddingBottom: 20 },

  section: {},

  titleBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
});

import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const ProgressDots = ({ totalScreens, activeIndex, style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.progressDotsDiv, style]}>
      {Array.from({ length: totalScreens }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === activeIndex ? styles.active : null,
            {
              backgroundColor:
                index === activeIndex ? theme.primary : theme.secondary,
            },
          ]}
        />
      ))}
    </View>
  );
};

export default ProgressDots;

const styles = StyleSheet.create({
  progressDotsDiv: {
    flexDirection: "row",
    gap: 5,
    alignItems: "flex-start",
  },
  progressDot: {
    width: 20,
    height: 10,
    borderRadius: 10,
  },
  active: { width: 30 },
});

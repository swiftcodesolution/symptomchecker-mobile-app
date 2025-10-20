import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import Button from "./PrimaryButton";
import ProgressDots from "./ProgressDots";

const OnboardingCard = ({
  title,
  text,
  bottomText,
  totalScreens,
  activeIndex,
  handlePressNext,
  handlePressSkip,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.onboardingCard,
        { backgroundColor: theme.onboardingCardBg },
      ]}
    >
      <Text style={[styles.cardTitle, { color: '#174B63' }]}>{title}</Text>
      <Text style={[styles.cardText, { color: '#6B6E6D' }]}>{text}</Text>

      <ProgressDots
        style={styles.progressDots}
        totalScreens={totalScreens}
        activeIndex={activeIndex}
      />

      <View style={styles.btnsDiv}>
        <Button
          title={activeIndex === totalScreens - 1 ? "Finish" : "Next"}
          pressFunction={handlePressNext}
          style={styles.nextBtn}
          textColor="#fff"
        />
        {activeIndex < totalScreens - 1 && (
          <Button
            title="Skip"
            pressFunction={handlePressSkip}
            style={styles.skipBtn}
            textColor="#fff"
          />
        )}
      </View>
      {bottomText && (
        <Text style={styles.bottomText}>{bottomText}</Text>
      )}
    </View>
  );
};

export default OnboardingCard;

const styles = StyleSheet.create({
  onboardingCard: {
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 30,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'left',
  },
  cardText: {
    fontSize: 20,
    marginBottom: 32,
    color: '#6B6E6D',
    textAlign: 'left',
    fontWeight: '400',
  },
  progressDots: { marginBottom: 32, alignSelf: 'flex-start' },
  btnsDiv: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  nextBtn: {
    backgroundColor: '#6B705B',
    borderRadius: 40,
    flex: 1,
    marginRight: 0,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    backgroundColor: '#B6BDC6',
    borderRadius: 40,
    flex: 1,
    marginLeft: 0,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    marginTop: 18,
    color: '#6B6E6D',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
});

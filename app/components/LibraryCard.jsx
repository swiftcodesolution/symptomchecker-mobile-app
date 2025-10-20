import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import Icon from "react-native-vector-icons/Ionicons";

const LibraryCard = ({
  imageUrl,
  text,
  tag,
  date,
  shareLink,
  isAIGenerated = false,
  content,
  onSharePress // Changed from onPress to onSharePress for clarity
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.libraryCard,
        {
          backgroundColor: theme.secondary,
          borderLeftWidth: isAIGenerated ? 4 : 0,
          borderLeftColor: isAIGenerated ? theme.primary : 'transparent'
        }
      ]}
    >
      {/* <Image 
        source={imageUrl} 
        style={styles.image} 
      /> */}

      <View style={styles.details}>
        <Text
          style={[
            styles.text,
            isAIGenerated && { color: theme.primary }
          ]}
          numberOfLines={2}
        >
          {text}
        </Text>

        <View style={styles.metadata}>
          {isAIGenerated && (
            <Text style={[styles.tag, { backgroundColor: theme.primaryLight }]}>
              AI Generated
            </Text>
          )}
          <Text style={[styles.tag, { backgroundColor: '#D8CFC5' }]}>
            {tag}
          </Text>
          <Text style={[styles.date, { color: theme.text }]}>
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>

      <View style={styles.share}>
        <TouchableOpacity onPress={onSharePress}>
          <Text style={styles.shareLink}>{shareLink}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: theme.primary }]}>
          <Icon
            name="share-social-outline"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LibraryCard;

const styles = StyleSheet.create({
  libraryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: 'white'
  },
  image: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 12,
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 12,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    width: "60%",
    fontWeight: '600',
    lineHeight: 22
  },
  metadata: {
    width: "30%",
    alignItems: 'flex-end'
  },
  tag: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    padding: 6,
    borderRadius: 4,
    color: "#000",
    marginBottom: 5,
    width: '100%'
  },
  date: {
    fontSize: 10,
    textAlign: "right",
    fontWeight: "700",
    opacity: 0.7
  },
  share: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shareLink: {
    color: "#077CFF",
    fontSize: 14,
    width: "60%",
    fontWeight: '500'
  },
  shareBtn: {
    padding: 6,
    borderRadius: 6,
    alignSelf: 'flex-end'
  },
});
import { FlatList, StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Alert } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedBackground from "../components/AnimatedBackground";
import { useState, useRef, useEffect } from "react";
import { useNavigation } from '@react-navigation/native';
import Header from "../components/Header";
import { getChatHistoryFromFirebase } from "../utils/firebaseUtils";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";
import { getAuth } from 'firebase/auth';
import { useSelector, useDispatch } from 'react-redux';
import { selectProfileImage, loadProfileImage } from '../redux/slices/userProfileSlice';

const defaultProfileImg = require("../../assets/user.webp");

const HEADER_HEIGHT = 550;

const SearchHistory = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("Recent");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastScrollY = useRef(0);
  const anim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const profileImage = useSelector(selectProfileImage);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    dispatch(loadProfileImage());
  }, [dispatch]);


  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const history = await getChatHistoryFromFirebase();
      setChatSessions(history);
    } catch (error) {
      console.error("Error loading chat history:", error);
      Alert.alert("Error", "Could not load chat history");
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (tab) => setActiveTab(tab);

  const animateHeader = (show) => {
    Animated.timing(anim, {
      toValue: show ? 0 : -HEADER_HEIGHT,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const delta = currentY - lastScrollY.current;

    if (Math.abs(delta) < 10) return;

    if (delta > 0 && isHeaderVisible && currentY > 40) {
      setIsHeaderVisible(false);
      animateHeader(false);
    } else if (delta < 0 && !isHeaderVisible && currentY < 60) {
      setIsHeaderVisible(true);
      animateHeader(true);
    }
    lastScrollY.current = currentY;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown time";

    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreviewText = (messages) => {
    if (!messages || messages.length === 0) return "No messages";

    // Get the last few messages for preview
    const lastMessages = messages.slice(-3);
    return lastMessages.map(msg => {
      const text = msg.message.length > 30
        ? `${msg.message.substring(0, 30)}...`
        : msg.message;
      return `${msg.isUser ? "You" : "AI"}: ${text}`;
    }).join("\n");
  };

  const handleViewConversation = (session) => {
    router.push({
      pathname: '/(main)/(tabs)',
      params: {
        session: JSON.stringify(session),
      }
    });
  };

  const handleGoToSymptomChecker = () => {
    router.push('/(main)/(tabs)');
  };

  const renderSessionItem = ({ item, index }) => (
    <View style={[styles.historyCard, index === 0 && { marginTop: HEADER_HEIGHT }]}>
      <Text style={styles.cardText}>{getPreviewText(item.messages)}</Text>
      <Text style={styles.cardDate}>
        {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
      </Text>

      <TouchableOpacity
        style={styles.viewConversationBtn}
        onPress={() => handleViewConversation(item)}
      >
        <Text style={styles.viewConversationText}>View Full Conversation</Text>
        <Icon name="arrow-right" size={16} color="#6B705B" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="message-square" size={64} color="#C7CBD6" />
      <Text style={styles.emptyStateTitle}>No Chat History Yet</Text>
      <Text style={styles.emptyStateText}>
        Your symptom checker conversations will appear here once you start chatting.
      </Text>
      <TouchableOpacity
        style={styles.goToSymptomCheckerBtn}
        onPress={handleGoToSymptomChecker}
      >
        <Text style={styles.goToSymptomCheckerText}>Go to Symptom Checker</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.contentSection}>
          <Animated.View
            style={[
              styles.animatedContent,
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                marginLeft: "5%",
                transform: [{ translateY: anim }],
                opacity: anim.interpolate({
                  inputRange: [-HEADER_HEIGHT, 0],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Header
              profileImage={profileImage ? { uri: profileImage } : defaultProfileImg}
              greeting={`Hello ${user?.displayName || 'User'}`}
              location="SC, 702 USA"
              sos={true}
              medical={true}
              key={profileImage} // Force re-render when profile image changes
            />
            <Text style={styles.pageTitle}>Symptom checker{"\n"}chat History</Text>

            <View style={styles.searchBarContainer}>
              {/* <View style={[styles.searchBar, { backgroundColor: "#D3D3C3AA" }]}>
                <Icon name="search" size={20} color="#465D69" />
                <Text style={styles.searchPlaceholder}>Search your chat</Text>
              </View> */}
            </View>

            <View style={styles.toggleButtons}>
              <TouchableOpacity
                onPress={() => handlePress("Recent")}
                style={[styles.toggleBtn, activeTab === "Recent" && styles.activeToggleBtn]}
              >
                <Text style={styles.toggleText}>Recent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePress("Last")}
                style={[styles.toggleBtn, activeTab === "Last" && styles.activeToggleBtn]}
              >
                <Text style={styles.toggleText}>Last</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.listWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading chat history...</Text>
              </View>
            ) : chatSessions.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={chatSessions}
                keyExtractor={(item) => item.sessionId}
                renderItem={renderSessionItem}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                style={styles.flatList}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default SearchHistory;

const styles = StyleSheet.create({
  contentSection: {
    paddingHorizontal: 18,
    flex: 1,
  },
  pageTitle: {
    fontSize: 36,
    color: '#4d5a5a',
    textAlign: "center",
    fontWeight: "300",
    marginBottom: 10,
  },
  searchBarContainer: {
    marginBottom: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#465D69',
    fontSize: 16,
  },
  toggleButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 18,
    gap: 10,
    width: "100%"
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: "#C7CBD6",
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: "center",
  },
  activeToggleBtn: {
    backgroundColor: "#7B8263",
  },
  toggleText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "400",
  },
  historyCard: {
    backgroundColor: "#C7CBD6",
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
  },
  cardText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  cardDate: {
    color: "#3B4A5A",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 15,
  },
  viewConversationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
  },
  viewConversationText: {
    color: "#6B705B",
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  listContainer: {
    paddingBottom: 30,
  },
  animatedContent: {
    zIndex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  flatList: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: HEADER_HEIGHT,
  },
  emptyStateTitle: {
    fontSize: 24,
    color: '#4d5a5a',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#465D69',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  goToSymptomCheckerBtn: {
    backgroundColor: "#6B705B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  goToSymptomCheckerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: HEADER_HEIGHT,
  },
  loadingText: {
    fontSize: 18,
    color: '#465D69',
  },
});
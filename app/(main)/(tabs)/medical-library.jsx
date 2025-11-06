"use client"

import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native"
import { useTheme } from "../../theme/ThemeContext"
import { SafeAreaView } from "react-native-safe-area-context"
import TitleText from "../../components/TitleText"
import Searchbar from "../../components/Searchbar"
import LibraryCard from "../../components/LibraryCard"
import AnimatedBackground from "../../components/AnimatedBackground"
import Header from "../../components/Header"
import { useState, useRef, useEffect, useCallback } from "react"
import { getChatHistoryFromFirebase } from "../../utils/firebaseUtils"
import { Ionicons } from "@expo/vector-icons"
import medicalArticles from "../../utils/medicalArticles"
import { useLocalSearchParams } from "expo-router"
import { useFocusEffect } from "@react-navigation/native"

const profileImg = require("../../../assets/user.webp")

const HEADER_HEIGHT = 400

// ---------- Trusted link builder ----------
const buildTrustedLinks = (query) => {
  const q = encodeURIComponent(String(query || "").trim())
  const links = [
    { label: "Mayo Clinic", url: `https://www.mayoclinic.org/search/search-results?q=${q}` },
    { label: "MedlinePlus", url: `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v:project=medlineplus&query=${q}` },
    { label: "NHS (UK)", url: `https://www.nhs.uk/search?query=${q}` },
    { label: "WHO", url: `https://www.who.int/search?indexCatalogue=who&searchQuery=${q}` },
    { label: "CDC", url: `https://search.cdc.gov/search?query=${q}` },
  ]
  return links
}

const ensureArticleLinks = (article, fallbackQuery) => {
  // If article already has a concrete url, pin it as first link
  const pre = []
  if (article?.url) {
    pre.push({ label: "Open article", url: article.url })
  }
  const q = article?.title || fallbackQuery || "health"
  const generated = buildTrustedLinks(q)
  return [...pre, ...generated]
}

/** ---------------- LinkPill: clear, tappable link chip ---------------- */
const LinkPill = ({ label, url, color }) => (
  <TouchableOpacity
    onPress={() => Linking.openURL(url)}
    activeOpacity={0.7}
    accessibilityRole="link"
    accessibilityHint={`Opens ${label} in browser`}
    style={[styles.linkBtn, { borderColor: color + "55", backgroundColor: color + "0F" }]}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
  >
    <Ionicons name="link-outline" size={16} color={color} style={styles.linkIcon} />
    <Text style={[styles.linkBtnText, { color, textDecorationLine: "underline" }]} numberOfLines={1}>
      {label}
    </Text>
    <Ionicons name="open-outline" size={14} color={color} style={styles.linkOpenIcon} />
  </TouchableOpacity>
)

const MedicalLibrary = () => {
  const { theme } = useTheme()
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [conversationSessions, setConversationSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [focusedArticle, setFocusedArticle] = useState(null)
  const [showArticleModal, setShowArticleModal] = useState(false)
  const lastScrollY = useRef(0)
  const anim = useRef(new Animated.Value(0)).current
  const params = useLocalSearchParams()

  useEffect(() => {
    if (params?.focusedArticle) {
      if (typeof params.focusedArticle === "string") {
        const found = Object.values(medicalArticles)
          .flat()
          .find((a) => a.title === params.focusedArticle)
        if (found) {
          // Attach links for modal
          setFocusedArticle({ ...found, links: ensureArticleLinks(found, found.title) })
          setShowArticleModal(true)
        }
      } else {
        const art = params.focusedArticle
        setFocusedArticle({ ...art, links: ensureArticleLinks(art, art?.title) })
        setShowArticleModal(true)
      }
    }

    if (params?.searchQuery) {
      setSearchQuery(params.searchQuery)
    }
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const sessions = await getChatHistoryFromFirebase()

      if (!sessions || sessions.length === 0) {
        setError("No conversation history found.")
        setConversationSessions([])
        return
      }

      const formattedSessions = sessions.map((session) => {
        const sessionDate = session.timestamp?.toDate ? session.timestamp.toDate() : new Date(session.timestamp)

        const fullConversation = session.messages.map((msg) => msg.message).join(" ")

        const userMessages = session.messages.filter((msg) => msg.isUser)
        const conversationTitle =
          userMessages.length > 0
            ? `Symptom Check: ${userMessages[0].message.substring(0, 50)}${userMessages[0].message.length > 50 ? "..." : ""}`
            : "Symptom Check Conversation"

        // Find recommended articles and ATTACH trusted links
        const recommended = findRelevantArticles(fullConversation).map((a) => ({
          ...a,
          links: ensureArticleLinks(a, a.title || conversationTitle),
        }))

        return {
          id: session.sessionId,
          title: conversationTitle,
          date: `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}-${String(
            sessionDate.getDate()
          ).padStart(2, "0")}`,
          time: sessionDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullDate: sessionDate,
          messages: session.messages.sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)
            return dateA - dateB
          }),
          articles: recommended,
          tag: "Symptom Check",
          shareLink: "View Conversation",
        }
      })

      const dates = [...new Set(formattedSessions.map((session) => session.date))].sort().reverse()
      setAvailableDates(dates)

      setConversationSessions(formattedSessions)
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setError("Failed to load conversation history.")
      setConversationSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh conversations every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchConversations()
    }, [fetchConversations])
  )

  const findRelevantArticles = (conversationText) => {
    const text = (conversationText || "").toLowerCase()
    const articles = []

    Object.keys(medicalArticles).forEach((symptom) => {
      if (text.includes(symptom)) {
        articles.push(...medicalArticles[symptom])
      }
    })

    if (articles.length === 0) {
      const fallback = [
        {
          title: "General Health Guidelines",
          content: `# General Health Guidelines

Maintaining good health involves several key practices:

## Daily Health Habits:
- Balanced nutrition with plenty of fruits and vegetables
- Regular physical activity (30 minutes most days)
- Adequate hydration (8 glasses of water daily)
- 7-9 hours of quality sleep per night
- Stress management techniques

## Preventive Care:
- Regular health check-ups based on age and risk factors
- Recommended vaccinations and screenings
- Dental hygiene and regular dental check-ups
- Skin protection from sun exposure

## When to Seek Medical Advice:
- Persistent symptoms lasting more than a week
- Sudden severe symptoms
- Symptoms that interfere with daily activities
- Concerns about new or changing health issues

Your primary care provider is your best resource for personalized health advice.`,
          category: "General Health",
        },
        {
          title: "When to Consult a Healthcare Provider",
          content: `# When to Consult a Healthcare Provider

## Schedule an Appointment For:
- Symptoms that persist beyond a week
- Recurring health issues
- Changes in existing conditions
- Routine preventive care and screenings
- Medication management and refills

## Seek Urgent Care For:
- Non-life-threatening illnesses or injuries
- Sprains, strains, or minor fractures
- Mild to moderate asthma attacks
- Ear infections, sore throat, or UTIs
- Minor cuts requiring stitches

## Go to the Emergency Room For:
- Chest pain or difficulty breathing
- Severe abdominal pain
- Sudden weakness or numbness
- Head injury with confusion
- Severe burns or deep wounds
- Poisoning or overdose
- Suicidal or homicidal thoughts

Knowing where to seek appropriate care can save time and resources.`,
          category: "General Health",
        },
      ]
      // Attach links here too
      return fallback.map((a) => ({ ...a, links: ensureArticleLinks(a, a.title) }))
    }

    const uniqueArticles = articles
      .filter((article, index, self) => index === self.findIndex((a) => a.title === article.title))
      .slice(0, 5)

    // Attach trusted links
    return uniqueArticles.map((a) => ({ ...a, links: ensureArticleLinks(a, a.title) }))
  }

  const filteredConversations = conversationSessions.filter((session) => {
    const matchesDate = !selectedDate || session.date === selectedDate
    const matchesSearch =
      !searchQuery ||
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.messages.some((msg) => msg.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.tag.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesDate && matchesSearch
  })

  const handleViewConversation = (conversation) => {
    // ensure links exist on articles before opening modal (defensive)
    const withLinks = {
      ...conversation,
      articles: (conversation.articles || []).map((a) => ({ ...a, links: ensureArticleLinks(a, a.title) })),
    }
    setSelectedConversation(withLinks)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedConversation(null)
  }

  const openArticle = (article) => {
    setFocusedArticle({ ...article, links: ensureArticleLinks(article, article?.title) })
    setShowArticleModal(true)
  }

  /** --------- UPDATED: uses LinkPill with heading "External Blog Articles" ---------- */
  const renderLinkButtons = (linksArr, heading = "External Blog Articles") => {
    if (!Array.isArray(linksArr) || linksArr.length === 0) return null
    return (
      <View style={styles.linksBlock} accessible accessibilityRole="header">
        <Text style={[styles.linksHeader, { color: theme.text }]}>{heading}</Text>
        <View style={styles.linksRow}>
          {linksArr.slice(0, 5).map((lnk, idx) => (
            <LinkPill key={`${lnk.label}-${idx}`} label={lnk.label} url={lnk.url} color={theme.primary} />
          ))}
        </View>
      </View>
    )
  }

  const renderArticleModal = () => {
    if (!focusedArticle) return null
    const article = focusedArticle

    return (
      <Modal visible={showArticleModal} animationType="slide" transparent={true}>
        <View style={[styles.articleModalContainer, { backgroundColor: "white" }]}>
          <View style={[styles.articleModalContent, { backgroundColor: "white" }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowArticleModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <ScrollView>
              <Text style={[styles.articleModalTitle, { color: theme.text }]}>{article.title}</Text>
              <Text style={[styles.articleModalCategory, { color: theme.textSecondary }]}>{article.category}</Text>
              {renderLinkButtons(article.links)}
              <Text style={[styles.articleModalContentText, { color: theme.text }]}>{article.content}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  const animateHeader = (show) => {
    Animated.timing(anim, {
      toValue: show ? 0 : -HEADER_HEIGHT,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }

  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y
    const delta = currentY - lastScrollY.current
    if (Math.abs(delta) < 10) return
    if (delta > 0 && isHeaderVisible && currentY > 40) {
      setIsHeaderVisible(false)
      animateHeader(false)
    } else if (delta < 0 && !isHeaderVisible && currentY < 60) {
      setIsHeaderVisible(true)
      animateHeader(true)
    }
    lastScrollY.current = currentY
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.message, { color: theme.text }]}>Loading conversation history...</Text>
        </View>
      )
    }

    return (
      <>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleViewConversation(item)}>
              <LibraryCard
                imageUrl={require("../../../assets/cover.jpg")}
                text={item.title}
                tag={`${item.tag} • ${item.date} at ${item.time}`}
                date={item.date}
                shareLink={item.shareLink}
                onSharePress={() => handleViewConversation(item)}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={[styles.libraryListInner, { paddingTop: HEADER_HEIGHT + 80 }]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.flatList}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.message, { color: theme.text }]}>
                {selectedDate || searchQuery
                  ? `No conversations found${selectedDate ? ` for ${selectedDate}` : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`
                  : "No conversation history available"}
              </Text>
            </View>
          }
        />

        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: "white" }]}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>

              {selectedConversation && (
                <ScrollView style={styles.modalScrollView}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Symptom Check Conversation</Text>

                  <View style={styles.modalMeta}>
                    <Text style={[styles.modalTag, { backgroundColor: theme.primary + "20", color: theme.primary }]}>
                      {selectedConversation.tag}
                    </Text>
                    <Text style={[styles.modalDate, { color: theme.textSecondary }]}>
                      {selectedConversation.date} at {selectedConversation.time}
                    </Text>
                  </View>

                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Full Conversation</Text>

                  <View style={styles.conversationContainer}>
                    {selectedConversation.messages.map((message, index) => (
                      <View
                        key={index}
                        style={[
                          styles.messageContainer,
                          message.isUser ? styles.userMessage : styles.aiMessage,
                          { backgroundColor: message.isUser ? theme.primary + "15" : theme.background + "99" },
                        ]}
                      >
                        <View style={styles.messageHeader}>
                          <Text
                            style={[styles.messageSender, { color: message.isUser ? theme.primary : theme.accent }]}
                          >
                            {message.isUser ? "You" : "AI Assistant"}
                          </Text>
                          <Text style={[styles.messageTime, { color: theme.textSecondary }]}>
                            {message.timestamp?.toDate
                              ? message.timestamp
                                  .toDate()
                                  .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                          </Text>
                        </View>
                        <Text style={[styles.messageText, { color: theme.text }]}>{message.message}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Related Medical Information</Text>

                  <View style={styles.articlesContainer}>
                    {selectedConversation.articles.map((article, index) => (
                      <View
                        key={index}
                        style={[styles.articleCard, { backgroundColor: theme.background, borderColor: theme.border }]}
                      >
                        <TouchableOpacity onPress={() => openArticle(article)}>
                          <View style={styles.articleHeader}>
                            <Text style={[styles.articleTitle, { color: theme.text }]}>{article.title}</Text>
                            <Text style={[styles.articleCategory, { color: theme.textSecondary }]}>
                              {article.category}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Trusted Links with heading */}
                        {renderLinkButtons(article.links)}

                        <ScrollView style={styles.articleContentScroll} nestedScrollEnabled={true}>
                          <Text style={[styles.articleContent, { color: theme.text }]}>
                            {article.content.substring(0, 200)}...
                          </Text>
                          <TouchableOpacity onPress={() => openArticle(article)}>
                            <Text style={[styles.readMore, { color: theme.primary }]}>Tap to read more</Text>
                          </TouchableOpacity>
                        </ScrollView>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {renderArticleModal()}
      </>
    )
  }

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.contentSection}>
          <Animated.View
            style={[
              styles.animatedContent,
              {
                position: "absolute",
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
            <Header profileImage={profileImg} greeting="Hello Scott" location="SC, 702 USA" sos={true} medical={true} />
            <TitleText title="Medical Library" style={styles.pageTitle} />
            <Searchbar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search conversations..." />
          </Animated.View>
          <View style={styles.listWrapper}>{renderContent()}</View>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  )
}

export default MedicalLibrary

const styles = StyleSheet.create({
  contentSection: {
    paddingHorizontal: 18,
    flex: 1,
  },
  animatedContent: {
    zIndex: 1,
    backgroundColor: "transparent",
    width: "100%",
  },
  listWrapper: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  pageTitle: {
    textAlign: "center",
    marginTop: 0,
    marginBottom: 20,
  },
  libraryListInner: {
    gap: 20,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: HEADER_HEIGHT,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
  errorBanner: {
    backgroundColor: "#FFF3CD",
    padding: 12,
    marginHorizontal: 18,
    marginTop: HEADER_HEIGHT + 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  errorText: {
    color: "#856404",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    height: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  modalScrollView: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  modalDate: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    marginTop: 10,
  },
  conversationContainer: {
    marginBottom: 25,
  },
  messageContainer: {
    marginBottom: 15,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  userMessage: {
    marginLeft: 20,
    borderBottomRightRadius: 0,
  },
  aiMessage: {
    marginRight: 20,
    borderBottomLeftRadius: 0,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: "600",
  },
  messageTime: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  articlesContainer: {
    marginBottom: 20,
  },
  articleCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  articleHeader: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  articleCategory: {
    fontSize: 13,
    fontStyle: "italic",
  },
  articleContentScroll: {
    maxHeight: 300,
    marginTop: 10,
  },
  articleContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 14,
    marginTop: 10,
    fontWeight: "600",
  },
  articleModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  articleModalContent: {
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  articleModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  articleModalCategory: {
    fontSize: 16,
    marginBottom: 15,
    fontStyle: "italic",
  },
  articleModalContentText: {
    fontSize: 16,
    lineHeight: 24,
  },

  // --------- UPDATED LINK STYLES (clear, tappable, accessible) ---------
  linksBlock: {
    marginTop: 8,
    marginBottom: 6,
  },
  linksHeader: {
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.9,
    marginBottom: 6,
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8, // larger tap target
    minHeight: 36,
    maxWidth: "100%",
  },
  linkIcon: {
    marginRight: 6,
  },
  linkOpenIcon: {
    marginLeft: 6,
    opacity: 0.85,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
})

"use client"
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../theme/ThemeContext"

const ChatSummaryModal = ({ visible, conversation, articles, onClose, onViewLibrary }) => {
  const { theme } = useTheme()

  if (!conversation) return null

  const generateSummary = (messages) => {
    const userMessages = messages.filter((msg) => msg.isUser)
    const aiMessages = messages.filter((msg) => !msg.isUser)

    const symptoms = userMessages.flatMap((msg) => extractSymptoms(msg.text))
    const recommendations = aiMessages.flatMap((msg) => extractRecommendations(msg.text))

    const uniqueSymptoms = [...new Set(symptoms)]
    const uniqueRecommendations = [...new Set(recommendations)]

    let summary = `## Conversation Summary\n\n`

    if (uniqueSymptoms.length > 0) {
      summary += `**Symptoms Discussed:** ${uniqueSymptoms.join(", ")}\n\n`
    }

    if (uniqueRecommendations.length > 0) {
      summary += `**Key Recommendations:**\n`
      uniqueRecommendations.slice(0, 3).forEach((rec, index) => {
        summary += `${index + 1}. ${rec}\n`
      })
      summary += `\n`
    }

    summary += `**Important:** This conversation is for informational purposes only. Please consult with a healthcare professional for personalized medical advice and proper diagnosis.`

    return summary
  }

  const extractSymptoms = (text) => {
    const symptomKeywords = [
      "headache",
      "fever",
      "pain",
      "cough",
      "nausea",
      "fatigue",
      "stomach",
      "dizziness",
      "sore throat",
      "runny nose",
      "congestion",
      "vomiting",
      "diarrhea",
      "constipation",
      "rash",
      "itching",
      "chest pain",
      "shortness of breath",
      "back pain",
      "joint pain",
      "muscle ache",
      "insomnia",
      "anxiety",
      "depression",
      "heartburn",
      "bloating",
    ]
    return symptomKeywords.filter((keyword) => text.toLowerCase().includes(keyword))
  }

  const extractRecommendations = (text) => {
    const recommendationPatterns = [
      /(?:consider|recommend|suggest|try|should|might want to|could)\s+([^.!?]{10,80})/gi,
      /(?:it's important to|make sure to|be sure to)\s+([^.!?]{10,80})/gi,
      /(?:you may want to|it would be good to|consider)\s+([^.!?]{10,80})/gi,
    ]

    const recommendations = []
    recommendationPatterns.forEach((pattern) => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const rec = match[1].trim()
        if (rec.length > 10 && rec.length < 100) {
          recommendations.push(rec)
        }
      }
    })

    return [...new Set(recommendations)] // Remove duplicates
  }

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: "white" }]}>
        <View style={[styles.modalContent, { backgroundColor:  "white" }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]}>Conversation Summary</Text>

          <ScrollView style={styles.scrollView}>
            <View style={styles.summarySection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Points Discussed</Text>
              <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                {generateSummary(conversation.messages)}
              </Text>
            </View>

            {articles && articles.length > 0 && (
              <View style={styles.articlesSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Recommended Resources ({articles.length})
                </Text>
                {articles.map((article, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.articleCard,
                      {
                        backgroundColor: theme.cardBackground || "#f5f5f5",
                        borderColor: theme.border || "#e0e0e0",
                      },
                    ]}
                    onPress={() => onViewLibrary(article)}
                  >
                    <Text style={[styles.articleTitle, { color: theme.primary }]}>{article.title}</Text>
                    <Text style={[styles.articleCategory, { color: theme.textSecondary }]}>{article.category}</Text>
                    {article.matchedSymptoms && (
                      <Text style={[styles.matchedSymptoms, { color: theme.accent }]}>
                        Related to: {article.matchedSymptoms.join(", ")}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.libraryButton, { backgroundColor: theme.primary }]}
              onPress={() => onViewLibrary()}
            >
              <Text style={[styles.libraryButtonText, { color: theme.buttonText || "#fff" }]}>
                View Full Medical Library
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  articlesSection: {
    marginBottom: 20,
  },
  articleCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  articleCategory: {
    fontSize: 14,
    fontStyle: "italic",
  },
  matchedSymptoms: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  libraryButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  libraryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ChatSummaryModal

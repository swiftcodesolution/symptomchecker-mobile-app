// Enhanced conversation service for better summary generation and article linking
import { firestore } from "../config/firebase"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import medicalArticles from "./medicalArticles"

export class ConversationService {
    static generateConversationSummary(messages) {
        const userMessages = messages.filter((msg) => msg.isUser)
        const aiMessages = messages.filter((msg) => !msg.isUser)

        // Extract symptoms and concerns
        const symptoms = userMessages
            .flatMap((msg) => this.extractSymptoms(msg.text))
            .filter((symptom, index, arr) => arr.indexOf(symptom) === index)

        // Extract recommendations from AI responses
        const recommendations = aiMessages
            .flatMap((msg) => this.extractRecommendations(msg.text))
            .filter((rec, index, arr) => arr.indexOf(rec) === index)

        // Generate summary
        const symptomsText = symptoms.length > 0 ? `symptoms including ${symptoms.join(", ")}` : "health concerns"

        const recommendationsText =
            recommendations.length > 0
                ? `Key recommendations discussed: ${recommendations.slice(0, 3).join(", ")}.`
                : "Various health considerations were discussed."

        return {
            mainSummary: `You discussed ${symptomsText} during this conversation. ${recommendationsText} Please remember to consult with a healthcare professional for personalized medical advice.`,
            symptoms: symptoms,
            recommendations: recommendations,
            messageCount: messages.length,
            duration: this.calculateConversationDuration(messages),
        }
    }

    static extractSymptoms(text) {
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
        ]

        return symptomKeywords.filter((keyword) => text.toLowerCase().includes(keyword))
    }

    static extractRecommendations(text) {
        const recommendationPatterns = [
            /(?:consider|recommend|suggest|try|should|might want to|could)\s+([^.!?]+)/gi,
            /(?:it's important to|make sure to|be sure to)\s+([^.!?]+)/gi,
        ]

        const recommendations = []
        recommendationPatterns.forEach((pattern) => {
            let match
            while ((match = pattern.exec(text)) !== null) {
                const rec = match[1].trim()
                if (rec.length > 5 && rec.length < 100) {
                    recommendations.push(rec)
                }
            }
        })

        return recommendations.slice(0, 5) // Limit to 5 recommendations
    }

    static findRelevantArticles(messages) {
        const conversationText = messages
            .map((msg) => msg.text)
            .join(" ")
            .toLowerCase()

        const relevantArticles = []
        const articleScores = new Map()

        // Score articles based on symptom matches
        Object.keys(medicalArticles).forEach((symptom) => {
            if (conversationText.includes(symptom)) {
                medicalArticles[symptom].forEach((article) => {
                    const key = article.title
                    const currentScore = articleScores.get(key) || 0
                    articleScores.set(key, currentScore + 1)

                    if (!relevantArticles.find((a) => a.title === article.title)) {
                        relevantArticles.push({
                            ...article,
                            relevanceScore: currentScore + 1,
                            matchedSymptoms: [symptom],
                        })
                    } else {
                        const existingArticle = relevantArticles.find((a) => a.title === article.title)
                        existingArticle.relevanceScore = currentScore + 1
                        existingArticle.matchedSymptoms.push(symptom)
                    }
                })
            }
        })

        // Sort by relevance score and return top 5
        return relevantArticles.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)
    }

    static calculateConversationDuration(messages) {
        if (messages.length < 2) return "Less than 1 minute"

        const firstMessage = messages[0]
        const lastMessage = messages[messages.length - 1]

        const startTime = firstMessage.timestamp || new Date()
        const endTime = lastMessage.timestamp || new Date()

        const durationMs = endTime - startTime
        const durationMinutes = Math.floor(durationMs / (1000 * 60))

        if (durationMinutes < 1) return "Less than 1 minute"
        if (durationMinutes < 60) return `${durationMinutes} minutes`

        const hours = Math.floor(durationMinutes / 60)
        const remainingMinutes = durationMinutes % 60
        return `${hours}h ${remainingMinutes}m`
    }

    static async saveConversationSummary(summaryData) {
        try {
            const auth = getAuth()
            const user = auth.currentUser

            if (!user) {
                throw new Error("User not authenticated")
            }

            const summaryDoc = {
                userId: user.uid,
                sessionId: summaryData.sessionId,
                summary: summaryData.summary,
                articles: summaryData.articles || [],
                symptoms: summaryData.symptoms || [],
                recommendations: summaryData.recommendations || [],
                messageCount: summaryData.messageCount || 0,
                duration: summaryData.duration || "Unknown",
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            await addDoc(collection(firestore, "conversationSummaries"), summaryDoc)
            console.log("Conversation summary saved successfully")
            return true
        } catch (error) {
            console.error("Error saving conversation summary:", error)
            return false
        }
    }

    static async getConversationSummaries(userId) {
        try {
            const summariesQuery = query(collection(firestore, "conversationSummaries"), where("userId", "==", userId))

            const snapshot = await getDocs(summariesQuery)
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
        } catch (error) {
            console.error("Error fetching conversation summaries:", error)
            return []
        }
    }
}

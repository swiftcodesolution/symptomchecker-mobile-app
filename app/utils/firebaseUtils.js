import { firestore as db } from "../config/firebase"
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"

export const saveBlockToFirebase = async (blockData) => {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      console.error("No user logged in")
      throw new Error("User not authenticated")
    }

    const docRef = await addDoc(collection(db, "medicalBlocks"), {
      ...blockData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    })
    console.log("Block saved with ID: ", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error saving block: ", error)
    throw error
  }
}

export const getBlocksFromFirebase = async () => {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      console.error("No user logged in")
      return []
    }

    const q = query(collection(db, "medicalBlocks"), where("userId", "==", user.uid))
    const querySnapshot = await getDocs(q)

    const blocks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return blocks.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error getting blocks: ", error)
    throw error
  }
}

export const saveChatToFirebase = async (chatData) => {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      console.error("No user logged in")
      throw new Error("User not authenticated")
    }

    const timestamp = new Date()

    const docRef = await addDoc(collection(db, "chatHistory"), {
      sessionId: chatData.sessionId,
      message: chatData.message,
      isUser: chatData.isUser,
      userId: user.uid,
      timestamp: timestamp,
      isFromVoice: chatData.isFromVoice || false,
      isError: chatData.isError || false,
    })

    console.log("Chat message saved with ID: ", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error saving chat message: ", error)
    throw error
  }
}

export const getChatHistoryFromFirebase = async () => {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      console.error("No user logged in")
      return []
    }

    // Add query to filter by userId BEFORE fetching from Firestore
    const q = query(collection(db, "chatHistory"), where("userId", "==", user.uid))
    const querySnapshot = await getDocs(q)

    const allMessages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log("All messages for user:", allMessages)

    const sessions = {}

    allMessages.forEach((message) => {
      if (!message.sessionId) {
        console.log("Message missing sessionId:", message)
        return
      }

      if (!sessions[message.sessionId]) {
        sessions[message.sessionId] = {
          sessionId: message.sessionId,
          messages: [],
          timestamp: message.timestamp,
        }
      }

      sessions[message.sessionId].messages.push(message)

      const messageTime = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp)

      const sessionTime = sessions[message.sessionId].timestamp?.toDate
        ? sessions[message.sessionId].timestamp.toDate()
        : new Date(sessions[message.sessionId].timestamp)

      if (messageTime > sessionTime) {
        sessions[message.sessionId].timestamp = message.timestamp
      }
    })

    const sessionArray = Object.values(sessions).sort((a, b) => {
      const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
      const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)

      if (isNaN(dateA.getTime())) return 1
      if (isNaN(dateB.getTime())) return -1

      return dateB - dateA
    })

    console.log("Grouped sessions:", sessionArray)
    return sessionArray
  } catch (error) {
    console.error("Error getting chat history: ", error)
    throw error
  }
}

export const saveConversationSummary = async (summaryData) => {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) throw new Error("User not authenticated")

    const docRef = await addDoc(collection(db, "conversationSummaries"), {
      ...summaryData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error saving conversation summary:", error)
    throw error
  }
}

export const getConversationSummaries = async () => {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) return []

    const q = query(collection(db, "conversationSummaries"), where("userId", "==", user.uid))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting conversation summaries:", error)
    throw error
  }
}

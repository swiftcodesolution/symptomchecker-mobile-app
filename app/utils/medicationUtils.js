import { collection, query, where, getDocs } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { firestore as db } from "../config/firebase"

export const getRelevantMedications = async (symptoms) => {
    try {
        const auth = getAuth()
        const user = auth.currentUser

        if (!user) return []

        const medsSnapshot = await getDocs(
            query(collection(db, 'medicines'), where('userId', '==', user.uid))
        )

        const medications = medsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return medications.filter(med => {
            const medText = `${med.name} ${med.dosage} ${med.frequency}`.toLowerCase()
            return symptoms.some(symptom => medText.includes(symptom))
        })
    } catch (error) {
        console.error("Error getting medications:", error)
        return []
    }
}
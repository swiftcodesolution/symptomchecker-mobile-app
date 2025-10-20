// utils/aiService.js
// Client-only. Uses OpenAI Chat Completions with local fallbacks for reliability.

import { firestore } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔐 Read key from env (set EXPO_PUBLIC_OPENAI_KEY for Expo or OPENAI_API_KEY for other builds)
// DO NOT hardcode secrets in the client in production; prefer a secure backend proxy.
const OPENAI_KEY =
  "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";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Debug logging
console.log(
  "🔑 OpenAI Key Status:",
  OPENAI_KEY ? "✅ Key Found" : "❌ Key Missing"
);
console.log("🔑 Key Length:", OPENAI_KEY ? OPENAI_KEY.length : 0);
console.log(
  "🔑 Key Preview:",
  OPENAI_KEY ? `${OPENAI_KEY.substring(0, 20)}...` : "No key"
);
console.log(
  "🔑 Key Ends With:",
  OPENAI_KEY ? `...${OPENAI_KEY.substring(OPENAI_KEY.length - 10)}` : "No key"
);

const PRIMARY_MODEL = "gpt-4o-mini";
const FALLBACK_MODEL = "gpt-4o-mini";

// === Centralized disclaimer line (client-approved wording) ===
export const DISCLAIMER_LINE =
  "These answers are evidence-based, derived from millions of medical data points, and tailored using your profile and medications when available. They are not a substitute for a doctor’s diagnosis or treatment plan.";

const MEDICAL_SYSTEM_PROMPT = `You are a careful medical information assistant.
- Be concise (<=150 words).
- Provide general information only; do not provide a diagnosis or treatment plan.
- Consider the user's current meds & profile and mention potential interactions ONLY if clearly relevant.
- End with: "${DISCLAIMER_LINE}"`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postChatOnce(payload, { timeoutMs = 30000 } = {}) {
  if (!OPENAI_KEY) {
    console.log("❌ OpenAI Key Missing - Cannot make API call");
    throw new Error("MISSING_KEY");
  }
  console.log("🚀 Making API call to OpenAI...");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const body = await r.json().catch(() => ({}));
    console.log("📡 API Response Status:", r.status);
    console.log("📡 API Response Body:", JSON.stringify(body, null, 2));

    if (!r.ok) {
      const msg = body?.error?.message || `HTTP_${r.status}`;
      console.log("❌ API Error:", msg);
      const err = new Error(msg);
      err.status = r.status;
      throw err;
    }
    const content = body?.choices?.[0]?.message?.content ?? "";
    console.log("✅ API Success - Content length:", content.length);
    return content;
  } finally {
    clearTimeout(t);
  }
}

async function postChat(payload, { retries = 2 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await postChatOnce(payload);
    } catch (e) {
      attempt += 1;
      const status = e?.status || 0;
      const msg = (e?.message || "").toLowerCase();
      const isAbort = msg.includes("abort") || msg.includes("timeout");
      const isNet = msg.includes("network");
      const is429 = status === 429 || msg.includes("rate");
      const is5xx = status >= 500 && status <= 599;
      if ((isAbort || isNet || is429 || is5xx) && attempt <= retries) {
        await sleep(300 * attempt + Math.floor(Math.random() * 300));
        continue;
      }
      throw e;
    }
  }
}

// ---------- PUBLIC: fetchPatientProfileFromFirestore ----------
export async function fetchPatientProfileFromFirestore() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return "";
    const snap = await getDoc(doc(firestore, "users", user.uid));
    if (!snap.exists()) return "";
    const answers = Array.isArray(snap.data()?.answers)
      ? snap.data().answers
      : [];
    const lines = [];
    for (const row of answers) {
      const s = (row?.summarizedAnswer || row?.answer || "").toString().trim();
      if (s) lines.push(s);
    }
    return lines.join("\n");
  } catch {
    return "";
  }
}

// ---------- LOCAL Heuristics ----------
const SYMPTOM_WORDS = [
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
  "heartburn",
  "acid reflux",
  "shortness of breath",
  "chest pain",
  "back pain",
];

function looksLikeSymptomReport(text = "") {
  const t = text.toLowerCase();
  return SYMPTOM_WORDS.some((w) => t.includes(w));
}

function mentionsStartTime(text = "") {
  const t = text.toLowerCase();
  return (
    /\b(since|for|began|started|yesterday|last night|this morning|today at|for \d+\s*(hours?|days?))\b/.test(
      t
    ) ||
    /\b(\d{1,2}\s*(am|pm))\b/.test(t) ||
    // Roman-Urdu cues:
    /(subah se|raat se|kal se|aaj subah se|poray din se)/.test(t)
  );
}

function hasSufficientDetail(text = "") {
  const t = text.toLowerCase();
  if (mentionsStartTime(t)) return true;
  if (/\b(\d{2,3}\.?\d*)\s*°?\s*(f|c)\b/.test(t)) return true;
  if (/\b(1|2|3|4|5|6|7|8|9|10)\/10\b/.test(t)) return true;
  if (
    /\b(migraine|throbbing|one-sided|behind (the )?eye|band-like|pressure)\b/.test(
      t
    )
  )
    return true;
  return false;
}

function defaultFollowUpFor(text = "") {
  const t = text.toLowerCase();
  if (t.includes("headache"))
    return "When did the headache start, and how severe is it (1–10)?";
  if (t.includes("fever"))
    return "When did the fever start, and what was the highest measured temperature?";
  if (t.includes("cough"))
    return "How long has the cough been present, and is it dry or productive?";
  if (t.includes("stomach") || t.includes("abdom") || t.includes("nausea"))
    return "Where is the pain located, and when did it start?";
  if (t.includes("chest"))
    return "Is the chest pain constant or triggered by activity, and when did it begin?";
  return "When did this start, and what makes it better or worse?";
}

// ---------- Message builders ----------
// utils/aiService.js

function buildMessages(
  userInput,
  conversationHistory = [],
  medicationContext = "",
  patientProfile = "",
  userName = "",
  opts = {}
) {
  const contextParts = [];

  // 🔥 CRITICAL: Pehle user ka name explicitly batayo
  if (userName && userName.trim()) {
    contextParts.push(`User's Name: ${userName.trim()}`);
  }

  if (medicationContext)
    contextParts.push(`User's Current Medications:\n${medicationContext}`);
  if (patientProfile) contextParts.push(`Patient Profile:\n${patientProfile}`);

  if (opts?.suppressFollowUps) {
    contextParts.push(
      "Instruction: Do not ask any follow-up questions; provide a complete concise response only."
    );
  }

  // 🔥 IMPORTANT: AI ko explicitly batao ki date of birth name nahi hai
  contextParts.push(
    "Important: The patient profile may contain date of birth (like 10/11/1996) - this is NOT the user's name. Use their actual name provided above."
  );

  const sys = [MEDICAL_SYSTEM_PROMPT, ...contextParts].join("\n\n");

  return [
    { role: "system", content: sys },
    ...conversationHistory
      .slice(-4)
      .map((m) => ({ role: m.isUser ? "user" : "assistant", content: m.text })),
    { role: "user", content: userInput },
  ];
}

export class AIService {
  static buildMessages = buildMessages;

  static async getAIResponse(
    userInput,
    conversationHistory = [],
    medicationContext = "",
    patientProfile = "",
    userName = "",
    opts = {}
  ) {
    try {
      const messages = buildMessages(
        userInput,
        conversationHistory,
        medicationContext,
        patientProfile,
        userName,
        opts
      );
      try {
        const content = await postChat({
          model: PRIMARY_MODEL,
          messages,
          temperature: 0.4,
          max_tokens: 220,
        });
        const text = (content || "").trim();
        if (text) return text;
        throw new Error("EMPTY");
      } catch {
        const content = await postChat({
          model: FALLBACK_MODEL,
          messages,
          temperature: 0.4,
          max_tokens: 220,
        });
        const text = (content || "").trim();
        if (text) return text;
        throw new Error("EMPTY_FALLBACK");
      }
    } catch (error) {
      console.log("🚨 AI Service Error:", error);
      console.log("🚨 Error Message:", error?.message);
      console.log("🚨 Error Status:", error?.status);

      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("missing_key") || msg.includes("invalid api key")) {
        console.log("❌ Missing/Invalid API Key");
        return "OpenAI key missing/invalid.";
      }
      if (msg.includes("http_429") || msg.includes("rate")) {
        console.log("❌ Rate Limit Error");
        return "I'm getting too many requests right now. Please try again in a moment.";
      }
      if (msg.includes("timeout") || msg.includes("abort")) {
        console.log("❌ Timeout Error");
        return "The request timed out. Please try again.";
      }
      if (msg.includes("network")) {
        console.log("❌ Network Error");
        return "Network issue detected. Please check your connection and try again.";
      }
      console.log("❌ Generic Error - Returning fallback message");
      return "I'm having trouble right now. Please try again.";
    }
  }

  // utils/aiService.js

  static async generateFollowUpQuestion(
    userInput,
    conversationHistory = [],
    medicationContext = "",
    patientProfile = "",
    userName = ""
  ) {
    try {
      // If user already gave timing (e.g., "subah se"), skip redundant follow-ups
      if (hasSufficientDetail(userInput)) return null;

      // Build personalized system prompt with user's name
      let systemPrompt =
        "Write ONE short follow-up (< 18 words) only if it helps triage; else 'NO_FOLLOWUP'.";

      // Add user's name to context if available
      if (userName && userName.trim()) {
        systemPrompt += `\n\nUser's name: ${userName.trim()}. Use their name naturally in follow-up questions when appropriate.`;
      }

      const messages = [
        { role: "system", content: systemPrompt },
        medicationContext
          ? { role: "system", content: `Meds:\n${medicationContext}` }
          : null,
        patientProfile
          ? { role: "system", content: `Profile:\n${patientProfile}` }
          : null,
        ...conversationHistory
          .slice(-4)
          .map((m) => ({
            role: m.isUser ? "user" : "assistant",
            content: m.text,
          })),
        {
          role: "system",
          content: `Examples:\n"I have a fever" -> "When did it start, [Name]?"\n"What should I do?" -> "NO_FOLLOWUP"`,
        },
        { role: "user", content: userInput },
      ].filter(Boolean);

      const content = await postChat({
        model: PRIMARY_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 40,
      });
      const out = (content || "").trim();
      if (!out || out === "NO_FOLLOWUP") return null;

      // Guard against "when did it start?" when timing is already present
      if (
        mentionsStartTime(userInput) &&
        /when did.*start|kab.*start/i.test(out)
      )
        return null;

      return out.replace(/\s+/g, " ");
    } catch {
      if (!looksLikeSymptomReport(userInput) || hasSufficientDetail(userInput))
        return null;

      // Use name in default follow-up if available
      const defaultQuestion = defaultFollowUpFor(userInput);
      if (userName && userName.trim()) {
        return `${userName.trim()}, ${defaultQuestion}`;
      }
      return defaultQuestion;
    }
  }

  // utils/aiService.js

  static async shouldSkipMainResponse(
    userInput,
    conversationHistory = [],
    userName = ""
  ) {
    const localNeedsFollowUp =
      looksLikeSymptomReport(userInput) && !hasSufficientDetail(userInput);
    try {
      let systemPrompt =
        "Classify: If the user statement is a symptom report needing questions first, output SKIP_RESPONSE; else GIVE_RESPONSE.";

      // Add user's name to context if available
      if (userName && userName.trim()) {
        systemPrompt += `\n\nUser's name: ${userName.trim()}. Use their name naturally in follow-up questions when appropriate.`;
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory
          .slice(-4)
          .map((m) => ({
            role: m.isUser ? "user" : "assistant",
            content: m.text,
          })),
        { role: "user", content: userInput },
      ];
      const content = await postChat({
        model: PRIMARY_MODEL,
        messages,
        temperature: 0,
        max_tokens: 5,
      });
      const modelWantsSkip = (content || "").includes("SKIP_RESPONSE");
      return modelWantsSkip || localNeedsFollowUp;
    } catch {
      return localNeedsFollowUp;
    }
  }

  /**
   * Generate a DYNAMIC advice section specifically for the current topic/symptom.
   * Must not ask follow-up questions. Use the headings:
   * "Possible Causes", "What You Can Do Now", "When to See a Doctor".
   * Tailor to user concern + recent context; <= 220 words total.
   * Always end with the standard disclaimer line.
   */
  // utils/aiService.js

  static async generateAdviceSection(
    topicHint,
    conversationHistory = [],
    medicationContext = "",
    patientProfile = "",
    userName = ""
  ) {
    try {
      const sys = [
        MEDICAL_SYSTEM_PROMPT,
        "Instruction: Create an advice section tailored to the user's current concern. Do NOT ask follow-up questions.",
        "Use exactly these headings in order: Possible Causes / What You Can Do Now / When to See a Doctor.",
        "Keep it actionable and concise (<= 220 words total).",
        `Always end with: "${DISCLAIMER_LINE}"`,
      ].join("\n\n");

      // Add user name to context if available
      if (userName && userName.trim()) {
        sys += `\n\nUser's name: ${userName.trim()}. Use their name naturally when appropriate.`;
      }

      const convo = conversationHistory
        .map((m) => `${m.isUser ? "User" : "Assistant"}: ${m.text}`)
        .join("\n");

      const userContent = `
Current user message:
${topicHint}

Recent conversation context:
${convo}
`.trim();

      const messages = [
        { role: "system", content: sys },
        medicationContext
          ? {
              role: "system",
              content: `User Medications (if any):\n${medicationContext}`,
            }
          : null,
        patientProfile
          ? {
              role: "system",
              content: `Patient Profile (if any):\n${patientProfile}`,
            }
          : null,
        { role: "user", content: userContent },
      ].filter(Boolean);

      const content = await postChat({
        model: PRIMARY_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 320,
      });
      return (content || "").trim();
    } catch {
      // Fallback minimal dynamic-like skeleton — with disclaimer.
      return `Possible Causes
- Several common causes may fit based on your description.

What You Can Do Now
- Rest, hydrate, and avoid known triggers. Consider safe OTC relief if appropriate for you.

When to See a Doctor
- Seek urgent care if symptoms are severe, worsening, or include red flags (e.g., chest pain, breathing trouble, fainting, confusion, high fever).

${DISCLAIMER_LINE}`;
    }
  }

  // ---------- Medication helpers ----------
  static async getRelevantMedications(symptoms) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return [];
      const medicinesQuery = query(
        collection(firestore, "medicines"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(medicinesQuery);
      const allMedications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const relevantMeds = allMedications.filter((med) => {
        const medName = String(med.name || "").toLowerCase();
        const medNotes = String(med.notes || "").toLowerCase();
        return symptoms.some(
          (symptom) =>
            medName.includes(symptom) ||
            medNotes.includes(symptom) ||
            this.isRelevantMedication(medName, symptom)
        );
      });
      return relevantMeds;
    } catch {
      return [];
    }
  }

  static isRelevantMedication(medicationName, symptom) {
    const map = {
      headache: [
        "ibuprofen",
        "acetaminophen",
        "aspirin",
        "tylenol",
        "advil",
        "motrin",
      ],
      fever: ["acetaminophen", "ibuprofen", "tylenol", "advil"],
      pain: [
        "ibuprofen",
        "acetaminophen",
        "aspirin",
        "naproxen",
        "tylenol",
        "advil",
      ],
      cough: ["dextromethorphan", "guaifenesin", "robitussin", "mucinex"],
      nausea: ["ondansetron", "dramamine", "pepto", "bismol"],
      stomach: ["antacid", "omeprazole", "ranitidine", "tums", "pepcid"],
      fatigue: ["caffeine", "vitamin", "iron", "b12"],
    };
    const relevant = map[symptom] || [];
    const n = (medicationName || "").toLowerCase();
    return relevant.some((med) => n.includes(med));
  }

  static extractSymptoms(text) {
    const keys = [
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
      "heartburn",
      "acid reflux",
    ];
    const lower = String(text || "").toLowerCase();
    return keys.filter((k) => lower.includes(k));
  }
}

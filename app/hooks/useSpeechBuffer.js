// hooks/useSpeechBuffer.js
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

/**
 * Basic cleanup: remove fillers, collapse repeats, sentence-case lines,
 * space around punctuation, trim, etc. No external API used.
 */
const normalizeTranscript = (raw) => {
  if (!raw) return "";

  let t = String(raw)
    .replace(/\s+/g, " ")
    .trim();

  // Remove common filler words (single + followed by spaces)
  t = t.replace(
    /\b(um|uh|like|you know|i mean|actually|basically|literally|kind of|sort of|hmm|ah|erm)\b[\s,]*/gi,
    ""
  );

  // Kill long character repeats: heeelllo -> heello
  t = t.replace(/([a-zA-Z])\1{2,}/g, "$1$1");

  // Collapse immediate word repeats: "I I I think" -> "I think"
  t = t.replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1");

  // Neaten punctuation spacing
  t = t.replace(/\s*([,.!?;:])\s*/g, "$1 ");
  t = t.replace(/\s{2,}/g, " ").trim();

  // Ensure sentence capitalization + ending punctuation
  const sentences = t
    .split(/([.!?])\s*/)
    .reduce((acc, chunk, i, arr) => {
      if (!chunk) return acc;
      // Pair chunks into [text][punct] groups
      if (/[.!?]/.test(chunk)) {
        const last = acc.pop() || "";
        acc.push((last + chunk).trim());
      } else if (i === arr.length - 1) {
        // last piece might not have punctuation
        const s = chunk.trim();
        if (s) acc.push(/[.!?]$/.test(s) ? s : s + ".");
      } else {
        acc.push(chunk.trim());
      }
      return acc;
    }, [])
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  return sentences.join(" ");
};

/**
 * Web Speech wrapper (only created on web).
 */
const createWebSpeech = () => {
  if (Platform.OS !== "web") return null;
  const SR =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";
  rec.maxAlternatives = 1;
  return rec;
};

/**
 * useSpeechBuffer
 * - start(): starts buffering interim+final into bufferRef
 * - stop(): stops listening and returns a normalized string
 * - isListening: state flag
 */
export const useSpeechBuffer = () => {
  const [isListening, setIsListening] = useState(false);
  const [platformReady, setPlatformReady] = useState(true);
  const bufferRef = useRef("");
  const sessionActiveRef = useRef(false);
  const webRecRef = useRef(null);

  // Initialize Web rec once
  useEffect(() => {
    if (Platform.OS === "web") {
      webRecRef.current = createWebSpeech();
      if (!webRecRef.current) setPlatformReady(false);
    }
  }, []);

  // Mobile events (expo-speech-recognition)
  useSpeechRecognitionEvent("start", () => {
    if (Platform.OS !== "web" && sessionActiveRef.current) {
      setIsListening(true);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    if (Platform.OS !== "web") {
      setIsListening(false);
      sessionActiveRef.current = false;
    }
  });

  useSpeechRecognitionEvent("result", (event) => {
    if (Platform.OS === "web" || !sessionActiveRef.current) return;
    const results = event?.results || [];
    const last = results[results.length - 1];
    if (!last) return;

    // Stitch interim + final, but don't flush to UI yet
    const piece = String(last.transcript || "").trim();
    if (!piece) return;

    // Append with a space if needed
    if (bufferRef.current && !/[ \n]$/.test(bufferRef.current)) {
      bufferRef.current += " ";
    }
    bufferRef.current += piece;
  });

  useSpeechRecognitionEvent("error", () => {
    if (Platform.OS !== "web") {
      setIsListening(false);
      sessionActiveRef.current = false;
    }
  });

  const start = useCallback(async () => {
    bufferRef.current = "";
    sessionActiveRef.current = true;

    if (Platform.OS === "web") {
      if (!webRecRef.current) {
        setPlatformReady(false);
        return false;
      }
      const rec = webRecRef.current;
      // Handlers
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const piece = String(r[0]?.transcript || "").trim();
          if (!piece) continue;
          if (bufferRef.current && !/[ \n]$/.test(bufferRef.current)) {
            bufferRef.current += " ";
          }
          bufferRef.current += piece;
        }
      };
      rec.onerror = () => {
        setIsListening(false);
        sessionActiveRef.current = false;
      };
      rec.onend = () => {
        setIsListening(false);
        sessionActiveRef.current = false;
      };
      try {
        rec.start();
        setIsListening(true);
        return true;
      } catch {
        setIsListening(false);
        sessionActiveRef.current = false;
        return false;
      }
    }

    // Native (Android/iOS via Expo)
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync?.();
      if (perm && perm.granted === false) {
        setIsListening(false);
        sessionActiveRef.current = false;
        return false;
      }
      await ExpoSpeechRecognitionModule.start?.({
        interimResults: true,
        maxAlternatives: 1,
        language: "en-US",
        continuous: true,
      });
      setIsListening(true);
      return true;
    } catch {
      setIsListening(false);
      sessionActiveRef.current = false;
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    // Stop platform listeners
    if (Platform.OS === "web") {
      try {
        webRecRef.current?.stop();
      } catch {}
    } else {
      try {
        await ExpoSpeechRecognitionModule.stop?.();
      } catch {}
    }

    // Mark stopped
    setIsListening(false);
    sessionActiveRef.current = false;

    // Clean once at the end
    const raw = bufferRef.current.trim();
    bufferRef.current = "";
    return normalizeTranscript(raw);
  }, []);

  return {
    start,
    stop,
    isListening,
    platformReady,
  };
};

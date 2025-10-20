// utils/voice.ts
export const YES_WORDS = /\b(yes|yeah|yep|yup|correct|right|affirmative|sure)\b/i;
export const NO_WORDS = /\b(no|nope|nah|negative|never)\b/i;

export function normalizeTranscript(t) {
    if (!t) return "";
    let s = t
        .replace(/\s+/g, " ")
        .replace(/\b(um+|uh+|er+|like|you know|i mean|actually|basically|literally)\b/gi, "")
        .trim();

    // collapse exact word repeats: "yes yes" -> "yes"
    s = s.replace(/\b(\w+)(?:\s+\1){1,}\b/gi, "$1");
    // collapse common short phrase repeats
    s = s.replace(/\b(\w+\s+\w+)(?:\s+\1){1,}\b/gi, "$1");
    s = s.replace(/\b(\w+\s+\w+\s+\w+)(?:\s+\1){1,}\b/gi, "$1");

    // frequent preposition-phrase repeats
    s = s.replace(/\b((?:in|on|at|for|with|to|of|from)\s+\w+)(?:\s+\1){1,}\b/gi, "$1");
    s = s.replace(/\b((?:i|my|your|his|her|their|our)\s+\w+)(?:\s+\1){1,}\b/gi, "$1");

    // if the utterance is very short and contains a yes/no word, coerce to canonical "yes"/"no"
    const words = s.split(/\s+/);
    if (words.length <= 3) {
        if (YES_WORDS.test(s)) return "yes";
        if (NO_WORDS.test(s)) return "no";
    }
    return s;
}

/**
 * Pick the most reliable text from an Expo SpeechRecognition `result` event.
 * Prefers final results, higher confidence (when present), then longer content.
 */
export function pickBestTranscript(event) {
    const arr = (event?.results ?? []).flatMap((r) => {
        // event shape can differ by platform; normalize
        const alternatives = r?.alternatives ?? [{ transcript: r?.transcript, confidence: r?.confidence }];
        return alternatives.map((a) => ({
            text: (a?.transcript ?? "").toString(),
            conf: typeof a?.confidence === "number" ? a.confidence : (r?.confidence ?? 0),
            final: !!(r?.isFinal ?? event?.isFinal),
        }));
    });

    if (!arr.length) return "";

    // prefer final entries first
    const finals = arr.filter((x) => x.final && x.text);
    const pool = finals.length ? finals : arr.filter((x) => x.text);

    // sort by confidence desc, tiebreak by length desc
    pool.sort((a, b) => {
        if (b.conf !== a.conf) return b.conf - a.conf;
        return (b.text?.length ?? 0) - (a.text?.length ?? 0);
    });

    return pool[0]?.text ?? "";
}

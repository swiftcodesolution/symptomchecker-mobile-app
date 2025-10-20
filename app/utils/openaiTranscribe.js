// app/utils/openaiTranscribe.js
import { Platform } from "react-native"

export async function transcribeWithOpenAI(fileUri, {
  apiKey,
  model = "gpt-4o-mini-transcribe",
  language = "en",
} = {}) {
  if (!apiKey) {
    throw new Error("Missing OpenAI API key")
  }

  const filename = fileUri.split("/").pop() || `audio_${Date.now()}.m4a`
  const type = "audio/m4a"

  const form = new FormData()
  form.append("model", model)
  form.append("language", language)
  form.append("response_format", "json")
  form.append("file", { uri: fileUri, name: filename, type })

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: ``,
      // NOTE: Content-Type ko RN khud set karega (multipart boundary)
    },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Transcription failed: ${res.status} ${errText}`)
  }

  const data = await res.json()
  return data.text || ""
}

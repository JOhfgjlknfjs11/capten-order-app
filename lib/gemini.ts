import { type Language } from './dictionary'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// موديل توليد النصوص (سريع وخفيف)
export const TEXT_MODEL = 'gemini-flash-latest'
// موديل تحويل النص إلى كلام
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts'

// صوت افتراضي دافئ ومرحّب (أصوات Gemini المبنية مسبقاً)
export const DEFAULT_GEMINI_VOICE = 'Achird'

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return key
}

/**
 * توليد نص باستخدام Gemini
 */
export async function generateText(options: {
  prompt: string
  systemInstruction?: string
  temperature?: number
}): Promise<string> {
  const { prompt, systemInstruction, temperature = 0.9 } = options

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 512,
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(
    `${GEMINI_BASE}/${TEXT_MODEL}:generateContent?key=${getApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini text error: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ??
    ''
  return text.trim()
}

/**
 * تحويل النص إلى كلام باستخدام Gemini TTS
 * يرجع Buffer بصيغة WAV جاهز للتشغيل في المتصفح
 */
export async function textToSpeech(options: {
  text: string
  voiceName?: string
}): Promise<Buffer> {
  const { text, voiceName = DEFAULT_GEMINI_VOICE } = options

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      temperature: 1,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  }

  const res = await fetch(
    `${GEMINI_BASE}/${TTS_MODEL}:generateContent?key=${getApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini TTS error: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const part = data?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data?: string } }) => p.inlineData?.data
  )
  const base64Audio: string | undefined = part?.inlineData?.data
  const mimeType: string = part?.inlineData?.mimeType ?? 'audio/L16;rate=24000'

  if (!base64Audio) {
    throw new Error('Gemini TTS returned no audio')
  }

  const pcmBuffer = Buffer.from(base64Audio, 'base64')
  const sampleRate = parseSampleRate(mimeType)
  return pcmToWav(pcmBuffer, sampleRate)
}

/**
 * استخراج معدل العينة من نوع الـ MIME (مثال: audio/L16;rate=24000)
 */
function parseSampleRate(mimeType: string): number {
  const match = /rate=(\d+)/.exec(mimeType)
  return match ? parseInt(match[1], 10) : 24000
}

/**
 * تغليف بيانات PCM الخام (16-bit mono) داخل رأس WAV
 * حتى يتمكن المتصفح من فك تشفيرها وتشغيلها
 */
function pcmToWav(pcmData: Buffer, sampleRate: number): Buffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = pcmData.length

  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // حجم قطعة fmt
  header.writeUInt16LE(1, 20) // AudioFormat = PCM
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcmData])
}

/**
 * أصوات Gemini المقترحة لكل لغة (كلها أصوات متعددة اللغات)
 */
export const GEMINI_VOICE_BY_LANGUAGE: Record<Language, string> = {
  en: 'Achird',
  ar: 'Achird',
  ru: 'Achird',
  fr: 'Achird',
  de: 'Achird',
  it: 'Achird',
  es: 'Achird',
  zh: 'Achird',
  ja: 'Achird',
  pt: 'Achird',
  tr: 'Achird',
  ko: 'Achird',
}

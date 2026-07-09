import { ElevenLabsClient } from 'elevenlabs'

// لا نرمي هنا - نتحقق داخل الدالة فقط لتجنب crash وقت الـ import
let client: ElevenLabsClient | null = null

function getClient(): ElevenLabsClient {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }
  if (!client) {
    client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  }
  return client
}

export interface TextToSpeechOptions {
  text: string
  voiceId: string
  language?: string
}

/**
 * Convert text to speech using ElevenLabs
 * Returns an audio buffer (MP3)
 */
export async function textToSpeech({
  text,
  voiceId,
  language,
}: TextToSpeechOptions): Promise<Buffer> {
  const c = getClient()

  const audio = await c.generate({
    voice: voiceId,
    text,
    model_id: 'eleven_multilingual_v2',
    language_code: language,
  })

  const chunks: Buffer[] = []
  for await (const chunk of audio) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

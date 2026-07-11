import { ElevenLabsClient } from 'elevenlabs'

// صوت الأفاتار على ElevenLabs (Voice ID)
export const DEFAULT_VOICE_ID = 'wWWn96OtTHu1sn8SRGEr'

let client: ElevenLabsClient | null = null

function getClient(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }
  if (!client) {
    client = new ElevenLabsClient({ apiKey })
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

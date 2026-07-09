import { ElevenLabsClient } from 'elevenlabs'

const ELEVENLABS_API_KEY = 'sk_a1c3af2b173d4dca1500a480f425e4906cde3cd5b73a2ee9'
export const DEFAULT_VOICE_ID   = 'hpp4J3VqNfWAUOO0d1Us'

let client: ElevenLabsClient | null = null

function getClient(): ElevenLabsClient {
  if (!client) {
    client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY || ELEVENLABS_API_KEY,
    })
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

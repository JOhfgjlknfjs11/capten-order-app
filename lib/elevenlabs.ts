import { ElevenLabsClient } from 'elevenlabs'

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY environment variable is not set')
}

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

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
  try {
    const audio = await client.generate({
      voice: voiceId,
      text,
      model_id: 'eleven_multilingual_v2', // Supports multiple languages
      language_code: language, // ISO 639-1 code (e.g., 'en', 'ar', 'fr')
    })

    // Convert async generator to buffer
    const chunks: Buffer[] = []
    for await (const chunk of audio) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  } catch (error) {
    console.error('[v0] ElevenLabs TTS error:', error)
    throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get list of available voices from ElevenLabs
 */
export async function getAvailableVoices() {
  try {
    const voices = await client.voices.getAll()
    return voices
  } catch (error) {
    console.error('[v0] Failed to fetch voices:', error)
    throw new Error('Failed to fetch available voices')
  }
}

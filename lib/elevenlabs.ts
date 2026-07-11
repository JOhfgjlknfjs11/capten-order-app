import { ElevenLabsClient } from 'elevenlabs'

// صوت الأفاتار الأساسي على ElevenLabs (Voice ID) — صوت احترافي يتطلب اشتراك مدفوع
export const DEFAULT_VOICE_ID = 'wWWn96OtTHu1sn8SRGEr'

// صوت احتياطي مجاني (premade) يعمل على الحسابات المجانية عند فشل الصوت الأساسي بخطأ 402
// "George - Warm, Captivating Storyteller" — نبرة دافئة تناسب مضيف المطعم
export const FALLBACK_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'

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
}: TextToSpeechOptions): Promise<{ audio: Buffer; usedFallback: boolean }> {
  try {
    const audio = await generate(voiceId, text, language)
    return { audio, usedFallback: false }
  } catch (error) {
    // الحسابات المجانية لا تستطيع استخدام الأصوات الاحترافية/المكتبة (خطأ 402).
    // في هذه الحالة نستخدم صوتاً مجانياً (premade) تلقائياً حتى يعمل الصوت.
    const isPaymentRequired =
      error instanceof Error && /402|payment_required|paid_plan/i.test(error.message)

    if (isPaymentRequired && voiceId !== FALLBACK_VOICE_ID) {
      const audio = await generate(FALLBACK_VOICE_ID, text, language)
      return { audio, usedFallback: true }
    }
    throw error
  }
}

async function generate(
  voiceId: string,
  text: string,
  language?: string
): Promise<Buffer> {
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

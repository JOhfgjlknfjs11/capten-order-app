import { ElevenLabsClient } from 'elevenlabs'

// صوت الأفاتار الأساسي على ElevenLabs (Voice ID) — صوت احترافي يتطلب اشتراك مدفوع
export const DEFAULT_VOICE_ID = 'wWWn96OtTHu1sn8SRGEr'

// صوت احتياطي مجاني (premade) يعمل على الحسابات المجانية عند فشل الصوت الأساسي بخطأ 402
// "George - Warm, Captivating Storyteller" — نبرة دافئة تناسب مضيف المطعم
export const FALLBACK_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'

let client: ElevenLabsClient | null = null

function getClient(): ElevenLabsClient {
  // يدعم كلا الاسمين: ELEVENLABS_API (المضبوط في المشروع) و ELEVENLABS_API_KEY
  const apiKey = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API is not set')
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[v0] ElevenLabs error with voice', voiceId, ':', errorMessage)
    
    // الحسابات المجانية لا تستطيع استخدام الأصوات الاحترافية/المكتبة (خطأ 402).
    // في هذه الحالة نستخدم صوتاً مجانياً (premade) تلقائياً حتى يعمل الصوت.
    const isPaymentRequired =
      /402|payment_required|paid_plan/i.test(errorMessage)
    
    // Also check for auth errors and try fallback
    const isAuthError = /401|unauthorized|invalid|api_key/i.test(errorMessage)

    if ((isPaymentRequired || isAuthError) && voiceId !== FALLBACK_VOICE_ID) {
      console.log('[v0] Attempting fallback voice due to error:', isPaymentRequired ? '402' : '401')
      try {
        const audio = await generate(FALLBACK_VOICE_ID, text, language)
        return { audio, usedFallback: true }
      } catch (fallbackError) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        console.error('[v0] Fallback voice also failed:', fallbackMsg)
        throw fallbackError
      }
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

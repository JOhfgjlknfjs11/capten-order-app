import { type Language } from '@/lib/dictionary'

export async function translateAndSpeak(
  text: string,
  language: Language,
  voiceId?: string
): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch('/api/translate-and-speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
        voiceId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[v0] Translation and speech error:', error)
      return null
    }

    const buffer = await response.arrayBuffer()
    return buffer
  } catch (error) {
    console.error('[v0] Error in translateAndSpeak:', error)
    return null
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech, DEFAULT_VOICE_ID } from '@/lib/elevenlabs'
import { type Language } from '@/lib/dictionary'

export const runtime = 'nodejs'

// Language names for Groq translation
const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ar: 'Arabic',
  ru: 'Russian',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  es: 'Spanish',
  zh: 'Chinese',
  ja: 'Japanese',
  pt: 'Portuguese',
  tr: 'Turkish',
  ko: 'Korean',
}

const LANGUAGE_CODES: Partial<Record<Language, string>> = {
  en: 'en',
  ar: 'ar',
  ru: 'ru',
  fr: 'fr',
  de: 'de',
  it: 'it',
  es: 'es',
  zh: 'zh',
  ja: 'ja',
  pt: 'pt',
  tr: 'tr',
  ko: 'ko',
}

/**
 * Translate text using Groq and convert to speech using ElevenLabs
 */
export async function POST(request: NextRequest) {
  try {
    const { text, language, voiceId } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    if (!language) {
      return NextResponse.json({ error: 'language is required' }, { status: 400 })
    }

    // If language is English, skip translation
    let translatedText = text
    if (language !== 'en') {
      // Translate using Groq
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${LANGUAGE_NAMES[language as Language] || language}. 
Only provide the translated text, no explanations or additional content.
Maintain the same tone and style as the original.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      })

      if (!groqResponse.ok) {
        const error = await groqResponse.text()
        console.error('[v0] Groq translation error:', error)
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
      }

      const groqData = await groqResponse.json()
      translatedText = groqData.choices?.[0]?.message?.content?.trim() || text
    }

    // Convert translated text to speech using ElevenLabs
    const { audio } = await textToSpeech({
      text: translatedText,
      voiceId: voiceId?.trim() || DEFAULT_VOICE_ID,
      language: LANGUAGE_CODES[(language as Language) ?? 'en'],
    })

    if (!audio || audio.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate audio' },
        { status: 500 }
      )
    }

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.length.toString(),
        'Cache-Control': 'no-cache',
        'X-Translation': translatedText,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Translation and speech failed'
    console.error('[v0] Translate and speak error:', message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

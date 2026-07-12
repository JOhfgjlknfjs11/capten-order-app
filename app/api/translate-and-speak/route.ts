import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech, DEFAULT_VOICE_ID } from '@/lib/elevenlabs'
import { generateText } from '@/lib/gemini'
import { type Language } from '@/lib/dictionary'

export const runtime = 'nodejs'

// Language names for translation
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
 * Translate text using Gemini and convert to speech using ElevenLabs
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
      // Translate using Gemini
      const translationPrompt = `Translate the following text to ${LANGUAGE_NAMES[language as Language] || language}. 
Only provide the translated text, no explanations or additional content.
Maintain the exact same tone and style as the original.

Text to translate: "${text}"`

      translatedText = await generateText({
        prompt: translationPrompt,
        systemInstruction: `You are a professional translator. Your task is to translate text accurately while preserving tone and meaning. 
Always respond with ONLY the translated text, never include explanations, metadata, or any additional content.`,
        temperature: 0.3,
      })

      if (!translatedText?.trim()) {
        console.error('[v0] Translation failed - empty result')
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
      }

      console.log('[v0] Translation completed:', translatedText.slice(0, 100))
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
        'X-Translation': encodeURIComponent(translatedText),
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

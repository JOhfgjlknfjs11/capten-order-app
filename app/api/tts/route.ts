import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech, DEFAULT_VOICE_ID } from '@/lib/elevenlabs'
import { type Language } from '@/lib/dictionary'

export const runtime = 'nodejs'

// خريطة اللغات إلى رموز ElevenLabs (اختياري لتحسين النطق)
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

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, language } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const { audio, usedFallback } = await textToSpeech({
      text,
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
        'X-Voice-Fallback': usedFallback ? '1' : '0',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TTS failed'
    console.error('[v0] TTS Error:', message)
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech, GEMINI_VOICE_BY_LANGUAGE, DEFAULT_GEMINI_VOICE } from '@/lib/gemini'
import { type Language } from '@/lib/dictionary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { text, voiceName, language } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const resolvedVoice =
      voiceName?.trim() ||
      GEMINI_VOICE_BY_LANGUAGE[(language as Language) ?? 'en'] ||
      DEFAULT_GEMINI_VOICE

    const audioBuffer = await textToSpeech({
      text,
      voiceName: resolvedVoice,
    })

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    )
  }
}

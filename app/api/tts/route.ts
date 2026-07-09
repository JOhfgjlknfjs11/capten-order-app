import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech } from '@/lib/elevenlabs'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, language } = await request.json()

    if (!text?.trim() || !voiceId?.trim()) {
      return NextResponse.json({ error: 'text and voiceId are required' }, { status: 400 })
    }

    const audioBuffer = await textToSpeech({ text, voiceId, language: language || 'en' })

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
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

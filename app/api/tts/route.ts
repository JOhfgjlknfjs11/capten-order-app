import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech } from '@/lib/elevenlabs'

export const runtime = 'nodejs'

interface TTSRequest {
  text: string
  voiceId: string
  language?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()

    const { text, voiceId, language } = body

    // Validation
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!voiceId || !voiceId.trim()) {
      return NextResponse.json(
        { error: 'Voice ID is required' },
        { status: 400 }
      )
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length of 5000 characters' },
        { status: 400 }
      )
    }

    // Generate speech
    const audioBuffer = await textToSpeech({
      text,
      voiceId,
      language,
    })

    // Return MP3 audio
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('[v0] TTS API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use POST method to generate speech' },
    { status: 405 }
  )
}

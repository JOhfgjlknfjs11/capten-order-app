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
    // تحقق من المفتاح
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('[v0] ELEVENLABS_API_KEY غير معرّف')
      return NextResponse.json(
        { error: 'معرف API ElevenLabs غير معرّف' },
        { status: 500 }
      )
    }

    const body: TTSRequest = await request.json()

    const { text, voiceId, language } = body

    console.log('[v0] TTS Request:', { 
      text: text.substring(0, 50) + '...', 
      voiceId: voiceId.substring(0, 8) + '...', 
      language 
    })

    // Validation
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'النص مطلوب' },
        { status: 400 }
      )
    }

    if (!voiceId || !voiceId.trim()) {
      return NextResponse.json(
        { error: 'معرف الصوت مطلوب' },
        { status: 400 }
      )
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'النص يتجاوز الحد الأقصى 5000 حرف' },
        { status: 400 }
      )
    }

    // Generate speech
    const audioBuffer = await textToSpeech({
      text,
      voiceId,
      language: language || 'en',
    })

    console.log('[v0] TTS Success:', { size: audioBuffer.length, language })

    // Return MP3 audio
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[v0] TTS API error:', error)
    return NextResponse.json(
      {
        error: 'فشل في توليد الكلام',
        details: error instanceof Error ? error.message : 'خطأ غير معروف',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'استخدم طريقة POST لتوليد الكلام' },
    { status: 405 }
  )
}

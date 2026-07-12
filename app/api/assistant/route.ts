import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { dictionary, type Language } from '@/lib/dictionary'

export const runtime = 'nodejs'

const LANGUAGE_LABEL: Record<Language, string> = {
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

export async function POST(request: NextRequest) {
  try {
    const { message, language } = await request.json()
    const lang: Language = (language as Language) ?? 'en'
    const langLabel = LANGUAGE_LABEL[lang] ?? 'English'

    const systemInstruction = `You are "Capten", a warm, charismatic virtual host for Capten Order, a luxury seafood and fine-dining restaurant.

Your personality: friendly, welcoming, concise, and elegant — like a real maître d' greeting a guest face to face.

Rules:
- ALWAYS reply in ${langLabel}.
- Never mention any specific city, country, region, or geographic location.
- Keep replies short and natural for speech: 1 to 3 sentences, no lists, no markdown, no emojis.
- You help guests feel welcome, answer questions about the restaurant, the menu (fresh seafood, premium steaks, traditional favorites, exotic cocktails), and guide them to start their order.
- If asked to start ordering, warmly encourage them to browse the menu.
- Sound like a person speaking out loud, not like written text.`

    const prompt =
      message?.trim() ||
      'Greet the guest warmly as they arrive, introduce yourself briefly, and invite them to explore the experience.'

    const reply = await generateText({
      prompt,
      systemInstruction,
      temperature: 0.9,
    })

    return NextResponse.json({
      reply: reply || dictionary[lang].tagline,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assistant failed' },
      { status: 500 }
    )
  }
}

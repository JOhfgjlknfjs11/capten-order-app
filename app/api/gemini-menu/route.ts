import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { type Language, dictionary } from '@/lib/dictionary'

// Map language codes to language names for Gemini prompt
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

export async function POST(request: NextRequest) {
  try {
    const { itemName, language = 'en' } = await request.json()

    if (!itemName?.trim()) {
      return NextResponse.json(
        { error: 'itemName is required' },
        { status: 400 }
      )
    }

    // Get the language name for the prompt
    const languageName = LANGUAGE_NAMES[language as Language] || 'English'

    // Create a prompt for Gemini to get professional food description as Capten Order Captain
    const systemInstruction = `You are a professional and friendly Capten Order Captain who knows everything about food and drinks. 
You provide engaging, accurate, and appetizing descriptions of menu items. Keep descriptions concise but captivating (2-3 sentences max).
Always speak as if you're personally recommending this item to a customer.
IMPORTANT: Always respond in ${languageName}, never use English.`

    const prompt = `Describe this menu item in ${languageName} as a professional restaurant captain would, making it sound appealing and enticing: "${itemName}"`

    const description = await generateText({
      prompt,
      systemInstruction,
      temperature: 0.8,
    })

    return NextResponse.json({
      itemName,
      description: description || 'A delicious menu item waiting for you to discover!',
      language,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate description'
    console.error('[v0] Gemini menu error:', message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { type Language } from '@/lib/dictionary'

export async function POST(request: NextRequest) {
  try {
    const { itemName, language = 'en' } = await request.json()

    if (!itemName?.trim()) {
      return NextResponse.json(
        { error: 'itemName is required' },
        { status: 400 }
      )
    }

    // Create a prompt for Gemini to get professional food description as Capten Order Captain
    const systemInstruction = `You are a professional and friendly Capten Order Captain who knows everything about food and drinks. 
You provide engaging, accurate, and appetizing descriptions of menu items. Keep descriptions concise but captivating (2-3 sentences max).
Always speak as if you're personally recommending this item to a customer.`

    const prompt = `Describe this menu item in ${language} as a professional restaurant captain would, making it sound appealing: "${itemName}"`

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

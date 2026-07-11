import { NextRequest, NextResponse } from 'next/server'
import { type Language, LANGUAGES } from '@/lib/dictionary'

// Grok API integration for advanced language detection
const GROK_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY
const GROK_MODEL = 'grok-beta'

interface DetectionResult {
  detectedLanguage: Language | null
  confidence: number
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // If Grok API key is not available, return null to use fallback
    if (!GROK_API_KEY) {
      return NextResponse.json({
        detectedLanguage: null,
        confidence: 0,
        reasoning: 'Grok API key not configured',
      } as DetectionResult)
    }

    // Prepare the prompt for Grok
    const prompt = `Analyze this transcript and detect which language it is written in:

Transcript: "${transcript}"

Available languages to choose from: ${LANGUAGES.join(', ')}

Respond with a JSON object in this exact format:
{
  "language": "<language_code>",
  "confidence": <0-100>,
  "reasoning": "<brief explanation>"
}

Example:
{
  "language": "ar",
  "confidence": 95,
  "reasoning": "Contains Arabic script and common Arabic words"
}

Only respond with the JSON object, no other text.`

    // Call Grok API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      console.error('[v0] Grok API error:', response.status, response.statusText)
      return NextResponse.json({
        detectedLanguage: null,
        confidence: 0,
        reasoning: 'Language detection API error',
      } as DetectionResult)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[v0] Failed to parse Grok response:', content)
      return NextResponse.json({
        detectedLanguage: null,
        confidence: 0,
        reasoning: 'Failed to parse detection result',
      } as DetectionResult)
    }

    const result = JSON.parse(jsonMatch[0])
    const detectedLang = result.language as Language

    // Validate the language code
    if (!LANGUAGES.includes(detectedLang)) {
      return NextResponse.json({
        detectedLanguage: null,
        confidence: 0,
        reasoning: `Invalid language code: ${detectedLang}`,
      } as DetectionResult)
    }

    return NextResponse.json({
      detectedLanguage: detectedLang,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || '',
    } as DetectionResult)
  } catch (error) {
    console.error('[v0] Language detection error:', error)
    return NextResponse.json(
      { error: 'Language detection failed' },
      { status: 500 }
    )
  }
}

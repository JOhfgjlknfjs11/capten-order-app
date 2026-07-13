'use client'

import { useCallback } from 'react'
import { type Language } from '@/lib/dictionary'

interface UseGeminiMenuOptions {
  language?: Language
}

export function useGeminiMenu(options: UseGeminiMenuOptions = {}) {
  const { language = 'en' } = options

  const getItemDescription = useCallback(
    async (itemName: string): Promise<string> => {
      try {
        const response = await fetch('/api/gemini-menu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemName,
            language,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to get description: ${response.statusText}`)
        }

        const data = await response.json()
        if (!data.description) {
          throw new Error('No description returned')
        }
        return data.description
      } catch (error) {
        console.error('[v0] Error getting item description:', error)
        // Re-throw so callers (e.g. GeminiFoodCard) can fall back to the
        // built-in local description instead of showing the raw item name.
        throw error instanceof Error ? error : new Error('Failed to get description')
      }
    },
    [language]
  )

  return { getItemDescription }
}

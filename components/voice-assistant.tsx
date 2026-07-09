'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSpeech } from '@/hooks/use-speech'
import {
  detectLanguageFromSpeech,
  getSpeechLanguageCode,
} from '@/lib/language-detection'
import {
  textToSpeech,
  playAudio,
  GREETING_MESSAGES,
  CONFIRMATION_MESSAGES,
} from '@/lib/text-to-speech'
import { LANGUAGES, type Language } from '@/lib/dictionary'

interface VoiceAssistantProps {
  onLanguageDetected: (language: Language, index: number) => void
  onAutoScroll?: (index: number) => Promise<void>
}

export function VoiceAssistant({ onLanguageDetected, onAutoScroll }: VoiceAssistantProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<'greeting' | 'listening' | 'confirming'>('greeting')
  const { isListening, transcript, startListening, stopListening } = useSpeech()
  const hasPlayedGreetingRef = useRef(false)
  const isProcessingRef = useRef(false)

  // تشغيل الترحيب عند التحميل
  useEffect(() => {
    const playOnMount = async () => {
      if (!hasPlayedGreetingRef.current) {
        hasPlayedGreetingRef.current = true
        await playGreeting()
      }
    }
    playOnMount()
  }, [])

  const playGreeting = useCallback(async () => {
    try {
      setIsSpeaking(true)
      
      const audioBuffer = await textToSpeech(GREETING_MESSAGES.en, {
        language: 'en',
        voiceId: 'hpp4J3VqNfWAUOO0d1Us',
      })
      
      if (audioBuffer) {
        await playAudio(audioBuffer)
      }
      setCurrentPhase('listening')
      startListening({ language: 'en-US' })
    } catch (error) {
      // Silently handle errors - system works in background
      setCurrentPhase('listening')
      startListening({ language: 'en-US' })
    } finally {
      setIsSpeaking(false)
    }
  }, [startListening])

  // معالجة النص المحول من الكلام
  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 0) {
      handleSpeechTranscript(transcript)
    }
  }, [isListening, transcript])

  const handleSpeechTranscript = useCallback(
    async (text: string) => {
      if (isProcessingRef.current) return

      isProcessingRef.current = true
      try {
        // اكتشف اللغة من النص
        const detectedLanguage = detectLanguageFromSpeech(text)

        if (!detectedLanguage) {
          isProcessingRef.current = false
          return
        }

        const languageIndex = LANGUAGES.indexOf(detectedLanguage)
        if (languageIndex === -1) {
          isProcessingRef.current = false
          return
        }

        // تمرير تلقائي للغة
        setCurrentPhase('confirming')
        if (onAutoScroll) {
          await onAutoScroll(languageIndex)
        }

        // تشغيل رسالة التأكيد
        await new Promise((resolve) => setTimeout(resolve, 500))
        const confirmationText = CONFIRMATION_MESSAGES[detectedLanguage]
        const confirmAudioBuffer = await textToSpeech(confirmationText, {
          language: detectedLanguage,
          voiceId: 'hpp4J3VqNfWAUOO0d1Us',
        })
        if (confirmAudioBuffer) {
          await playAudio(confirmAudioBuffer)
        }

        // أبلغ عن اللغة المكتشفة
        onLanguageDetected(detectedLanguage, languageIndex)
      } catch (error) {
        // سكوت على الأخطاء - النظام يعمل تلقائياً
      } finally {
        isProcessingRef.current = false
        stopListening()
      }
    },
    [onLanguageDetected, onAutoScroll, stopListening]
  )

  // لا يوجد واجهة مرئية - النظام يعمل تلقائياً في الخلفية
  return null
}

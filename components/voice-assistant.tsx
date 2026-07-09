'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSpeech } from '@/hooks/use-speech'
import { detectLanguageFromSpeech } from '@/lib/language-detection'
import {
  textToSpeech,
  playAudio,
  CONFIRMATION_MESSAGES,
} from '@/lib/text-to-speech'
import { LANGUAGES, type Language } from '@/lib/dictionary'

const VOICE_ID = 'hpp4J3VqNfWAUOO0d1Us'

// رسالة الترحيب باللغة الإنجليزية فقط - تُقال مرة واحدة عند الفتح
const WELCOME_TEXT =
  'Welcome to our exciting journey! To begin: What is your native language?'

interface VoiceAssistantProps {
  onLanguageDetected: (language: Language, index: number) => void
  onAutoScroll: (index: number) => Promise<void>
}

export function VoiceAssistant({ onLanguageDetected, onAutoScroll }: VoiceAssistantProps) {
  const { startListening, stopListening } = useSpeech()

  const hasMountedRef      = useRef(false)   // منع التكرار
  const isProcessingRef    = useRef(false)   // منع المعالجة المتوازية
  const onAutoScrollRef    = useRef(onAutoScroll)
  const onLanguageDetRef   = useRef(onLanguageDetected)

  // تحديث refs عند تغيير الـ props بدون إعادة تشغيل
  useEffect(() => { onAutoScrollRef.current    = onAutoScroll    }, [onAutoScroll])
  useEffect(() => { onLanguageDetRef.current   = onLanguageDetected }, [onLanguageDetected])

  // --- المرحلة 2: فتح المايك بعد انتهاء الترحيب ---
  const openMicAndListen = useCallback(() => {
    startListening({
      language:    'en-US',
      maxDuration: 8000,
      onResult: async (transcript, isFinal) => {
        if (!isFinal) return
        if (isProcessingRef.current) return
        if (!transcript.trim()) return

        isProcessingRef.current = true
        stopListening()

        try {
          // اكتشاف اللغة
          const detected = detectLanguageFromSpeech(transcript)
          if (!detected) {
            isProcessingRef.current = false
            // إعادة الاستماع إذا لم تُكتشف لغة
            openMicAndListen()
            return
          }

          const langIndex = LANGUAGES.indexOf(detected)
          if (langIndex === -1) {
            isProcessingRef.current = false
            openMicAndListen()
            return
          }

          // --- المرحلة 3: Scroll إلى اللغة ---
          await onAutoScrollRef.current(langIndex)

          // --- المرحلة 4: رسالة التأكيد بلغة المستخدم ---
          const confirmText   = CONFIRMATION_MESSAGES[detected]
          const confirmBuffer = await textToSpeech(confirmText, {
            language: detected,
            voiceId:  VOICE_ID,
          })
          if (confirmBuffer) {
            await playAudio(confirmBuffer)
          }

          // إبلاغ الـ parent بالاختيار
          onLanguageDetRef.current(detected, langIndex)
        } catch {
          isProcessingRef.current = false
        }
      },
    })
  }, [startListening, stopListening])

  // --- المرحلة 1: تشغيل الترحيب فور تحميل المكوّن ---
  useEffect(() => {
    if (hasMountedRef.current) return
    hasMountedRef.current = true

    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const buffer = await textToSpeech(WELCOME_TEXT, {
        language: 'en',
        voiceId:  VOICE_ID,
      })

      if (buffer) {
        await playAudio(buffer)
      }

      openMicAndListen()
    }

    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- واجهة الأزرار ---
  const handleSpeakerClick = useCallback(() => {
    const run = async () => {
      const buffer = await textToSpeech(WELCOME_TEXT, {
        language: 'en',
        voiceId:  VOICE_ID,
      })
      if (buffer) {
        await playAudio(buffer)
      }
      openMicAndListen()
    }
    run()
  }, [openMicAndListen])

  const handleMicClick = useCallback(() => {
    openMicAndListen()
  }, [openMicAndListen])

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
      {/* زر السماعة في الأعلى */}
      <button
        onClick={handleSpeakerClick}
        className="pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: 'oklch(0.6 0.15 210)',
          boxShadow: '0 4px 16px oklch(0.4 0.1 210 / 0.4)',
        }}
        title="Play voice greeting"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      </button>

      {/* زر الميك في الأسفل */}
      <button
        onClick={handleMicClick}
        className="pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: 'oklch(0.5 0.12 25)',
          boxShadow: '0 4px 16px oklch(0.4 0.1 25 / 0.4)',
        }}
        title="Press to speak"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.77 2.36-2.26 0-4.29-.9-5.77-2.36l-1.1 1.1c1.86 1.86 4.41 3 7.07 3s5.21-1.14 7.07-3l-1.1-1.1zM19 11h-1.7c0 .58-.16 1.12-.41 1.6l1.27 1.27c.5-1.1.84-2.3.84-3.87z" />
        </svg>
      </button>
    </div>
  )
}

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
      // جلب صوت الترحيب
      const buffer = await textToSpeech(WELCOME_TEXT, {
        language: 'en',
        voiceId:  VOICE_ID,
      })

      // تشغيل الصوت
      if (buffer) {
        await playAudio(buffer)
      }

      // فتح المايك فوراً بعد انتهاء الكلام
      openMicAndListen()
    }

    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // لا واجهة مرئية - كل شيء يعمل تلقائياً في الخلفية
  return null
}

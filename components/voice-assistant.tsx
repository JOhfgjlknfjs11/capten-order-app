'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
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
  type Language,
} from '@/lib/text-to-speech'
import { LANGUAGES } from '@/lib/dictionary'

interface VoiceAssistantProps {
  onLanguageDetected: (language: Language, index: number) => void
  onAutoScroll?: (index: number) => Promise<void>
}

export function VoiceAssistant({ onLanguageDetected, onAutoScroll }: VoiceAssistantProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<'greeting' | 'listening' | 'confirming'>('greeting')
  const [debugMessage, setDebugMessage] = useState('جاري التهيئة...')
  const { isListening, transcript, startListening, stopListening } = useSpeech()
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasPlayedGreetingRef = useRef(false)

  // تشغيل الترحيب عند التحميل
  useEffect(() => {
    const playOnMount = async () => {
      if (!hasPlayedGreetingRef.current) {
        hasPlayedGreetingRef.current = true
        console.log('[v0] بدء تشغيل رسالة الترحيب الصوتية')
        setDebugMessage('تشغيل الرسالة الصوتية...')
        await playGreeting()
      }
    }
    playOnMount()
  }, []) // لا نضع startListening هنا لتجنب الحلقات

  const playGreeting = useCallback(async () => {
    try {
      console.log('[v0] Starting greeting...')
      setDebugMessage('Audio req...')
      setIsSpeaking(true)
      
      const audioBuffer = await textToSpeech(GREETING_MESSAGES.en, {
        language: 'en',
        voiceId: 'VxSsN5NGusWQZXue7VE9',
      })
      
      if (audioBuffer) {
        console.log('[v0] Audio received:', audioBuffer.byteLength)
        setDebugMessage('Playing voice greeting...')
        await playAudio(audioBuffer)
        setDebugMessage('Listening for language...')
      } else {
        console.error('[v0] No audio buffer - check ElevenLabs API key and credits')
        setDebugMessage('Error: Check ElevenLabs API key/credits')
      }
      setCurrentPhase('listening')
      startListening({ language: 'en-US' })
    } catch (error) {
      console.error('[v0] Greeting error:', error)
      setDebugMessage(`Error: ${String(error).substring(0, 20)}`)
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
      if (isProcessing) return

      setIsProcessing(true)
      try {
        // اكتشف اللغة من النص
        const detectedLanguage = detectLanguageFromSpeech(text)

        if (!detectedLanguage) {
          console.error('[v0] لم يتم اكتشاف لغة')
          setIsProcessing(false)
          return
        }

        const languageIndex = LANGUAGES.indexOf(detectedLanguage)
        if (languageIndex === -1) {
          console.error('[v0] لغة غير معروفة:', detectedLanguage)
          setIsProcessing(false)
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
          voiceId: 'VxSsN5NGusWQZXue7VE9',
        })
        if (confirmAudioBuffer) {
          console.log('[v0] تشغيل رسالة التأكيد بـ', detectedLanguage)
          await playAudio(confirmAudioBuffer)
        }

        // أبلغ عن اللغة المكتشفة
        onLanguageDetected(detectedLanguage, languageIndex)
      } catch (error) {
        console.error('[v0] خطأ في معالجة الكلام:', error)
      } finally {
        setIsProcessing(false)
        stopListening()
      }
    },
    [isProcessing, onLanguageDetected, onAutoScroll, stopListening]
  )

  const handleManualRetry = useCallback(() => {
    setCurrentPhase('listening')
    startListening({ language: 'en-US' })
  }, [startListening])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* رسالة status */}
      <div className={`px-3 py-2 rounded-lg text-xs max-w-xs font-medium ${
        debugMessage.includes('Error') 
          ? 'bg-red-500/30 text-red-700'
          : 'bg-yellow-500/30 text-yellow-700'
      }`}>
        {debugMessage}
      </div>

      {/* مؤشرات الحالة */}
      <div className="flex items-center gap-3">
      {/* مؤشر الحالة */}
      {isListening && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-sm">
          <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-xs text-blue-700 font-medium">جاري الاستماع...</span>
        </div>
      )}

      {isSpeaking && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm">
          <Volume2 className="w-4 h-4 text-green-600 animate-pulse" />
          <span className="text-xs text-green-700 font-medium">جاري النطق...</span>
        </div>
      )}

      {isProcessing && !isListening && !isSpeaking && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 backdrop-blur-sm">
          <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-xs text-purple-700 font-medium">جاري المعالجة...</span>
        </div>
      )}

      {/* زر إعادة محاولة يدوية */}
      {!isListening && !isSpeaking && !isProcessing && currentPhase === 'listening' && (
        <button
          onClick={handleManualRetry}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
          style={{
            background: 'oklch(0.42 0.09 210)',
            boxShadow: '4px 4px 10px oklch(0.84 0.012 80)',
          }}
          title="إعادة محاولة"
        >
          <Mic className="w-5 h-5 text-white" />
        </button>
      )}
      </div>
    </div>
  )
}

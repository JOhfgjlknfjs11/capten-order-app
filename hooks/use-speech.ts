'use client'

import { useCallback, useState, useRef, useEffect } from 'react'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  isFinal: boolean
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export interface UseSpeechOptions {
  language?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  maxDuration?: number
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)

    if (SpeechRecognitionAPI && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionAPI()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
    }
  }, [])

  const startListening = useCallback(
    (options: UseSpeechOptions = {}) => {
      if (!recognitionRef.current) {
        setError('Speech Recognition غير متاح في متصفحك')
        return
      }

      setTranscript('')
      setError(null)
      setIsListening(true)

      recognitionRef.current.language = options.language || 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.results.length - 1; i >= 0; i--) {
          const transcript = event.results[i][0].transcript
          const confidence = event.results[i][0].confidence

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        const currentTranscript = finalTranscript || interimTranscript
        setTranscript(currentTranscript)

        if (options.onResult) {
          options.onResult(currentTranscript, event.results[event.results.length - 1].isFinal)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        const errorMessage = `خطأ في التعرف الصوتي: ${event.error}`
        setError(errorMessage)
        if (options.onError) {
          options.onError(event.error)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }

      recognitionRef.current.start()

      // توقف تلقائي بعد المدة المحددة
      const maxDuration = options.maxDuration || 8000
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }, maxDuration)
    },
    []
  )

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsListening(false)
  }, [])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  }
}

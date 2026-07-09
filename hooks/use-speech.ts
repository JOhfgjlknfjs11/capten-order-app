'use client'

import { useCallback, useState, useRef, useEffect } from 'react'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export interface UseSpeechOptions {
  language?: string
  maxDuration?: number
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onResultRef = useRef<((t: string, f: boolean) => void) | undefined>(undefined)

  // تهيئة SpeechRecognition مرة واحدة
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setError('SpeechRecognition not available')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t + ' '
        } else {
          interimTranscript += t
        }
      }

      const current = (finalTranscript || interimTranscript).trim()
      setTranscript(current)

      const isFinal = event.results[event.results.length - 1].isFinal
      if (onResultRef.current) {
        onResultRef.current(current, isFinal)
      }
    }

    recognition.onerror = (event: any) => {
      // تجاهل no-speech - طبيعي عندما يكون هناك صمت
      if (event.error === 'no-speech') return
      setError(event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    recognitionRef.current = recognition
  }, [])

  const startListening = useCallback((options: UseSpeechOptions = {}) => {
    const recognition = recognitionRef.current
    if (!recognition) {
      setError('Speech Recognition not available')
      return
    }

    try { recognition.abort() } catch {}

    setTranscript('')
    setError(null)
    onResultRef.current = options.onResult
    recognition.lang = options.language || 'en-US'

    // SpeechRecognition نفسها توكل طلب أذن المايك عند start()
    // لا نطلب getUserMedia - يسبب تضارباً
    try {
      recognition.start()

      const maxDuration = options.maxDuration || 8000
      timeoutRef.current = setTimeout(() => {
        try { recognition.stop() } catch {}
      }, maxDuration)
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    try { recognitionRef.current?.stop() } catch {}
    setIsListening(false)
  }, [])

  return { isListening, transcript, error, startListening, stopListening }
}

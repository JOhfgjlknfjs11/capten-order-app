'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useSpeech } from '@/hooks/use-speech'
import { detectLanguageFromSpeech, getSpeechLanguageCode } from '@/lib/language-detection'
import { type Language } from '@/lib/dictionary'

interface MicrophoneButtonProps {
  onLanguageDetected?: (language: Language) => void
  autoStart?: boolean
  disabled?: boolean
}

export function MicrophoneButton({
  onLanguageDetected,
  autoStart = false,
  disabled = false,
}: MicrophoneButtonProps) {
  const { isListening, transcript, error, startListening, stopListening } = useSpeech()
  const [autoStarted, setAutoStarted] = useState(false)
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-start listening when component mounts if autoStart is true
  useEffect(() => {
    if (autoStart && !autoStarted && !disabled) {
      setAutoStarted(true)
      startListening({ maxDuration: 10000 })
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [autoStart, autoStarted, disabled, startListening])

  // Detect language when transcript is available
  useEffect(() => {
    if (transcript && transcript.trim().length > 0 && !isListening) {
      const detected = detectLanguageFromSpeech(transcript)
      if (detected) {
        setDetectedLanguage(detected)
        onLanguageDetected?.(detected)
      }
    }
  }, [transcript, isListening, onLanguageDetected])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      setDetectedLanguage(null)
      startListening({ maxDuration: 10000 })
    }
  }

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50">
      <AnimatePresence mode="wait">
        {/* Listening indicator */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-3"
          >
            <div className="bg-warning text-warning-foreground rounded-lg p-3 text-sm max-w-xs">
              <div className="flex items-center gap-2 mb-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">Listening...</span>
              </div>
              {transcript && (
                <div className="text-warning-foreground/80 text-xs mt-1 break-words">
                  "{transcript}"
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Detected language indicator */}
        {detectedLanguage && !isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-3"
          >
            <div className="bg-success text-success-foreground rounded-lg p-3 text-sm max-w-xs">
              <div className="font-medium">Language Detected!</div>
              <div className="text-success-foreground/80 text-xs mt-1">
                {detectedLanguage.toUpperCase()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Error indicator */}
        {error && !isListening && error !== 'no-speech' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-3"
          >
            <div className="bg-destructive text-destructive-foreground rounded-lg p-3 text-sm max-w-xs">
              <div className="font-medium">Error</div>
              <div className="text-destructive-foreground/80 text-xs mt-1">{error}</div>
            </div>
          </motion.div>
        )}

        {/* Microphone button */}
        <motion.button
          onClick={handleMicClick}
          disabled={disabled}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center font-semibold shadow-lg transition-all duration-300 ${
            isListening
              ? 'bg-warning text-warning-foreground ring-4 ring-warning/30'
              : detectedLanguage
                ? 'bg-success text-success-foreground ring-2 ring-success/30'
                : disabled
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  : 'bg-primary text-primary-foreground hover:shadow-xl'
          }`}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Mic className="w-6 h-6 animate-pulse" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <MicOff className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring when listening */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-warning"
                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-warning"
                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </motion.button>
      </AnimatePresence>
    </div>
  )
}

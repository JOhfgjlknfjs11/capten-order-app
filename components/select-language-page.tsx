'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { type Language, LANGUAGES, dictionary } from '@/lib/dictionary'
import { TalkingAvatar } from '@/components/talking-avatar'
import { playWithAmplitude, simulateSpeech } from '@/lib/audio-playback'
import { textToSpeech } from '@/lib/text-to-speech'
import { GREETING_MESSAGES } from '@/lib/text-to-speech'
import { MicrophoneButton } from '@/components/microphone-button'

interface SelectLanguagePageProps {
  onSelect: (lang: Language) => void
  language?: Language
}

// Map language code → ISO 3166-1 alpha-2 country code for flags
const FLAG_CODE: Record<Language, string> = {
  en: 'gb',
  ar: 'eg',
  ru: 'ru',
  fr: 'fr',
  de: 'de',
  it: 'it',
  es: 'es',
  zh: 'cn',
  ja: 'jp',
  pt: 'pt',
  tr: 'tr',
  ko: 'kr',
}

function FlagImg({ lang, size = 32 }: { lang: Language; size?: number }) {
  const code = FLAG_CODE[lang]
  return (
    <Image
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={dictionary[lang].langName}
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-sm object-cover"
      style={{ display: 'block' }}
      unoptimized
    />
  )
}

export function SelectLanguagePage({ onSelect, language = 'en' }: SelectLanguagePageProps) {
  const [amplitude, setAmplitude] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [selectedLang, setSelectedLang] = useState<Language | null>(null)
  const [showMicrophone, setShowMicrophone] = useState(false)
  const playbackHandleRef = useRef<any>(null)
  const hasPlayedGreetingRef = useRef(false)
  const microphoneKeyRef = useRef(0) // Key to force remount/restart of microphone

  // Play greeting when component mounts
  useEffect(() => {
    if (hasPlayedGreetingRef.current) return
    hasPlayedGreetingRef.current = true

    const playGreeting = async () => {
      setSpeaking(true)
      const greetingText = GREETING_MESSAGES[language]

      try {
        const buffer = await textToSpeech(greetingText, {
          language,
          voiceId: 'wWWn96OtTHu1sn8SRGEr',
        })

        if (buffer) {
          const handle = playWithAmplitude(buffer, setAmplitude)
          playbackHandleRef.current = handle
          await handle.finished
        } else {
          // Fallback to simulated speech if audio generation fails
          const handle = simulateSpeech(greetingText, setAmplitude)
          playbackHandleRef.current = handle
          await handle.finished
        }
      } catch (error) {
        console.error('[v0] Error playing greeting:', error)
      } finally {
        setSpeaking(false)
        setAmplitude(0)
        // Show microphone after greeting finishes
        setShowMicrophone(true)
      }
    }

    playGreeting()
  }, [language])

  const handleLanguageDetected = useCallback(
    (detectedLang: Language) => {
      if (selectedLang === null) {
        handleLanguageClick(detectedLang)
      }
    },
    [selectedLang]
  )

  const handleLanguageClick = useCallback(
    (lang: Language) => {
      // Stop any currently playing audio
      if (playbackHandleRef.current?.stop) {
        playbackHandleRef.current.stop()
      }

      setSelectedLang(lang)
      setSpeaking(true)

      const speakConfirmation = async () => {
        // Speak the confirmation in the selected language
        const confirmationText = `You have selected ${dictionary[lang].langName}`

        try {
          const buffer = await textToSpeech(confirmationText, {
            language: lang,
            voiceId: 'wWWn96OtTHu1sn8SRGEr',
          })

          if (buffer) {
            const handle = playWithAmplitude(buffer, setAmplitude)
            playbackHandleRef.current = handle
            await handle.finished
          } else {
            const handle = simulateSpeech(confirmationText, setAmplitude)
            playbackHandleRef.current = handle
            await handle.finished
          }
        } catch (error) {
          console.error('[v0] Error speaking confirmation:', error)
        } finally {
          setSpeaking(false)
          setAmplitude(0)
          // Proceed with selection after a small delay
          setTimeout(() => onSelect(lang), 300)
        }
      }

      speakConfirmation()
    },
    [onSelect]
  )

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.84 0.012 80 / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.84 0.012 80 / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Avatar Section */}
        <motion.div
          className="flex justify-center mb-8 sm:mb-12"
          animate={{ scale: speaking ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <TalkingAvatar
            amplitude={amplitude}
            speaking={speaking}
            size={280}
            src="/avatar.png"
          />
        </motion.div>

        {/* Title and Instructions */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Select Your Language
          </h1>
          <p className="text-lg text-foreground/70">
            {speaking ? 'Listen to the greeting...' : 'Click a language to begin'}
          </p>
        </motion.div>

        {/* Language Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence>
            {LANGUAGES.map((lang, idx) => (
              <motion.button
                key={lang}
                onClick={() => handleLanguageClick(lang)}
                disabled={speaking}
                className="relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx }}
              >
                {/* Background card */}
                <div
                  className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer
                    ${
                      selectedLang === lang
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                        : 'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground border border-border'
                    }
                    ${speaking ? 'opacity-50' : 'opacity-100'}
                  `}
                >
                  {/* Flag and language name */}
                  <div className="flex items-center justify-center mb-2">
                    <FlagImg lang={lang} size={36} />
                  </div>
                  <div className="font-semibold text-sm sm:text-base truncate">
                    {dictionary[lang].langNative}
                  </div>
                </div>

                {/* Selection ring animation */}
                {selectedLang === lang && (
                  <motion.div
                    className="absolute inset-0 rounded-xl sm:rounded-2xl"
                    layoutId="selectedLang"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      boxShadow: '0 0 20px rgba(var(--primary) / 0.4)',
                    }}
                  />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className="mt-8 sm:mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {selectedLang ? (
            <div className="flex items-center justify-center gap-2 text-success">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm">Language confirmed: {dictionary[selectedLang].langName}</span>
            </div>
          ) : speaking ? (
            <div className="flex items-center justify-center gap-2 text-info">
              <div className="w-2 h-2 rounded-full bg-info animate-pulse" />
              <span className="text-sm">Avatar is speaking...</span>
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* Microphone Button - Auto-starts when greeting finishes */}
      {showMicrophone && (
        <MicrophoneButton
          key={microphoneKeyRef.current}
          onLanguageDetected={handleLanguageDetected}
          autoStart={true}
          disabled={speaking || selectedLang !== null}
        />
      )}
    </div>
  )
}

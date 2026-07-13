'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { type Language, LANGUAGES, dictionary } from '@/lib/dictionary'
import { TalkingAvatar } from '@/components/talking-avatar'
<<<<<<< HEAD
import { playWithAmplitude, simulateSpeech } from '@/lib/audio-playback'
import { textToSpeech } from '@/lib/text-to-speech'
=======
import {
  playWithAmplitude,
  simulateSpeech,
  type AmplitudePlaybackHandle,
} from '@/lib/audio-playback'
>>>>>>> origin/main
import { GREETING_MESSAGES } from '@/lib/text-to-speech'
import { translateAndSpeak } from '@/hooks/use-translate-and-speak'
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

// Map language → BCP-47 tag for the browser speech fallback
const BROWSER_LANG: Record<Language, string> = {
  en: 'en-US',
  ar: 'ar-SA',
  ru: 'ru-RU',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  es: 'es-ES',
  zh: 'zh-CN',
  ja: 'ja-JP',
  pt: 'pt-BR',
  tr: 'tr-TR',
  ko: 'ko-KR',
}

// رسالة تأكيد الاختيار — منطوقة بنفس اللغة التي اختارها الضيف
const CONFIRM_MESSAGES: Record<Language, string> = {
  en: "Perfect! You've selected English. Let's get started.",
  ar: 'ممتاز! لقد اخترت العربية. لنبدأ.',
  ru: 'Отлично! Вы выбрали русский. Начнём.',
  fr: 'Parfait ! Vous avez choisi le français. Commençons.',
  de: 'Perfekt! Sie haben Deutsch gewählt. Fangen wir an.',
  it: 'Perfetto! Hai scelto l\'italiano. Iniziamo.',
  es: '¡Perfecto! Has elegido español. Empecemos.',
  zh: '太好了！您选择了中文。我们开始吧。',
  ja: '素晴らしい！日本語を選びました。始めましょう。',
  pt: 'Perfeito! Você escolheu português. Vamos começar.',
  tr: 'Harika! Türkçeyi seçtiniz. Başlayalım.',
  ko: '완벽해요! 한국어를 선택하셨습니다. 시작할까요.',
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
  const playbackHandleRef = useRef<AmplitudePlaybackHandle | null>(null)
  const hasPlayedGreetingRef = useRef(false)
  const microphoneKeyRef = useRef(0)
  // معرّف الجلسة الحالية لإبطال أي طلب صوت سابق
  const sessionRef = useRef(0)

  // إيقاف أي صوت/حركة جارية
  const stopPlayback = useCallback(() => {
    sessionRef.current++
    playbackHandleRef.current?.stop()
    playbackHandleRef.current = null
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {}
    }
  }, [])

  // نطق نص عبر صوت المتصفح (احتياطي) — يُرجع Promise ينتهي مع انتهاء الكلام
  const speakWithBrowser = useCallback((text: string, lang: Language) => {
    return new Promise<void>((resolve) => {
      const synth =
        typeof window !== 'undefined' && 'speechSynthesis' in window
          ? window.speechSynthesis
          : null

      // بدون دعم النطق: حركة فم تقديرية فقط
      if (!synth) {
        const handle = simulateSpeech(text, setAmplitude)
        playbackHandleRef.current = handle
        handle.finished.then(() => resolve())
        return
      }

      try {
        synth.cancel()
      } catch {}

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = BROWSER_LANG[lang] || 'en-US'
      utterance.rate = 0.95
      utterance.pitch = 1
      const voices = synth.getVoices()
      const match = voices.find((v) =>
        v.lang?.toLowerCase().startsWith((BROWSER_LANG[lang] || 'en').slice(0, 2))
      )
      if (match) utterance.voice = match

      // حركة الفم أثناء الكلام
      const handle = simulateSpeech(text, setAmplitude)
      playbackHandleRef.current = handle

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      try {
        synth.speak(utterance)
      } catch {
        resolve()
      }
    })
  }, [])

  // نطق نص عبر ElevenLabs بنفس اللغة، مع رجوع لصوت المتصفح عند الفشل
  const speak = useCallback(
    async (text: string, lang: Language) => {
      const session = ++sessionRef.current
      playbackHandleRef.current?.stop()
      playbackHandleRef.current = null

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language: lang }),
        })
        if (!res.ok) throw new Error(`TTS failed: ${res.status}`)

        const buffer = await res.arrayBuffer()
        // تم بدء جلسة أحدث أثناء الجلب → تجاهل
        if (session !== sessionRef.current) return

        const handle = playWithAmplitude(buffer, setAmplitude)
        playbackHandleRef.current = handle
        await handle.finished
      } catch (error) {
        console.error('[v0] ElevenLabs voice failed, using browser voice:', error)
        if (session !== sessionRef.current) return
        await speakWithBrowser(text, lang)
      }
    },
    [speakWithBrowser]
  )

  // تشغيل ترحيب اللغة عند التحميل (بنفس لغة التطبيق الحالية)
  useEffect(() => {
    if (hasPlayedGreetingRef.current) return
    hasPlayedGreetingRef.current = true

    let cancelled = false
    const run = async () => {
      setSpeaking(true)
      await speak(GREETING_MESSAGES[language], language)
      if (cancelled) return
      setSpeaking(false)
      setAmplitude(0)
      setShowMicrophone(true)
    }
    run()

<<<<<<< HEAD
      try {
        // Use translateAndSpeak to translate and speak in the selected language
        const buffer = await translateAndSpeak(greetingText, language, 'wWWn96OtTHu1sn8SRGEr')

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
=======
    return () => {
      cancelled = true
      stopPlayback()
    }
  }, [language, speak, stopPlayback])

  const handleLanguageClick = useCallback(
    (lang: Language) => {
      // إيقاف أي صوت جارٍ
      stopPlayback()

      setSelectedLang(lang)
      setSpeaking(true)

      const run = async () => {
        // نطق التأكيد بنفس اللغة المختارة
        await speak(CONFIRM_MESSAGES[lang] || CONFIRM_MESSAGES.en, lang)
>>>>>>> origin/main
        setSpeaking(false)
        setAmplitude(0)
        // المتابعة بعد انتهاء النطق
        setTimeout(() => onSelect(lang), 300)
      }
      run()
    },
    [onSelect, speak, stopPlayback]
  )

  const handleLanguageDetected = useCallback(
    (detectedLang: Language) => {
      if (selectedLang === null) {
        handleLanguageClick(detectedLang)
      }
    },
<<<<<<< HEAD
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
        // Speak the confirmation in the selected language using translation
        const confirmationText = `You have selected ${dictionary[lang].langName}`

        try {
          // Use translateAndSpeak to translate and speak in the selected language
          const buffer = await translateAndSpeak(confirmationText, lang, 'wWWn96OtTHu1sn8SRGEr')

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
=======
    [selectedLang, handleLanguageClick]
>>>>>>> origin/main
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

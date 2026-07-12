'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TalkingAvatar } from '@/components/talking-avatar'
import { textToSpeech } from '@/lib/text-to-speech'
import {
  playWithAmplitude,
  simulateSpeech,
  type AmplitudePlaybackHandle,
} from '@/lib/audio-playback'

interface HomeScreenProps {
  onStart: () => void
}

// رسالة ترحيب إنجليزية دافئة يقولها الأفاتار عند فتح الصفحة الرئيسية
const HOME_GREETING =
  "Hello and welcome to Capten Order! I'm your personal dining host. Let's get you seated and ready to explore our finest Red Sea flavors. Tap Start when you're ready."

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [amplitude, setAmplitude] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [ready, setReady] = useState(false)
  const [showCaption, setShowCaption] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const playbackRef = useRef<AmplitudePlaybackHandle | null>(null)
  const hasGreetedRef = useRef(false)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopSpeaking = useCallback(() => {
    playbackRef.current?.stop()
    playbackRef.current = null
    setSpeaking(false)
    setAmplitude(0)
    setShowCaption(false)
  }, [])

  const greet = useCallback(async () => {
    stopSpeaking()
    setSpeaking(true)
    setShowCaption(true)
    try {
      // Use Web Speech API for built-in browser text-to-speech (no API keys needed)
      const utterance = new SpeechSynthesisUtterance(HOME_GREETING)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      utterance.pitch = 1
      
      // Animate amplitude while speaking
      const handle = simulateSpeech(HOME_GREETING, setAmplitude)
      playbackRef.current = handle
      
      // Speak using Web Speech API
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      
      // Wait for speech to finish or timeout
      await Promise.race([
        new Promise<void>((resolve) => {
          utterance.onend = () => resolve()
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 8000)), // 8 second timeout
      ])
    } catch (error) {
      console.error('[v0] Error in greeting:', error)
      // Fallback: just animate without audio
      const handle = simulateSpeech(HOME_GREETING, setAmplitude)
      playbackRef.current = handle
      await handle.finished
    } finally {
      setSpeaking(false)
      setAmplitude(0)
      setShowCaption(false)
      setReady(true)
    }
  }, [stopSpeaking])

  // تشغيل الترحيب مرة واحدة عند التحميل
  useEffect(() => {
    if (hasGreetedRef.current) return
    hasGreetedRef.current = true
    // تأخير بسيط للسماح بظهور الواجهة أولاً
    const t = setTimeout(() => {
      greet()
    }, 700)
    return () => {
      clearTimeout(t)
      stopSpeaking()
    }
  }, [greet, stopSpeaking])

  const handleStart = useCallback(() => {
    // Stop countdown if it's running
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(null)
    stopSpeaking()
    onStart()
  }, [onStart, stopSpeaking])

  // Start countdown when greeting finishes (ready becomes true)
  useEffect(() => {
    if (ready && countdown === null) {
      // Wait 1 second after ready to ensure audio fully finishes playing
      const timer = setTimeout(() => {
        setCountdown(3)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [ready, countdown])

  // Countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null
          const next = prev - 1
          if (next === 0) {
            // Auto-click Start button when countdown reaches 0
            setTimeout(() => {
              handleStart()
            }, 300)
          }
          return next > 0 ? next : null
        })
      }, 1000)
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [countdown, handleStart])

  const handleReplay = useCallback(() => {
    if (speaking) {
      stopSpeaking()
    } else {
      greet()
    }
  }, [speaking, stopSpeaking, greet])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* خلفية متدرجة هادئة */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, oklch(0.6 0.15 210 / 0.10) 0%, transparent 60%)',
        }}
      />

      {/* شارة "مباشر" لإحساس مكالمة الفيديو */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8 flex items-center gap-2 rounded-full px-4 py-1.5"
        style={{
          background: 'oklch(0.99 0.004 85)',
          boxShadow:
            '4px 4px 12px oklch(0.84 0.012 80), -3px -3px 10px oklch(1 0.003 90)',
        }}
      >
        <motion.span
          className="w-2 h-2 rounded-full"
          style={{ background: 'oklch(0.55 0.2 25)' }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
        <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
          Live Host
        </span>
      </motion.div>

      {/* الأفاتار المتكلم */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10"
      >
        <TalkingAvatar amplitude={amplitude} speaking={speaking} size={260} />
      </motion.div>

      {/* شريط الترجمة الحية أسفل الأفاتار (إحساس مكالمة الفيديو) */}
      {showCaption && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="relative z-10 mt-6 max-w-md rounded-2xl px-5 py-3 text-center"
          style={{
            background: 'oklch(0.99 0.004 85)',
            boxShadow:
              '4px 4px 14px oklch(0.84 0.012 80), -3px -3px 10px oklch(1 0.003 90)',
          }}
        >
          <p className="font-body text-sm text-foreground leading-relaxed text-pretty">
            {HOME_GREETING}
          </p>
        </motion.div>
      )}

      {/* النص الترحيبي */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="relative z-10 mt-10 text-center max-w-md"
      >
        <p className="font-body text-sm tracking-[0.25em] uppercase text-muted-foreground mb-3">
          Welcome to
        </p>
        <h1
          className="font-sans text-5xl md:text-6xl font-bold text-foreground mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          Capten Order
        </h1>
        <p className="font-body text-base text-muted-foreground leading-relaxed text-pretty">
          Your personal dining host is here to guide you through a luxury Red Sea
          experience.
        </p>
      </motion.div>

      {/* عداد تنازلي - يظهر في الوسط أثناء العد */}
      {countdown !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="text-9xl md:text-[200px] font-bold" style={{ color: 'oklch(0.42 0.09 210 / 0.3)' }}>
            {countdown}
          </div>
        </motion.div>
      )}

      {/* الأزرار */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="relative z-10 mt-10 flex items-center gap-4"
      >
        <button
          onClick={handleStart}
          className="rounded-2xl px-10 py-4 font-sans text-lg font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'oklch(0.42 0.09 210)',
            boxShadow: '0 8px 24px oklch(0.42 0.09 210 / 0.4)',
          }}
        >
          Start
        </button>

        {/* زر إعادة/إيقاف الصوت */}
        <button
          onClick={handleReplay}
          aria-label={speaking ? 'Stop voice' : 'Replay voice'}
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'oklch(0.99 0.004 85)',
            boxShadow:
              '4px 4px 12px oklch(0.84 0.012 80), -3px -3px 10px oklch(1 0.003 90)',
          }}
        >
          {speaking ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="oklch(0.42 0.09 210)" strokeWidth="2">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="oklch(0.42 0.09 210)" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </motion.div>

      {/* مؤشر الحالة */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 mt-6 text-xs text-muted-foreground h-4"
      >
        {speaking ? 'Speaking…' : ready ? 'Tap Start to choose your language' : ''}
      </motion.p>
    </div>
  )
}

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
  const [audioBlocked, setAudioBlocked] = useState(false)

  const playbackRef = useRef<AmplitudePlaybackHandle | null>(null)
  const bufferPromiseRef = useRef<Promise<ArrayBuffer | null> | null>(null)
  const removeUnlockRef = useRef<() => void>(() => {})
  const hasGreetedRef = useRef(false)

  // تجهيز الصوت مسبقاً (مرة واحدة) حتى يكون التشغيل فورياً
  const getBuffer = useCallback(() => {
    if (!bufferPromiseRef.current) {
      bufferPromiseRef.current = textToSpeech(HOME_GREETING, {
        language: 'en',
      }).catch(() => null)
    }
    return bufferPromiseRef.current
  }, [])

  const clearUnlock = useCallback(() => {
    removeUnlockRef.current()
    removeUnlockRef.current = () => {}
  }, [])

  const stopSpeaking = useCallback(() => {
    playbackRef.current?.stop()
    playbackRef.current = null
    setSpeaking(false)
    setAmplitude(0)
    setShowCaption(false)
  }, [])

  const greet = useCallback(async () => {
    playbackRef.current?.stop()
    playbackRef.current = null
    setSpeaking(true)
    setShowCaption(true)

    const buffer = await getBuffer()

    // لا يوجد صوت متاح إطلاقاً → حركة بصرية فقط
    if (!buffer) {
      const sim = simulateSpeech(HOME_GREETING, setAmplitude)
      playbackRef.current = sim
      await sim.finished
      setSpeaking(false)
      setAmplitude(0)
      setShowCaption(false)
      setReady(true)
      return
    }

    // نمرّر نسخة حتى لا يُفصل (detach) الـ buffer الأصلي فيمكن إعادة استخدامه
    const handle = playWithAmplitude(buffer.slice(0), setAmplitude)
    playbackRef.current = handle

    const started = await handle.started

    // منع المتصفح التشغيل التلقائي → نعرض حركة بصرية ونشغّل الصوت عند أول لمسة
    if (!started) {
      handle.stop()
      setAudioBlocked(true)

      const sim = simulateSpeech(HOME_GREETING, setAmplitude)
      playbackRef.current = sim

      // أول تفاعل من المستخدم يشغّل الصوت الحقيقي متزامناً مع الحركة
      const unlock = () => {
        clearUnlock()
        setAudioBlocked(false)
        greet()
      }
      const opts: AddEventListenerOptions = { once: true }
      window.addEventListener('pointerdown', unlock, opts)
      window.addEventListener('keydown', unlock, opts)
      removeUnlockRef.current = () => {
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('keydown', unlock)
      }

      await sim.finished
      setSpeaking(false)
      setAmplitude(0)
      setShowCaption(false)
      setReady(true)
      return
    }

    // الصوت يعمل → الحركة متزامنة معه تلقائياً عبر تحليل مستوى الصوت
    setAudioBlocked(false)
    await handle.finished
    setSpeaking(false)
    setAmplitude(0)
    setShowCaption(false)
    setReady(true)
  }, [getBuffer, clearUnlock])

  // تشغيل الترحيب مرة واحدة فور تحميل الصفحة
  useEffect(() => {
    if (hasGreetedRef.current) return
    hasGreetedRef.current = true
    // نبدأ التجهيز فوراً ثم نشغّل بعد لحظة قصيرة لظهور الواجهة
    getBuffer()
    const t = setTimeout(() => {
      greet()
    }, 300)
    return () => {
      clearTimeout(t)
      clearUnlock()
      playbackRef.current?.stop()
    }
  }, [greet, getBuffer, clearUnlock])

  const handleStart = useCallback(() => {
    clearUnlock()
    stopSpeaking()
    onStart()
  }, [onStart, stopSpeaking, clearUnlock])

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

      {/* تلميح تشغيل الصوت عند منع التشغيل التلقائي */}
      {audioBlocked && (
        <motion.button
          onClick={handleReplay}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-4 flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: 'oklch(0.42 0.09 210)',
            boxShadow: '0 6px 18px oklch(0.42 0.09 210 / 0.35)',
          }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          <span className="text-sm font-medium text-white">
            Tap anywhere to hear your host
          </span>
        </motion.button>
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

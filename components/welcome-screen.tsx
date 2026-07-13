'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { type Language, dictionary } from '@/lib/dictionary'
import { textToSpeech } from '@/lib/text-to-speech'
import { playWithAmplitude } from '@/lib/audio-playback'
import { TalkingAvatar } from './talking-avatar'

interface WelcomeScreenProps {
  language: Language
  onComplete: () => void
}

export function WelcomeScreen({ language, onComplete }: WelcomeScreenProps) {
  const dict = dictionary[language]
  const [amplitude, setAmplitude] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const audioHandleRef = useRef<{ stop: () => void } | null>(null)
  const hasPlayedRef = useRef(false)

  // Welcome messages in multiple languages
  const WELCOME_MESSAGES: Record<Language, string> = {
    en: "Hello and welcome to Capten Order! I'm your personal dining host. Let's get you seated and ready to explore our finest flavors. Tap Start when you're ready.",
    ar: 'أهلاً وسهلاً بك في كبتن أوردر! أنا مضيفك الشخصي. دعنا نجهزك للجلوس واستكشاف أفضل نكهاتنا. اضغط على ابدأ عندما تكون مستعداً.',
    ru: 'Добро пожаловать в Capten Order! Я ваш личный хост. Давайте подготовим вас к лучшему опыту. Нажмите Начать, когда вы готовы.',
    fr: 'Bienvenue chez Capten Order! Je suis votre hôte personnel. Préparons-vous pour explorer nos meilleures saveurs. Cliquez sur Démarrer quand vous êtes prêt.',
    de: 'Willkommen bei Capten Order! Ich bin Ihr persönlicher Host. Lassen Sie uns Sie vorbereiten. Klicken Sie auf Start, wenn Sie bereit sind.',
    it: 'Benvenuto a Capten Order! Sono il tuo host personale. Preparati per un&apos;esperienza straordinaria. Fai clic su Inizia quando sei pronto.',
    es: '¡Bienvenido a Capten Order! Soy tu anfitrión personal. Prepárate para explorar nuestros mejores sabores. Haz clic en Comenzar cuando estés listo.',
    zh: '欢迎来到Capten Order! 我是你的个人主持人。让我们准备好享受最好的风味。准备好时点击开始。',
    ja: 'Capten Orderへようこそ！私はあなたの個人的なホストです。最高の体験のために準備しましょう。準備ができたら開始をクリックしてください。',
    pt: 'Bem-vindo ao Capten Order! Sou seu anfitrião pessoal. Vamos preparar você para os melhores sabores. Clique em Iniciar quando estiver pronto.',
    tr: 'Capten Order&apos;a hoş geldiniz! Ben sizin kişisel misafir editörünüzüm. En iyi tatları keşfetmeye hazırlanalım. Hazır olduğunuzda Başla&apos;yı tıklayın.',
    ko: 'Capten Order에 오신 것을 환영합니다! 저는 당신의 개인 호스트입니다. 최고의 경험을 준비합시다. 준비가 되면 시작을 클릭하세요.',
  }

  // العداد التنازلي
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [countdown])

  // النقر التلقائي عند انتهاء العداد
  useEffect(() => {
    if (countdown === 0) {
      onComplete()
    }
  }, [countdown, onComplete])

  // تشغيل الصوت والعداد
  useEffect(() => {
    if (hasPlayedRef.current) return
    hasPlayedRef.current = true

    let cancelled = false

    const run = async () => {
      try {
        const welcomeText = WELCOME_MESSAGES[language]

        // جلب الصوت من ElevenLabs
        const audioBuffer = await textToSpeech(welcomeText, {
          language,
          voiceId: 'hpp4J3VqNfWAUOO0d1Us',
        })

        if (cancelled) return

        if (audioBuffer) {
          setSpeaking(true)

          // playWithAmplitude تُحرّك الفم وتنتظر انتهاء الصوت الفعلي
          const handle = playWithAmplitude(audioBuffer, (level) => {
            setAmplitude(level)
          })
          audioHandleRef.current = handle as unknown as { stop: () => void }

          // انتظر انتهاء الصوت الحقيقي
          await handle.finished
        } else {
          // فشل جلب الصوت - انتظر بقدر وقت قراءة الرسالة تقريباً
          const readingTimeMs = (WELCOME_MESSAGES[language].length / 12) * 1000
          await new Promise(resolve => setTimeout(resolve, Math.min(readingTimeMs, 8000)))
        }
      } catch {
        // عند أي خطأ - انتظر بقدر وقت قراءة الرسالة
        const readingTimeMs = (WELCOME_MESSAGES[language].length / 12) * 1000
        await new Promise(resolve => setTimeout(resolve, Math.min(readingTimeMs, 8000)))
      }

      if (cancelled) return
      setSpeaking(false)
      setAmplitude(0)
      // بدء العداد التنازلي 3 ثواني فور انتهاء الصوت
      setCountdown(3)
    }

    run()

    return () => {
      cancelled = true
      audioHandleRef.current?.stop()
    }
  }, [language])

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.42 0.09 210 / 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.75 0.14 78 / 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -15, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div
        className={`relative z-10 flex flex-col items-center px-8 ${dict.rtl ? 'rtl' : 'ltr'}`}
        dir={dict.rtl ? 'rtl' : 'ltr'}
      >
        {/* Talking Avatar - positioned above all text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-12"
        >
          <TalkingAvatar amplitude={amplitude} speaking={speaking} size={200} />
        </motion.div>

        <div className="text-center max-w-lg">
        {/* Anchor ornament */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex justify-center mb-6"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: 'oklch(0.99 0.004 85)',
              boxShadow:
                '8px 8px 20px oklch(0.84 0.012 80), -4px -4px 12px oklch(1 0.003 90)',
            }}
          >
            ⚓
          </div>
        </motion.div>

        {/* Welcome text */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="font-body text-sm tracking-[0.25em] uppercase text-muted-foreground mb-3"
        >
          {dict.welcomeTo}
        </motion.p>

        {/* Restaurant name */}
        <motion.h1
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="font-sans text-6xl md:text-7xl font-bold text-foreground mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          {dict.restaurantName}
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div
            className="h-px flex-1 max-w-16"
            style={{ background: 'oklch(0.75 0.14 78)' }}
          />
          <span className="text-lg" style={{ color: 'oklch(0.75 0.14 78)' }}>
            ✦
          </span>
          <div
            className="h-px flex-1 max-w-16"
            style={{ background: 'oklch(0.75 0.14 78)' }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="font-body text-base text-muted-foreground tracking-wide"
        >
          {dict.tagline}
        </motion.p>

        {/* Language flag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="mt-6 flex justify-center"
        >
          <span className="text-3xl">{dict.flag}</span>
        </motion.div>

        {/* Countdown Timer */}
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-8 text-3xl font-bold text-foreground"
          >
            {countdown}
          </motion.div>
        )}
        
        {/* Loading dots (before countdown) */}
        {countdown === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-8 flex justify-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'oklch(0.42 0.09 210)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        )}
        </div>
      </div>
    </div>
  )
}

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
  const audioHandleRef = useRef<{ stop: () => void } | null>(null)
  const hasPlayedRef = useRef(false)

  // Welcome messages in multiple languages
  const WELCOME_MESSAGES: Record<Language, string> = {
    en: "Welcome to our restaurant! We're excited to serve you today.",
    ar: 'أهلاً وسهلاً بك في مطعمنا! نحن متحمسون لخدمتك اليوم.',
    ru: 'Добро пожаловать в наш ресторан! Мы рады вас видеть.',
    fr: 'Bienvenue dans notre restaurant! Nous sommes ravis de vous servir.',
    de: 'Willkommen in unserem Restaurant! Wir freuen uns, Sie zu bedienen.',
    it: 'Benvenuto nel nostro ristorante! Siamo entusiasti di servirti.',
    es: '¡Bienvenido a nuestro restaurante! Estamos emocionados de servirle.',
    zh: '欢迎来到我们的餐厅! 我们很高兴为您服务。',
    ja: 'レストランへようこそ！本日はお客様にお役立てします。',
    pt: 'Bem-vindo ao nosso restaurante! Estamos animados em servi-lo.',
    tr: 'Restoranımıza hoş geldiniz! Sizi hizmet etmekten heyecan duyuyoruz.',
    ko: '저희 레스토랑에 오신 것을 환영합니다! 오늘 봉사하게 되어 기쁩니다.',
  }

  useEffect(() => {
    if (hasPlayedRef.current) return
    hasPlayedRef.current = true

    const run = async () => {
      try {
        // Play welcome message with avatar animation
        const welcomeText = WELCOME_MESSAGES[language]
        const audioBuffer = await textToSpeech(welcomeText, {
          language,
          voiceId: 'hpp4J3VqNfWAUOO0d1Us',
        })

        if (audioBuffer) {
          setSpeaking(true)
          const handle = playWithAmplitude(audioBuffer, (level) => {
            setAmplitude(level)
          })
          audioHandleRef.current = handle

          // Wait for audio to finish
          await handle.finished
          setSpeaking(false)
        }
      } catch (error) {
        console.error('[v0] Welcome audio error:', error)
      }

      // Complete after audio + animation time
      const timer = setTimeout(onComplete, 800)
      return () => clearTimeout(timer)
    }

    const cleanup = run()
    return () => {
      if (cleanup instanceof Function) cleanup()
      audioHandleRef.current?.stop()
    }
  }, [language, onComplete])

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

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Talking Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8"
        >
          <TalkingAvatar amplitude={amplitude} speaking={speaking} size={200} />
        </motion.div>
      </div>

      <div
        className={`relative z-10 text-center px-8 max-w-lg ${dict.rtl ? 'rtl' : 'ltr'}`}
        dir={dict.rtl ? 'rtl' : 'ltr'}
      >
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

        {/* Loading dots */}
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
      </div>
    </div>
  )
}

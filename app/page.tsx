'use client'

import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { type Language } from '@/lib/dictionary'
import { type MenuItem } from '@/lib/menu-data'
import { LanguageWheel } from '@/components/language-wheel'
import { WelcomeScreen } from '@/components/welcome-screen'
import { MenuView } from '@/components/menu-view'
import { ReviewView } from '@/components/review-view'
import { TrackingView } from '@/components/tracking-view'
import { VoiceAssistant } from '@/components/voice-assistant'

type Step = 'language' | 'welcome' | 'menu' | 'review' | 'tracking'

export interface CartItem {
  item: MenuItem
  qty: number
  notes: string
}

const PAGE_TRANSITIONS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
}

function generateOrderNumber() {
  return String(Math.floor(10000 + Math.random() * 90000))
}

function GridBackground() {
  return (
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
  )
}

export default function CaptenOrderApp() {
  const [step, setStep] = useState<Step>('language')
  const [language, setLanguage] = useState<Language>('en')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderNumber] = useState(generateOrderNumber)
  const [voiceSelectedLanguageIndex, setVoiceSelectedLanguageIndex] = useState<number | undefined>()

  const handleLanguageSelect = useCallback((lang: Language) => {
    setLanguage(lang)
    setStep('welcome')
  }, [])

  const handleVoiceLanguageDetected = useCallback(
    (lang: Language, index: number) => {
      setLanguage(lang)
      // الانتقال لشاشة الترحيب بعد التأكيد الصوتي
      setTimeout(() => setStep('welcome'), 1800)
    },
    []
  )

  // ref يحمل resolve الخاص بآخر autoScroll promise
  const scrollResolveRef = useRef<(() => void) | null>(null)

  const handleAutoScroll = useCallback(
    (targetIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        scrollResolveRef.current = resolve
        setVoiceSelectedLanguageIndex(targetIndex)
        // نعطي الـ wheel وقتاً كافياً للتمرير (distance * 120ms + buffer)
        // الحد الأقصى 12 لغة × 120ms = ~1.5 ثانية
        setTimeout(() => {
          resolve()
          scrollResolveRef.current = null
        }, 1600)
      })
    },
    []
  )

  const handleWelcomeComplete = useCallback(() => {
    setStep('menu')
  }, [])

  const handleAddToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id)
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
        )
      }
      return [...prev, { item, qty: 1, notes: '' }]
    })
  }, [])

  const handleUpdateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((c) =>
        c.item.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c
      )
      return updated.filter((c) => c.qty > 0)
    })
  }, [])

  const handleUpdateNotes = useCallback((id: string, notes: string) => {
    setCart((prev) =>
      prev.map((c) => (c.item.id === id ? { ...c, notes } : c))
    )
  }, [])

  const handleRemove = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== id))
  }, [])

  const handleNewOrder = useCallback(() => {
    setCart([])
    setStep('language')
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {step === 'language' && (
        <VoiceAssistant
          onLanguageDetected={handleVoiceLanguageDetected}
          onAutoScroll={handleAutoScroll}
        />
      )}

      <AnimatePresence mode="wait">
        {step === 'language' && (
          <motion.div
            key="language"
            {...PAGE_TRANSITIONS}
            className="relative min-h-screen flex items-center justify-center"
          >
            <GridBackground />
            <LanguageWheel
              onSelect={handleLanguageSelect}
              voiceControlIndex={voiceSelectedLanguageIndex}
            />
          </motion.div>
        )}

        {step === 'welcome' && (
          <motion.div key="welcome" {...PAGE_TRANSITIONS} className="min-h-screen">
            <WelcomeScreen language={language} onComplete={handleWelcomeComplete} />
          </motion.div>
        )}

        {step === 'menu' && (
          <motion.div key="menu" {...PAGE_TRANSITIONS}>
            <MenuView
              language={language}
              onLanguageChange={setLanguage}
              cart={cart}
              onAddToCart={handleAddToCart}
              onCheckout={() => setStep('review')}
            />
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review" {...PAGE_TRANSITIONS}>
            <ReviewView
              language={language}
              cart={cart}
              onUpdateQty={handleUpdateQty}
              onUpdateNotes={handleUpdateNotes}
              onRemove={handleRemove}
              onOrder={() => setStep('tracking')}
              onBack={() => setStep('menu')}
            />
          </motion.div>
        )}

        {step === 'tracking' && (
          <motion.div key="tracking" {...PAGE_TRANSITIONS}>
            <TrackingView
              language={language}
              orderNumber={orderNumber}
              onNewOrder={handleNewOrder}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

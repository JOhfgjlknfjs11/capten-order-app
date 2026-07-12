'use client'

import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { type Language } from '@/lib/dictionary'
import { type MenuItem } from '@/lib/menu-data'
import { SelectLanguagePage } from '@/components/select-language-page'
import { HomeScreen } from '@/components/home-screen'
import { WelcomeScreen } from '@/components/welcome-screen'
import { MenuView } from '@/components/menu-view'
import { ReviewView } from '@/components/review-view'
import { TrackingView } from '@/components/tracking-view'
import { TalkingAvatar } from '@/components/talking-avatar'
import { ChatView } from '@/components/chat-view'

type Step = 'home' | 'language' | 'welcome' | 'menu' | 'review' | 'tracking' | 'chat'

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
  const [step, setStep] = useState<Step>('home')
  const [language, setLanguage] = useState<Language>('en')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderNumber] = useState(generateOrderNumber)
  const [avatarAmplitude, setAvatarAmplitude] = useState(0)
  const [avatarSpeaking, setAvatarSpeaking] = useState(false)
  const orderCompleteRef = useRef(false)

  const handleStartFromHome = useCallback(() => {
    setStep('language')
  }, [])

  const handleLanguageSelect = useCallback((lang: Language) => {
    setLanguage(lang)
    setStep('welcome')
  }, [])

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
    orderCompleteRef.current = false
  }, [])

  // Show avatar for all steps except home
  const showAvatar = step !== 'home' && !orderCompleteRef.current

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {step === 'home' && (
          <motion.div
            key="home"
            {...PAGE_TRANSITIONS}
            className="relative min-h-screen"
          >
            <GridBackground />
            <HomeScreen onStart={handleStartFromHome} />
          </motion.div>
        )}

        {step === 'language' && (
          <motion.div
            key="language"
            {...PAGE_TRANSITIONS}
            className="relative min-h-screen"
          >
            <GridBackground />
            <SelectLanguagePage onSelect={handleLanguageSelect} language={language} />
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
              onOrderComplete={() => {
                orderCompleteRef.current = true
              }}
              onChat={() => setStep('chat')}
            />
          </motion.div>
        )}

        {step === 'chat' && (
          <motion.div key="chat" {...PAGE_TRANSITIONS}>
            <ChatView language={language} />
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  )
}

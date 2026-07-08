'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { type Language, LANGUAGES, dictionary } from '@/lib/dictionary'

interface LanguageWheelProps {
  onSelect: (lang: Language) => void
}

const ITEM_HEIGHT = 72
const VISIBLE_ITEMS = 5

export function LanguageWheel({ onSelect }: LanguageWheelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSelecting, setIsSelecting] = useState(false)
  const y = useMotionValue(0)
  const isDragging = useRef(false)
  const startY = useRef(0)

  const clampIndex = (idx: number) => Math.max(0, Math.min(LANGUAGES.length - 1, idx))

  const snapToIndex = useCallback(
    (idx: number) => {
      const clamped = clampIndex(idx)
      setSelectedIndex(clamped)
      animate(y, -clamped * ITEM_HEIGHT, {
        type: 'spring',
        stiffness: 300,
        damping: 35,
      })
    },
    [y]
  )

  const handleSelect = useCallback(
    (idx: number) => {
      if (isSelecting) return
      setIsSelecting(true)
      snapToIndex(idx)
      setTimeout(() => {
        onSelect(LANGUAGES[idx])
      }, 500)
    },
    [isSelecting, snapToIndex, onSelect]
  )

  const handleDragEnd = useCallback(() => {
    isDragging.current = false
    const rawIndex = -y.get() / ITEM_HEIGHT
    const snapped = Math.round(rawIndex)
    snapToIndex(snapped)
  }, [y, snapToIndex])

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className="font-sans text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
          Capten Order
        </h1>
        <p className="mt-2 text-muted-foreground text-sm tracking-widest uppercase font-body">
          Select Your Language
        </p>
        <div className="mt-3 w-16 h-0.5 bg-accent mx-auto rounded-full" />
      </motion.div>

      {/* Wheel container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="relative"
        style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 320 }}
      >
        {/* Neumorphic outer ring */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{
            background: 'oklch(0.975 0.008 85)',
            boxShadow:
              '12px 12px 30px oklch(0.84 0.012 80), -8px -8px 20px oklch(1 0.003 90), inset 0 0 0 1px oklch(0.9 0.01 80 / 0.5)',
          }}
        />

        {/* Top/bottom fade masks */}
        <div
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none rounded-t-3xl"
          style={{
            height: ITEM_HEIGHT * 2,
            background:
              'linear-gradient(to bottom, oklch(0.975 0.008 85) 0%, oklch(0.975 0.008 85 / 0.6) 60%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none rounded-b-3xl"
          style={{
            height: ITEM_HEIGHT * 2,
            background:
              'linear-gradient(to top, oklch(0.975 0.008 85) 0%, oklch(0.975 0.008 85 / 0.6) 60%, transparent 100%)',
          }}
        />

        {/* Selection highlight */}
        <div
          className="absolute left-4 right-4 z-10 rounded-xl pointer-events-none"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            height: ITEM_HEIGHT - 8,
            background: 'oklch(0.42 0.09 210 / 0.08)',
            boxShadow:
              'inset 3px 3px 8px oklch(0.84 0.012 80 / 0.5), inset -3px -3px 8px oklch(1 0.003 90 / 0.8)',
            border: '1px solid oklch(0.42 0.09 210 / 0.15)',
          }}
        />

        {/* Scrollable items */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <motion.div
            style={{ y }}
            drag="y"
            dragConstraints={{
              top: -(LANGUAGES.length - 1) * ITEM_HEIGHT,
              bottom: 0,
            }}
            dragElastic={0.1}
            onDragStart={() => {
              isDragging.current = true
              startY.current = y.get()
            }}
            onDragEnd={handleDragEnd}
            className="cursor-grab active:cursor-grabbing"
            initial={{ y: 0 }}
          >
            {/* Top spacer */}
            <div style={{ height: ITEM_HEIGHT * 2 }} />

            {LANGUAGES.map((lang, idx) => {
              const dict = dictionary[lang]
              const distance = Math.abs(idx - selectedIndex)
              const isSelected = idx === selectedIndex

              return (
                <motion.button
                  key={lang}
                  onClick={() => !isDragging.current && handleSelect(idx)}
                  className="w-full flex items-center gap-4 px-8 focus:outline-none"
                  style={{ height: ITEM_HEIGHT }}
                  animate={{
                    opacity: distance === 0 ? 1 : distance === 1 ? 0.7 : 0.35,
                    scale: distance === 0 ? 1.05 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <span className="text-2xl">{dict.flag}</span>
                  <div className="flex-1 text-left">
                    <div
                      className="font-body text-base font-semibold leading-tight"
                      style={{
                        color: isSelected
                          ? 'oklch(0.42 0.09 210)'
                          : 'oklch(0.35 0.015 60)',
                      }}
                    >
                      {dict.langNative}
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      {dict.langName}
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="check"
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'oklch(0.42 0.09 210)' }}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}

            {/* Bottom spacer */}
            <div style={{ height: ITEM_HEIGHT * 2 }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Confirm button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        onClick={() => handleSelect(selectedIndex)}
        disabled={isSelecting}
        whileHover={{ scale: isSelecting ? 1 : 1.04 }}
        whileTap={{ scale: isSelecting ? 1 : 0.97 }}
        className="relative px-12 py-4 rounded-2xl text-white font-body font-semibold text-base tracking-wide transition-all disabled:opacity-70"
        style={{
          background: 'oklch(0.42 0.09 210)',
          boxShadow:
            '6px 6px 18px oklch(0.42 0.09 210 / 0.35), -2px -2px 8px oklch(0.56 0.06 210 / 0.2)',
        }}
      >
        {isSelecting ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            {dictionary[LANGUAGES[selectedIndex]].langNative}
          </span>
        ) : (
          <>
            <span>{dictionary[LANGUAGES[selectedIndex]].flag}</span>
            <span className="ml-2">{dictionary[LANGUAGES[selectedIndex]].langNative}</span>
          </>
        )}
      </motion.button>

      <p className="text-xs text-muted-foreground font-body">
        Scroll or tap to select
      </p>
    </div>
  )
}

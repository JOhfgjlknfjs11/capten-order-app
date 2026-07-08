'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { type Language, LANGUAGES, dictionary } from '@/lib/dictionary'

interface LanguageWheelProps {
  onSelect: (lang: Language) => void
}

const ITEM_HEIGHT = 72
const VISIBLE_ITEMS = 5
// Circle diameter — must be wide enough for the content
const DIAMETER = 340

// ─── Web Audio tick ──────────────────────────────────────────────────────────
function playTick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.07)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext not available (SSR / some browsers)
  }
}

export function LanguageWheel({ onSelect }: LanguageWheelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSelecting, setIsSelecting] = useState(false)
  const y = useMotionValue(0)
  const isDragging = useRef(false)
  const lastSnappedIndex = useRef(0)

  const clampIndex = (idx: number) =>
    Math.max(0, Math.min(LANGUAGES.length - 1, idx))

  const snapToIndex = useCallback(
    (idx: number, withSound = true) => {
      const clamped = clampIndex(idx)
      if (withSound && clamped !== lastSnappedIndex.current) {
        playTick()
      }
      lastSnappedIndex.current = clamped
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

  // Tick on continuous drag whenever index would change
  const handleDrag = useCallback(() => {
    const rawIndex = -y.get() / ITEM_HEIGHT
    const snapped = clampIndex(Math.round(rawIndex))
    if (snapped !== lastSnappedIndex.current) {
      playTick()
      lastSnappedIndex.current = snapped
      setSelectedIndex(snapped)
    }
  }, [y])

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
        <p className="mt-2 font-body text-sm tracking-widest uppercase" style={{ color: 'oklch(0.32 0.02 55)' }}>
          Select Your Language
        </p>
        <div className="mt-3 w-16 h-0.5 bg-accent mx-auto rounded-full" />
      </motion.div>

      {/* Circular wheel container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.2, ease: 'easeOut' }}
        className="relative flex items-center justify-center"
        style={{ width: DIAMETER, height: DIAMETER }}
      >
        {/* Neumorphic circle background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'oklch(0.975 0.008 85)',
            boxShadow: [
              '18px 18px 45px oklch(0.82 0.014 78)',
              '-12px -12px 30px oklch(1 0.003 92)',
              '6px 6px 12px oklch(0.86 0.01 80)',
              '-4px -4px 10px oklch(0.99 0.005 90)',
              'inset 0 0 0 1.5px oklch(0.92 0.009 82 / 0.6)',
            ].join(', '),
          }}
        />

        {/* Inner recessed ring for depth */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: 12,
            boxShadow: [
              'inset 4px 4px 12px oklch(0.84 0.012 78 / 0.7)',
              'inset -3px -3px 8px oklch(1 0.003 92 / 0.9)',
            ].join(', '),
            borderRadius: '50%',
          }}
        />

        {/* Top fade mask — circular clip */}
        <div
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none rounded-full"
          style={{
            height: '40%',
            background:
              'linear-gradient(to bottom, oklch(0.975 0.008 85) 0%, oklch(0.975 0.008 85 / 0.75) 55%, transparent 100%)',
            borderRadius: '50% 50% 0 0 / 50% 50% 0 0',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            height: '40%',
            background:
              'linear-gradient(to top, oklch(0.975 0.008 85) 0%, oklch(0.975 0.008 85 / 0.75) 55%, transparent 100%)',
            borderRadius: '0 0 50% 50% / 0 0 50% 50%',
          }}
        />

        {/* Selection highlight band */}
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: 32,
            right: 32,
            top: '50%',
            transform: 'translateY(-50%)',
            height: ITEM_HEIGHT - 10,
            borderRadius: 14,
            background: 'oklch(0.42 0.09 210 / 0.07)',
            boxShadow: [
              'inset 3px 3px 8px oklch(0.84 0.012 80 / 0.45)',
              'inset -3px -3px 8px oklch(1 0.003 90 / 0.75)',
            ].join(', '),
            border: '1px solid oklch(0.42 0.09 210 / 0.14)',
          }}
        />

        {/* Scrollable list clipped to the circle */}
        <div
          className="absolute overflow-hidden"
          style={{
            inset: 0,
            borderRadius: '50%',
          }}
        >
          <motion.div
            style={{ y }}
            drag="y"
            dragConstraints={{
              top: -(LANGUAGES.length - 1) * ITEM_HEIGHT,
              bottom: 0,
            }}
            dragElastic={0.08}
            onDragStart={() => { isDragging.current = true }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="cursor-grab active:cursor-grabbing"
          >
            {/* Top spacer to center first item */}
            <div style={{ height: (DIAMETER - ITEM_HEIGHT) / 2 }} />

            {LANGUAGES.map((lang, idx) => {
              const dict = dictionary[lang]
              const distance = Math.abs(idx - selectedIndex)
              const isSelected = idx === selectedIndex

              return (
                <motion.button
                  key={lang}
                  onClick={() => !isDragging.current && handleSelect(idx)}
                  className="w-full flex items-center gap-3 focus:outline-none"
                  style={{
                    height: ITEM_HEIGHT,
                    paddingLeft: 40,
                    paddingRight: 36,
                  }}
                  animate={{
                    opacity: distance === 0 ? 1 : distance === 1 ? 0.65 : 0.28,
                    scale: distance === 0 ? 1.04 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                >
                  {/* Flag badge */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center text-xl"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isSelected
                        ? 'oklch(0.42 0.09 210 / 0.1)'
                        : 'oklch(0.96 0.008 82)',
                      boxShadow: isSelected
                        ? [
                            'inset 2px 2px 6px oklch(0.84 0.012 80 / 0.4)',
                            'inset -2px -2px 5px oklch(1 0.003 90 / 0.7)',
                          ].join(', ')
                        : [
                            '3px 3px 7px oklch(0.84 0.012 80 / 0.5)',
                            '-2px -2px 5px oklch(1 0.003 90 / 0.8)',
                          ].join(', '),
                      border: isSelected
                        ? '1.5px solid oklch(0.42 0.09 210 / 0.25)'
                        : '1px solid oklch(0.9 0.01 82 / 0.5)',
                      lineHeight: 1,
                    }}
                  >
                    {dict.flag}
                  </div>

                  {/* Language names */}
                  <div className="flex-1 text-left min-w-0">
                    <div
                      className="font-body text-base font-semibold leading-tight truncate"
                      style={{
                        color: isSelected
                          ? 'oklch(0.38 0.09 210)'
                          : 'oklch(0.28 0.015 55)',
                      }}
                    >
                      {dict.langNative}
                    </div>
                    <div
                      className="text-xs font-body leading-snug truncate"
                      style={{ color: 'oklch(0.48 0.015 60)' }}
                    >
                      {dict.langName}
                    </div>
                  </div>

                  {/* Check mark */}
                  {isSelected && (
                    <motion.div
                      layoutId="check"
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'oklch(0.42 0.09 210)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}

            {/* Bottom spacer */}
            <div style={{ height: (DIAMETER - ITEM_HEIGHT) / 2 }} />
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
          <span className="flex items-center gap-2">
            <span>{dictionary[LANGUAGES[selectedIndex]].flag}</span>
            <span>{dictionary[LANGUAGES[selectedIndex]].langNative}</span>
          </span>
        )}
      </motion.button>

      <p className="text-xs font-body" style={{ color: 'oklch(0.45 0.015 60)' }}>
        Scroll or tap to select
      </p>
    </div>
  )
}

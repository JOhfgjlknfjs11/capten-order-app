'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, animate } from 'framer-motion'
import { type Language, LANGUAGES, dictionary } from '@/lib/dictionary'

interface LanguageWheelProps {
  onSelect: (lang: Language) => void
}

const ITEM_HEIGHT = 72
const VISIBLE_ITEMS = 5
// Circle diameter — must be wide enough for the content
const DIAMETER = 340

// Map language code → ISO 3166-1 alpha-2 country code for flagcdn.com
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

function FlagImg({ lang, size = 28 }: { lang: Language; size?: number }) {
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

      {/* Circular wheel container — outer wrapper has NO overflow:hidden so shadows render */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.2, ease: 'easeOut' }}
        className="relative flex items-center justify-center"
        style={{ width: DIAMETER, height: DIAMETER }}
      >
        {/* Neumorphic circle background — shadows live here, outside any clip */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'oklch(0.975 0.008 85)',
            boxShadow: [
              '22px 22px 55px oklch(0.80 0.016 76)',
              '-16px -16px 36px oklch(1 0.002 94)',
              '8px 8px 18px oklch(0.86 0.012 80)',
              '-5px -5px 12px oklch(0.995 0.004 90)',
              'inset 0 0 0 2px oklch(0.90 0.010 82 / 0.5)',
              'inset 0 0 0 4px oklch(0.995 0.003 92 / 0.7)',
            ].join(', '),
          }}
        />

        {/* Outer rim highlight arc — top-left bright edge */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 28%, oklch(1 0.003 92 / 0.55) 0%, transparent 55%)',
          }}
        />

        {/* Content clip layer — clips list AND fades strictly to the circle */}
        <div
          className="absolute overflow-hidden rounded-full"
          style={{ inset: 6 }}
        >
          {/* Selection highlight band — inside clip so it respects the circle */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: 28,
              right: 28,
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

          {/* Top fade — clipped to circle by parent overflow:hidden */}
          <div
            className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
            style={{
              height: '42%',
              background:
                'linear-gradient(to bottom, oklch(0.975 0.008 85) 0%, oklch(0.975 0.008 85 / 0.85) 45%, transparent 100%)',
            }}
          />
          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
            style={{
              height: '42%',
              background:
                'linear-gradient(to top, oklch(0.975 0.008 85) 0%, oklch(0.975 0.008 85 / 0.85) 45%, transparent 100%)',
            }}
          />
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
            {/* Top spacer to center first item — DIAMETER - 12 (inset:6 each side) */}
            <div style={{ height: (DIAMETER - 12 - ITEM_HEIGHT) / 2 }} />

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
                    className="flex-shrink-0 flex items-center justify-center overflow-hidden"
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
                    }}
                  >
                    <FlagImg lang={lang} size={28} />
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
            <div style={{ height: (DIAMETER - 12 - ITEM_HEIGHT) / 2 }} />
          </motion.div>
        </div>
        {/* end scrollable list */}
        </div>
        {/* end content clip layer */}
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
            <span className="overflow-hidden rounded-sm" style={{ width: 22, height: 16, display: 'inline-flex', alignItems: 'center' }}>
              <FlagImg lang={LANGUAGES[selectedIndex]} size={22} />
            </span>
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

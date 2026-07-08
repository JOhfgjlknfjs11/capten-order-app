'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Language, dictionary } from '@/lib/dictionary'

interface TrackingViewProps {
  language: Language
  orderNumber: string
  onNewOrder: () => void
}

const TOTAL_SECONDS = 25 * 60

type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered'

const STATUS_SEQUENCE: OrderStatus[] = ['received', 'preparing', 'ready']

function getStatusIndex(secondsLeft: number): number {
  const elapsed = TOTAL_SECONDS - secondsLeft
  if (elapsed < 120) return 0
  if (elapsed < TOTAL_SECONDS * 0.7) return 1
  return 2
}

export function TrackingView({ language, orderNumber, onNewOrder }: TrackingViewProps) {
  const dict = dictionary[language]
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [isDone, setIsDone] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setIsDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const progress = 1 - secondsLeft / TOTAL_SECONDS
  const statusIndex = isDone ? 3 : getStatusIndex(secondsLeft)

  const statusLabels: { key: OrderStatus; label: string }[] = [
    { key: 'received', label: dict.statusReceived },
    { key: 'preparing', label: dict.statusPreparing },
    { key: 'ready', label: dict.statusReady },
    { key: 'delivered', label: dict.statusDelivered },
  ]

  // SVG circle params
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-8 pb-12 px-4"
      dir={dict.rtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-1">
          {dict.restaurantName}
        </p>
        <h1 className="font-sans text-2xl md:text-3xl font-bold text-foreground">
          {isDone ? dict.statusDelivered : dict.orderPlaced}
        </h1>
        <p
          className="font-body text-sm mt-1"
          style={{ color: 'oklch(0.42 0.09 210)' }}
        >
          {dict.orderNumber} #{orderNumber}
        </p>
      </motion.div>

      {/* 3D Countdown Circle */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.2 }}
        className="relative mb-8"
      >
        {/* Outer neumorphic ring */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'oklch(0.975 0.008 85)',
            boxShadow: isDone
              ? '0 0 60px oklch(0.6 0.08 140 / 0.3), 12px 12px 30px oklch(0.84 0.012 80), -8px -8px 20px oklch(1 0.003 90)'
              : `0 0 ${40 + Math.sin(progress * Math.PI * 4) * 20}px oklch(0.42 0.09 210 / 0.2), 12px 12px 30px oklch(0.84 0.012 80), -8px -8px 20px oklch(1 0.003 90)`,
          }}
        >
          {/* SVG arc */}
          <svg
            className="absolute inset-0"
            width="260"
            height="260"
            viewBox="0 0 260 260"
          >
            {/* Background track */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke="oklch(0.88 0.012 80)"
              strokeWidth="10"
            />
            {/* Progress arc */}
            <motion.circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke={isDone ? 'oklch(0.6 0.08 140)' : 'oklch(0.42 0.09 210)'}
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.9, ease: 'linear' }}
              style={{
                transformOrigin: '50% 50%',
                rotate: '-90deg',
                filter: isDone
                  ? 'drop-shadow(0 0 6px oklch(0.6 0.08 140 / 0.6))'
                  : 'drop-shadow(0 0 6px oklch(0.42 0.09 210 / 0.5))',
              }}
            />
          </svg>

          {/* Center content */}
          <div className="relative z-10 text-center">
            {isDone ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="text-5xl mb-1">✓</div>
                <div
                  className="font-body text-sm font-bold"
                  style={{ color: 'oklch(0.6 0.08 140)' }}
                >
                  {dict.statusReady}
                </div>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={minutes}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span
                      className="font-sans text-5xl font-bold tabular-nums"
                      style={{ color: 'oklch(0.42 0.09 210)' }}
                    >
                      {String(minutes).padStart(2, '0')}
                    </span>
                  </motion.div>
                </AnimatePresence>
                <span
                  className="font-sans text-3xl font-bold"
                  style={{ color: 'oklch(0.75 0.14 78)' }}
                >
                  :
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={seconds}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-sans text-5xl font-bold tabular-nums"
                    style={{ color: 'oklch(0.42 0.09 210)' }}
                  >
                    {String(seconds).padStart(2, '0')}
                  </motion.span>
                </AnimatePresence>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  {dict.minutesLeft}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Pulsing ring */}
        {!isDone && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 0 0 oklch(0.42 0.09 210 / 0.3)',
                '0 0 0 20px oklch(0.42 0.09 210 / 0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.div>

      {/* Status tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md mb-8"
      >
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'oklch(0.99 0.004 85)',
            boxShadow:
              '8px 8px 20px oklch(0.84 0.012 80 / 0.6), -4px -4px 12px oklch(1 0.003 90 / 0.9)',
          }}
        >
          <h2 className="font-sans text-base font-bold text-foreground mb-5 text-center">
            {dict.orderStatus}
          </h2>
          <div className="flex items-start justify-between relative">
            {/* Connector line */}
            <div
              className="absolute top-4 left-6 right-6 h-0.5"
              style={{ background: 'oklch(0.88 0.012 80)' }}
            />
            <motion.div
              className="absolute top-4 left-6 h-0.5"
              style={{ background: 'oklch(0.42 0.09 210)' }}
              animate={{
                width: `${(Math.min(statusIndex, 2) / 2) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />

            {statusLabels.slice(0, 3).map((s, idx) => {
              const isActive = idx === statusIndex && !isDone
              const isDoneStep = idx < statusIndex || isDone
              return (
                <div key={s.key} className="flex flex-col items-center gap-2 relative z-10">
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                    }}
                    transition={
                      isActive
                        ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                        : {}
                    }
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: isDoneStep
                        ? 'oklch(0.42 0.09 210)'
                        : isActive
                        ? 'oklch(0.99 0.004 85)'
                        : 'oklch(0.975 0.008 85)',
                      border: isActive
                        ? '2px solid oklch(0.42 0.09 210)'
                        : 'none',
                      boxShadow: isDoneStep
                        ? '3px 3px 8px oklch(0.42 0.09 210 / 0.3)'
                        : '3px 3px 8px oklch(0.84 0.012 80), -2px -2px 5px oklch(1 0.003 90)',
                    }}
                  >
                    {isDoneStep ? (
                      <svg
                        className="w-3.5 h-3.5 text-white"
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
                    ) : isActive ? (
                      <motion.div
                        animate={{ scale: [0.6, 1, 0.6] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: 'oklch(0.42 0.09 210)' }}
                      />
                    ) : (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: 'oklch(0.75 0.04 80)' }}
                      />
                    )}
                  </motion.div>
                  <span
                    className="font-body text-xs text-center max-w-16 leading-tight"
                    style={{
                      color: isDoneStep
                        ? 'oklch(0.42 0.09 210)'
                        : isActive
                        ? 'oklch(0.25 0.02 50)'
                        : 'oklch(0.6 0.015 70)',
                      fontWeight: isDoneStep || isActive ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Thank you message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="font-sans text-2xl font-bold text-foreground mb-1">
          {dict.thankYou}
        </h2>
        <p className="font-body text-sm text-muted-foreground">
          {dict.enjoyMeal}
        </p>
      </motion.div>

      {/* New order button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onNewOrder}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="px-8 py-3.5 rounded-2xl font-body font-semibold text-sm transition-all"
        style={{
          background: 'oklch(0.99 0.004 85)',
          color: 'oklch(0.42 0.09 210)',
          boxShadow:
            '6px 6px 16px oklch(0.84 0.012 80), -3px -3px 10px oklch(1 0.003 90)',
          border: '1px solid oklch(0.42 0.09 210 / 0.2)',
        }}
      >
        + {dict.newOrder}
      </motion.button>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface TalkingAvatarProps {
  /** مستوى الصوت اللحظي 0..1 لتحريك الفم */
  amplitude: number
  /** هل الأفاتار بيتكلم حالياً (لإظهار مؤشرات نشطة) */
  speaking: boolean
  /** حجم الأفاتار بالبكسل */
  size?: number
  /** مسار صورة الأفاتار */
  src?: string
}

/**
 * أفاتار متكلم: صورة ثابتة + طبقة فم متحركة متزامنة مع الصوت
 * + رمش عين + حركة رأس خفيفة لإعطاء إحساس شخص حقيقي بيتكلم.
 */
export function TalkingAvatar({
  amplitude,
  speaking,
  size = 240,
  src = '/avatar.png',
}: TalkingAvatarProps) {
  // تنعيم مستوى الصوت لحركة فم أكثر طبيعية
  const [smoothed, setSmoothed] = useState(0)
  const rafRef = useRef(0)
  const targetRef = useRef(0)
  const currentRef = useRef(0)

  useEffect(() => {
    targetRef.current = amplitude
  }, [amplitude])

  useEffect(() => {
    const animate = () => {
      // انتقال ناعم نحو القيمة الهدف
      currentRef.current += (targetRef.current - currentRef.current) * 0.35
      setSmoothed(currentRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // درجة فتح الفم: ارتفاع الطبقة يتغير حسب الصوت
  const mouthOpen = Math.min(1, smoothed)
  const mouthHeight = 3 + mouthOpen * 22 // من 3px (مغلق) إلى ~25px (مفتوح)
  const mouthWidth = 34 + mouthOpen * 10

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* هالة نابضة خلف الأفاتار عند الكلام */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, oklch(0.6 0.15 210 / 0.35) 0%, transparent 70%)',
        }}
        animate={{
          scale: speaking ? [1, 1.12, 1] : 1,
          opacity: speaking ? [0.6, 1, 0.6] : 0.4,
        }}
        transition={{
          duration: 1.6,
          repeat: speaking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* حلقة تفاعلية تتوسع مع الصوت */}
      <div
        className="absolute rounded-full transition-all duration-100"
        style={{
          inset: -6 - mouthOpen * 10,
          border: '2px solid oklch(0.75 0.14 78)',
          opacity: speaking ? 0.4 + mouthOpen * 0.5 : 0.25,
        }}
      />

      {/* حاوية الأفاتار مع حركة رأس خفيفة */}
      <motion.div
        className="absolute inset-2 rounded-full overflow-hidden"
        style={{
          boxShadow:
            '0 12px 40px oklch(0.4 0.05 210 / 0.35), inset 0 0 0 4px oklch(0.99 0.004 85)',
          background: 'oklch(0.95 0.01 85)',
        }}
        animate={
          speaking
            ? { y: [0, -3, 0, -2, 0], rotate: [0, 0.6, 0, -0.6, 0] }
            : { y: [0, -2, 0], rotate: 0 }
        }
        transition={{
          duration: speaking ? 3 : 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* صورة الأفاتار */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src || '/placeholder.svg'}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* طبقة الرمش: جفن ينزل بشكل دوري */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'oklch(0 0 0 / 0.0)' }}
          animate={{ opacity: [0, 0, 0, 0.06, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            times: [0, 0.92, 0.94, 0.96, 0.98],
            ease: 'linear',
          }}
        />

        {/* طبقة الفم المتحركة - تظهر فقط أثناء الكلام */}
        {speaking && (
          <div
            className="absolute left-1/2 pointer-events-none"
            style={{
              bottom: '24%',
              transform: 'translateX(-50%)',
              width: mouthWidth,
              height: mouthHeight,
              borderRadius: '0 0 50% 50% / 0 0 60% 60%',
              background:
                'radial-gradient(ellipse at center, oklch(0.28 0.06 20) 0%, oklch(0.2 0.05 20) 60%, oklch(0.15 0.04 20) 100%)',
              boxShadow: 'inset 0 2px 4px oklch(0 0 0 / 0.5)',
              opacity: 0.15 + mouthOpen * 0.85,
              transition: 'height 60ms linear, width 60ms linear, opacity 60ms linear',
            }}
          >
            {/* خط الأسنان العلوي */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{
                width: '80%',
                height: 3,
                background: 'oklch(0.95 0.01 85)',
                borderRadius: '0 0 3px 3px',
                opacity: mouthOpen > 0.25 ? 1 : 0,
              }}
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}

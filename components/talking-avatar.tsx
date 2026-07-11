'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface TalkingAvatarProps {
  /** مستوى الصوت اللحظي 0..1 لتحريك الشخصية */
  amplitude: number
  /** هل الأفاتار بيتكلم حالياً (لإظهار مؤشرات نشطة) */
  speaking: boolean
  /** حجم الأفاتار بالبكسل */
  size?: number
  /** مسار صورة الأفاتار */
  src?: string
}

/**
 * أفاتار متكلم: نحرّك صورة الشخصية نفسها (اهتزاز رأسي + نبضة تكبير + ميلان خفيف)
 * متزامنة مع مستوى الصوت، بدون أي طبقة فم مركّبة فوق الصورة.
 * + رمش دوري + حركة تنفّس خفيفة لإحساس شخص حقيقي بيتكلم.
 */
export function TalkingAvatar({
  amplitude,
  speaking,
  size = 240,
  src = '/avatar.png',
}: TalkingAvatarProps) {
  // تنعيم مستوى الصوت لحركة أكثر طبيعية
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
      currentRef.current += (targetRef.current - currentRef.current) * 0.3
      setSmoothed(currentRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // مستوى الحركة المدفوع بالصوت (0..1)
  const level = Math.min(1, smoothed)

  // تحويلات الصورة المتزامنة مع الصوت:
  // - نبضة تكبير خفيفة عند ارتفاع الصوت (كأنه يتحرك ناحية الكاميرا وهو بيتكلم)
  // - اهتزاز رأسي خفيف لأعلى مع الصوت
  const imgScale = 1 + level * 0.05
  const imgTranslateY = -level * 6

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
          inset: -6 - level * 10,
          border: '2px solid oklch(0.75 0.14 78)',
          opacity: speaking ? 0.4 + level * 0.5 : 0.25,
        }}
      />

      {/* حاوية الأفاتار مع حركة رأس/تنفّس خفيفة */}
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
        {/* صورة الشخصية — تتحرك نفسها مع الصوت */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src || '/placeholder.svg'}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
          style={{
            transform: `scale(${imgScale}) translateY(${imgTranslateY}px)`,
            transformOrigin: 'center 40%',
            transition: 'transform 70ms linear',
            willChange: 'transform',
          }}
        />

        {/* طبقة الرمش: تعتيم خفيف دوري يوحي بالرمش */}
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
      </motion.div>
    </div>
  )
}

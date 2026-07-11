'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingCart, Check, Loader2 } from 'lucide-react'
import { type Language } from '@/lib/dictionary'
import { getItemName, getItemDescription, type MenuItem } from '@/lib/menu-data'
import { useGeminiMenu } from '@/hooks/use-gemini-menu'

interface GeminiFoodCardProps {
  item: MenuItem
  dict: Record<string, string>
  language: Language
  onAdd: () => void
  added: boolean
  useGemini?: boolean
}

const BADGE_COLORS: Record<string, string> = {
  Chef: 'oklch(0.75 0.14 78)',
  Popular: 'oklch(0.42 0.09 210)',
  New: 'oklch(0.6 0.08 140)',
  Vegan: 'oklch(0.55 0.12 145)',
}

export function GeminiFoodCard({
  item,
  dict,
  language,
  onAdd,
  added,
  useGemini = true,
}: GeminiFoodCardProps) {
  const [description, setDescription] = useState<string>('')
  const [loading, setLoading] = useState(useGemini)
  const { getItemDescription: getGeminiDescription } = useGeminiMenu({ language })

  useEffect(() => {
    if (!useGemini) {
      setDescription(getItemDescription(item, language))
      setLoading(false)
      return
    }

    const fetchDescription = async () => {
      setLoading(true)
      try {
        const desc = await getGeminiDescription(getItemName(item, language))
        setDescription(desc)
      } catch (error) {
        console.error('[v0] Error fetching Gemini description:', error)
        setDescription(getItemDescription(item, language))
      } finally {
        setLoading(false)
      }
    }

    fetchDescription()
  }, [item, language, useGemini, getGeminiDescription])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{
        y: -4,
        rotateX: 3,
        rotateY: -2,
        scale: 1.01,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'oklch(0.99 0.004 85)',
        boxShadow:
          '8px 8px 20px oklch(0.85 0.01 80 / 0.7), -4px -4px 12px oklch(1 0.002 90 / 0.9), 0 2px 4px oklch(0.85 0.01 80 / 0.2)',
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={item.image}
          alt={getItemName(item, language)}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {item.badge && (
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-white text-xs font-semibold font-body backdrop-blur-sm"
            style={{ background: `${BADGE_COLORS[item.badge]}cc` }}
          >
            {item.badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-sans text-base font-bold text-foreground leading-tight mb-1">
          {getItemName(item, language)}
        </h3>
        
        {/* Description with loading state */}
        <div className="mb-4 min-h-[40px]">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading description...</span>
            </div>
          ) : (
            <p className="font-body text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className="font-sans text-xl font-bold"
            style={{ color: 'oklch(0.42 0.09 210)' }}
          >
            ${item.price.toFixed(2)}
          </span>

          <motion.button
            onClick={onAdd}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold font-body text-white transition-all"
            style={{
              background: added
                ? 'oklch(0.6 0.08 140)'
                : 'oklch(0.42 0.09 210)',
              boxShadow: '3px 3px 8px oklch(0.42 0.09 210 / 0.3)',
            }}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{dict.added || 'Added'}</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>{dict.addToCart || 'Add'}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ChevronDown, ArrowLeft } from 'lucide-react'
import { type Language, dictionary } from '@/lib/dictionary'
import { type MenuItem } from '@/lib/menu-data'

interface CartItem {
  item: MenuItem
  qty: number
  notes: string
}

interface ReviewViewProps {
  language: Language
  cart: CartItem[]
  onUpdateQty: (id: string, delta: number) => void
  onUpdateNotes: (id: string, notes: string) => void
  onRemove: (id: string) => void
  onOrder: () => void
  onBack: () => void
}

export function ReviewView({
  language,
  cart,
  onUpdateQty,
  onUpdateNotes,
  onRemove,
  onOrder,
  onBack,
}: ReviewViewProps) {
  const dict = dictionary[language]
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0)
  const tax = subtotal * 0.14
  const total = subtotal + tax

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={dict.rtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 md:px-8 py-4 flex items-center gap-4"
        style={{
          background: 'oklch(0.975 0.008 85 / 0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 2px 16px oklch(0.84 0.012 80 / 0.3)',
          borderBottom: '1px solid oklch(0.9 0.01 80 / 0.5)',
        }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-xl transition-all"
          style={{
            background: 'oklch(0.99 0.004 85)',
            boxShadow: '4px 4px 10px oklch(0.84 0.012 80), -2px -2px 6px oklch(1 0.003 90)',
          }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-sans text-xl font-bold text-foreground">
            {dict.orderReview}
          </h1>
          <p className="font-body text-xs text-muted-foreground">
            {cart.reduce((s, c) => s + c.qty, 0)} {dict.items}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 md:px-8 py-6 max-w-6xl mx-auto w-full">
        {/* Cart items */}
        <div className="flex-1 space-y-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-5xl mb-4">🛒</div>
                <p className="font-body text-muted-foreground">{dict.emptyCart}</p>
                <button
                  onClick={onBack}
                  className="mt-4 font-body text-sm font-semibold underline"
                  style={{ color: 'oklch(0.42 0.09 210)' }}
                >
                  {dict.backToMenu}
                </button>
              </motion.div>
            ) : (
              cart.map((cartItem) => (
                <motion.div
                  key={cartItem.item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'oklch(0.99 0.004 85)',
                    boxShadow:
                      '6px 6px 16px oklch(0.85 0.01 80 / 0.6), -3px -3px 10px oklch(1 0.002 90 / 0.8)',
                  }}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={cartItem.item.image}
                        alt={cartItem.item.nameEn}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans text-sm font-bold text-foreground leading-tight">
                        {cartItem.item.nameEn}
                      </h3>
                      <p
                        className="font-sans text-base font-bold mt-0.5"
                        style={{ color: 'oklch(0.42 0.09 210)' }}
                      >
                        ${(cartItem.item.price * cartItem.qty).toFixed(2)}
                      </p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onUpdateQty(cartItem.item.id, -1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: 'oklch(0.975 0.008 85)',
                            boxShadow:
                              '3px 3px 7px oklch(0.84 0.012 80), -2px -2px 5px oklch(1 0.003 90)',
                          }}
                        >
                          <Minus className="w-3 h-3 text-foreground" />
                        </button>
                        <motion.span
                          key={cartItem.qty}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="font-body text-sm font-bold min-w-6 text-center text-foreground"
                        >
                          {cartItem.qty}
                        </motion.span>
                        <button
                          onClick={() => onUpdateQty(cartItem.item.id, 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: 'oklch(0.42 0.09 210)',
                            boxShadow: '3px 3px 7px oklch(0.42 0.09 210 / 0.3)',
                          }}
                        >
                          <Plus className="w-3 h-3 text-white" />
                        </button>

                        <button
                          onClick={() => onRemove(cartItem.item.id)}
                          className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: 'oklch(0.975 0.008 85)',
                            boxShadow:
                              '3px 3px 7px oklch(0.84 0.012 80), -2px -2px 5px oklch(1 0.003 90)',
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes accordion */}
                  <div className="border-t border-border/30 mx-4" />
                  <button
                    onClick={() => toggleNotes(cartItem.item.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{dict.customNotes}</span>
                    <ChevronDown
                      className="w-3.5 h-3.5 transition-transform"
                      style={{
                        transform: expandedNotes.has(cartItem.item.id)
                          ? 'rotate(180deg)'
                          : 'none',
                      }}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedNotes.has(cartItem.item.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <textarea
                            value={cartItem.notes}
                            onChange={(e) =>
                              onUpdateNotes(cartItem.item.id, e.target.value)
                            }
                            placeholder={dict.customNotesPlaceholder}
                            rows={2}
                            className="w-full rounded-xl px-3 py-2 font-body text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none transition-all"
                            style={{
                              background: 'oklch(0.975 0.008 85)',
                              boxShadow:
                                'inset 3px 3px 7px oklch(0.84 0.012 80), inset -2px -2px 5px oklch(1 0.003 90)',
                              border: 'none',
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div className="lg:w-80 flex-shrink-0">
          <div
            className="rounded-2xl p-6 sticky top-24"
            style={{
              background: 'oklch(0.99 0.004 85)',
              boxShadow:
                '8px 8px 22px oklch(0.84 0.012 80 / 0.6), -4px -4px 14px oklch(1 0.003 90 / 0.9)',
            }}
          >
            <h2 className="font-sans text-lg font-bold text-foreground mb-5">
              {dict.orderTotal}
            </h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between font-body text-sm text-muted-foreground">
                <span>{dict.subtotal}</span>
                <span className="text-foreground font-medium">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-body text-sm text-muted-foreground">
                <span>{dict.tax}</span>
                <span className="text-foreground font-medium">
                  ${tax.toFixed(2)}
                </span>
              </div>
              <div
                className="h-px"
                style={{ background: 'oklch(0.88 0.012 80)' }}
              />
              <div className="flex justify-between font-sans font-bold text-foreground">
                <span>{dict.total}</span>
                <span style={{ color: 'oklch(0.42 0.09 210)' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <motion.button
              onClick={onOrder}
              disabled={cart.length === 0}
              whileHover={{ scale: cart.length === 0 ? 1 : 1.03 }}
              whileTap={{ scale: cart.length === 0 ? 1 : 0.97 }}
              className="w-full py-4 rounded-2xl text-white font-body font-bold text-base transition-all disabled:opacity-50"
              style={{
                background: 'oklch(0.42 0.09 210)',
                boxShadow: '6px 6px 18px oklch(0.42 0.09 210 / 0.4)',
              }}
            >
              {dict.orderNow} →
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ChevronDown, Check, Globe } from 'lucide-react'
import { type Language, LANGUAGES, dictionary } from '@/lib/dictionary'
import { MENU_ITEMS, type Category, type MenuItem } from '@/lib/menu-data'

interface CartItem {
  item: MenuItem
  qty: number
  notes: string
}

interface MenuViewProps {
  language: Language
  onLanguageChange: (lang: Language) => void
  cart: CartItem[]
  onAddToCart: (item: MenuItem) => void
  onCheckout: () => void
}

const CATEGORY_KEYS: { key: Category; dictKey: 'catSeafood' | 'catSteaks' | 'catEgyptian' | 'catCocktails' }[] = [
  { key: 'seafood', dictKey: 'catSeafood' },
  { key: 'steaks', dictKey: 'catSteaks' },
  { key: 'egyptian', dictKey: 'catEgyptian' },
  { key: 'cocktails', dictKey: 'catCocktails' },
]

const BADGE_COLORS: Record<string, string> = {
  Chef: 'oklch(0.75 0.14 78)',
  Popular: 'oklch(0.42 0.09 210)',
  New: 'oklch(0.6 0.08 140)',
  Vegan: 'oklch(0.55 0.12 145)',
}

function FoodCard({
  item,
  dict,
  onAdd,
  added,
}: {
  item: MenuItem
  dict: ReturnType<typeof dictionary[Language]>
  onAdd: () => void
  added: boolean
}) {
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
          alt={item.nameEn}
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
          {item.nameEn}
        </h3>
        <p className="font-body text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
          {item.descriptionEn}
        </p>

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
                <span>{dict.added}</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>{dict.addToCart}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export function MenuView({
  language,
  onLanguageChange,
  cart,
  onAddToCart,
  onCheckout,
}: MenuViewProps) {
  const dict = dictionary[language]
  const [activeCategory, setActiveCategory] = useState<Category>('seafood')
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set())
  const [langOpen, setLangOpen] = useState(false)

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0)
  const totalPrice = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0)

  const filteredItems = MENU_ITEMS.filter((i) => i.category === activeCategory)

  const handleAdd = (item: MenuItem) => {
    onAddToCart(item)
    setRecentlyAdded((prev) => new Set(prev).add(item.id))
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }, 1800)
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={dict.rtl ? 'rtl' : 'ltr'}
    >
      {/* Navbar */}
      <header
        className="sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between"
        style={{
          background: 'oklch(0.975 0.008 85 / 0.92)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 2px 16px oklch(0.84 0.012 80 / 0.4)',
          borderBottom: '1px solid oklch(0.9 0.01 80 / 0.5)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">⚓</span>
          <div>
            <div
              className="font-sans text-lg font-bold leading-tight"
              style={{ color: 'oklch(0.12 0.015 50)' }}
            >
              {dict.restaurantName}
            </div>
            <div
              className="font-body text-xs leading-none hidden sm:block"
              style={{ color: 'oklch(0.32 0.02 55)' }}
            >
              {dict.tagline}
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-sm font-medium transition-all"
              style={{
                background: 'oklch(0.99 0.004 85)',
                boxShadow: langOpen
                  ? 'inset 3px 3px 7px oklch(0.84 0.012 80), inset -2px -2px 6px oklch(1 0.003 90)'
                  : '4px 4px 10px oklch(0.84 0.012 80), -2px -2px 7px oklch(1 0.003 90)',
              }}
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{dict.flag}</span>
              <ChevronDown
                className="w-3 h-3 text-muted-foreground transition-transform"
                style={{ transform: langOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 right-0 w-52 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: 'oklch(0.99 0.004 85)',
                    boxShadow:
                      '12px 12px 30px oklch(0.84 0.012 80), -4px -4px 14px oklch(1 0.003 90)',
                    border: '1px solid oklch(0.9 0.01 80 / 0.5)',
                  }}
                >
                  {LANGUAGES.map((lang) => {
                    const d = dictionary[lang]
                    return (
                      <button
                        key={lang}
                        onClick={() => {
                          onLanguageChange(lang)
                          setLangOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 font-body text-sm hover:bg-secondary/60 transition-colors"
                        style={{
                          color:
                            lang === language
                              ? 'oklch(0.42 0.09 210)'
                              : 'oklch(0.35 0.015 60)',
                          fontWeight: lang === language ? 600 : 400,
                        }}
                      >
                        <span>{d.flag}</span>
                        <span>{d.langNative}</span>
                        {lang === language && (
                          <Check className="w-3.5 h-3.5 ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <button
            onClick={onCheckout}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl font-body text-sm font-semibold transition-all"
            style={{
              background: 'oklch(0.42 0.09 210)',
              color: 'white',
              boxShadow: '4px 4px 12px oklch(0.42 0.09 210 / 0.35)',
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.cart}</span>
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center font-body"
                style={{ color: 'oklch(0.15 0.02 50)' }}
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      {/* Category tabs */}
      <div
        className="sticky top-[60px] z-30 px-4 py-3"
        style={{
          background: 'oklch(0.975 0.008 85 / 0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid oklch(0.9 0.01 80 / 0.3)',
        }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORY_KEYS.map(({ key, dictKey }) => {
            const isActive = activeCategory === key
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="flex-shrink-0 px-5 py-2.5 rounded-2xl font-body text-sm font-semibold transition-all whitespace-nowrap"
                style={{
                  background: isActive
                    ? 'oklch(0.42 0.09 210)'
                    : 'oklch(0.99 0.004 85)',
                  color: isActive ? 'white' : 'oklch(0.25 0.02 55)',
                  boxShadow: isActive
                    ? '4px 4px 12px oklch(0.42 0.09 210 / 0.4), -2px -2px 6px oklch(0.56 0.06 210 / 0.15)'
                    : '4px 4px 10px oklch(0.84 0.012 80), -2px -2px 7px oklch(1 0.003 90)',
                }}
              >
                {dict[dictKey]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Menu grid */}
      <main className="flex-1 px-4 md:px-8 py-6">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                dict={dict}
                onAdd={() => handleAdd(item)}
                added={recentlyAdded.has(item.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Sticky checkout bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="sticky bottom-0 z-40 px-4 pb-4 pt-2"
            style={{
              background: 'oklch(0.975 0.008 85 / 0.92)',
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid oklch(0.9 0.01 80 / 0.5)',
            }}
          >
            <button
              onClick={onCheckout}
              className="w-full max-w-lg mx-auto flex items-center justify-between px-6 py-4 rounded-2xl text-white font-body font-semibold text-base transition-all"
              style={{
                background: 'oklch(0.42 0.09 210)',
                boxShadow: '6px 6px 18px oklch(0.42 0.09 210 / 0.4)',
              }}
            >
              <span>
                {totalItems} {totalItems === 1 ? dict.item : dict.items}
              </span>
              <span>{dict.done} →</span>
              <span>${totalPrice.toFixed(2)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

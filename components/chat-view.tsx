'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIChatbot } from '@/components/ai-chatbot'
import { ClientTranslator } from '@/components/client-translator'
import { type Language } from '@/lib/dictionary'
import { ChevronLeft, ChevronRight, MessageSquare, Languages } from 'lucide-react'

interface ChatViewProps {
  language: Language
}

export function ChatView({ language }: ChatViewProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'translator'>('chat')
  const isRTL = language === 'ar'

  return (
    <div className={`w-full h-full flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
        <h1 className="text-3xl font-bold mb-2">
          {isRTL ? 'نظام الطلب الذكي' : 'Intelligent Order System'}
        </h1>
        <p className="text-sm opacity-90">
          {isRTL ? 'تحدث مع كابتن الطلب المحترف' : 'Chat with Capten Order Pro'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border bg-secondary/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-all ${
            activeTab === 'chat'
              ? 'border-b-2 border-primary text-primary bg-white/50'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {isRTL ? 'المحادثة' : 'Chat'}
        </button>
        <button
          onClick={() => setActiveTab('translator')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-all ${
            activeTab === 'translator'
              ? 'border-b-2 border-primary text-primary bg-white/50'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Languages className="w-5 h-5" />
          {isRTL ? 'الترجمة' : 'Translator'}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -50 : 50 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col"
            >
              <div className="flex-1 overflow-auto p-4">
                <AIChatbot
                  language={language}
                  onSendMessage={(msg) => console.log('[v0] User message:', msg)}
                  onReceiveMessage={(msg) => console.log('[v0] Assistant response:', msg)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="translator"
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -50 : 50 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col"
            >
              <div className="flex-1 overflow-auto p-4">
                <ClientTranslator language={language} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="border-t border-border bg-secondary/30 p-4 text-center text-xs text-muted-foreground">
        <p>
          {isRTL
            ? '🔊 جميع الميزات تعمل محلياً في متصفحك - لا تتطلب اتصالاً بالإنترنت'
            : '🔊 All features work locally in your browser - No internet connection required'}
        </p>
      </div>
    </div>
  )
}

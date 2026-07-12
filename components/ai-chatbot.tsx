'use client'

import { useEffect, useRef, useState } from 'react'
import { pipeline, Pipeline } from '@huggingface/transformers'
import { Send, Loader, Volume2, Mic, Square } from 'lucide-react'
import { type Language } from '@/lib/dictionary'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatbotProps {
  language: Language
  onSendMessage?: (message: string) => void
  onReceiveMessage?: (message: string) => void
}

export function AIChatbot({ language, onSendMessage, onReceiveMessage }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا كابتن الطلب المحترف. كيف يمكنني مساعدتك اليوم؟',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pipelineRef = useRef<Pipeline | null>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        setInput(transcript)
      }
    }
  }, [])

  // Initialize the model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoadingProgress(0)
        console.log('[v0] Loading Qwen model...')

        // Qwen1.5-Chat is a decoder-only (causal) model, so it must use the
        // 'text-generation' pipeline, not 'text2text-generation'.
        const extractor = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat', {
          progress_callback: (progress: any) => {
            // transformers.js reports `progress` as a 0-100 percentage during
            // the 'progress' status. Other statuses have no percentage.
            if (progress?.status === 'progress' && typeof progress.progress === 'number') {
              setLoadingProgress(Math.min(100, Math.round(progress.progress)))
            }
          },
        })

        pipelineRef.current = extractor
        setModelLoaded(true)
        console.log('[v0] Model loaded successfully')
      } catch (error) {
        console.error('[v0] Error loading model:', error)
      }
    }

    loadModel()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || !modelLoaded || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    onSendMessage?.(userMessage)
    setIsLoading(true)

    try {
      // Format conversation history for the model
      const conversationHistory = messages
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')

      const prompt = `${conversationHistory}\nUser: ${userMessage}\nAssistant:`

      if (!pipelineRef.current) {
        console.error('[v0] Pipeline not initialized')
        return
      }

      const result = await pipelineRef.current(prompt, {
        max_new_tokens: 256,
        temperature: 0.7,
      })

      const assistantMessage = result[0].generated_text
        .split('Assistant:')
        .pop()
        ?.trim() || 'عذراً، لم أتمكن من فهم طلبك.'

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }])
      onReceiveMessage?.(assistantMessage)

      // Speak the response
      speakMessage(assistantMessage)
    } catch (error) {
      console.error('[v0] Error generating response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const speakMessage = async (text: string) => {
    // Use browser's built-in speech synthesis
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Set language based on selected language
      const languageMap: Record<Language, string> = {
        en: 'en-US',
        ar: 'ar-SA',
        ru: 'ru-RU',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        es: 'es-ES',
        zh: 'zh-CN',
        ja: 'ja-JP',
        pt: 'pt-BR',
        tr: 'tr-TR',
        ko: 'ko-KR',
      }
      
      utterance.lang = languageMap[language] || 'en-US'
      utterance.rate = 1
      utterance.pitch = 1
      
      window.speechSynthesis.cancel() // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance)
      console.log('[v0] Speaking message in language:', language)
    } catch (error) {
      console.error('[v0] Error speaking message:', error)
    }
  }

  const handleMicClick = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
        <h2 className="text-xl font-bold">كابتن الطلب الذكي</h2>
        <p className="text-sm opacity-90">Capten Order AI Assistant</p>
      </div>

      {/* Loading State */}
      {!modelLoaded && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground mb-2">جاري تحميل نموذج الذكاء الاصطناعي...</p>
          <div className="w-full max-w-xs bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{loadingProgress}%</p>
        </div>
      )}

      {/* Messages */}
      {modelLoaded && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-secondary text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.nativeEvent.isComposing &&
                    e.keyCode !== 229
                  ) {
                    handleSendMessage()
                  }
                }}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                onClick={handleMicClick}
                className={`p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
                title={isListening ? 'إيقاف الاستماع' : 'البدء في الاستماع'}
              >
                {isListening ? (
                  <Square className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              اضغط الميكروفون للكلام أو اكتب رسالتك
            </p>
          </div>
        </>
      )}
    </div>
  )
}

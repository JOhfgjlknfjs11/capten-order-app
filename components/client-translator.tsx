'use client'

import { useEffect, useRef, useState } from 'react'
import { pipeline, Pipeline } from '@huggingface/transformers'
import { Loader, Copy, Check } from 'lucide-react'
import { type Language, dictionary } from '@/lib/dictionary'

interface ClientTranslatorProps {
  language: Language
}

const LANGUAGE_CODES: Record<Language, string> = {
  en: 'eng_Latn',
  ar: 'ara_Arab',
  ru: 'rus_Cyrl',
  fr: 'fra_Latn',
  de: 'deu_Latn',
  it: 'ita_Latn',
  es: 'spa_Latn',
  zh: 'zho_Hans',
  ja: 'jpn_Jpan',
  pt: 'por_Latn',
  tr: 'tur_Latn',
  ko: 'kor_Hang',
}

export function ClientTranslator({ language }: ClientTranslatorProps) {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const pipelineRef = useRef<Pipeline | null>(null)

  // Initialize the translation model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoadingProgress(0)
        console.log('[v0] Loading M2M100 translation model...')

        const translator = await pipeline('translation', 'Xenova/m2m100_418M', {
          progress_callback: (progress: any) => {
            console.log('[v0] Translation model loading:', progress)
            setLoadingProgress(Math.round((progress.progress / progress.total) * 100))
          },
        })

        pipelineRef.current = translator
        setModelLoaded(true)
        console.log('[v0] Translation model loaded successfully')
      } catch (error) {
        console.error('[v0] Error loading translation model:', error)
      }
    }

    loadModel()
  }, [])

  const handleTranslate = async () => {
    if (!sourceText.trim() || !modelLoaded || isLoading) return

    setIsLoading(true)
    try {
      if (!pipelineRef.current) {
        console.error('[v0] Pipeline not initialized')
        return
      }

      const targetLanguage = LANGUAGE_CODES[language] || 'eng_Latn'

      const result = await pipelineRef.current(sourceText, {
        src_lang: 'eng_Latn',
        tgt_lang: targetLanguage,
        max_length: 512,
      })

      const translated = result[0]?.translation_text || 'فشلت الترجمة'
      setTranslatedText(translated)
      console.log('[v0] Translation completed:', translated)
    } catch (error) {
      console.error('[v0] Translation error:', error)
      setTranslatedText('حدث خطأ في الترجمة')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[v0] Copy failed:', error)
    }
  }

  const isRTL = language === 'ar'

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 rounded-lg border border-border bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        {isRTL ? 'مترجم محلي' : 'Local Translator'}
      </h2>

      {!modelLoaded && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {isRTL ? 'جاري تحميل نموذج الترجمة...' : 'Loading translation model...'}
          </p>
          <div className="w-full max-w-xs bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{loadingProgress}%</p>
        </div>
      )}

      {modelLoaded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              {isRTL ? 'النص الأصلي (الإنجليزية)' : 'Source Text (English)'}
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={isRTL ? 'أدخل النص هنا...' : 'Enter text here...'}
              className={`w-full h-48 bg-secondary border border-border rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none ${isRTL ? 'text-right' : 'text-left'}`}
              disabled={isLoading}
            />
          </div>

          {/* Target */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              {isRTL ? `النص المترجم (${dictionary[language].langNative})` : `Translated Text (${dictionary[language].langNative})`}
            </label>
            <textarea
              value={translatedText}
              readOnly
              placeholder={isRTL ? 'الترجمة ستظهر هنا...' : 'Translation will appear here...'}
              className={`w-full h-48 bg-secondary border border-border rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none ${isRTL ? 'text-right' : 'text-left'}`}
            />
          </div>
        </div>
      )}

      {modelLoaded && (
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isLoading}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                {isRTL ? 'جاري الترجمة...' : 'Translating...'}
              </span>
            ) : isRTL ? (
              'ترجم'
            ) : (
              'Translate'
            )}
          </button>

          {translatedText && (
            <button
              onClick={handleCopy}
              className="bg-secondary text-foreground px-6 py-2 rounded-lg hover:bg-secondary/80 transition-colors font-medium flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  {isRTL ? 'تم النسخ' : 'Copied'}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {isRTL ? 'نسخ' : 'Copy'}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

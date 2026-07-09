import { type Language, LANGUAGES } from './dictionary'

// خريطة الكلمات الرئيسية لكل لغة
const LANGUAGE_KEYWORDS: Record<Language, string[]> = {
  en: ['english', 'english language', 'hello', 'hi'],
  ar: ['العربية', 'عربي', 'arabic', 'hello', 'مرحبا'],
  ru: ['русский', 'russian', 'привет', 'русский язык'],
  fr: ['français', 'french', 'bonjour', 'la langue française'],
  de: ['deutsch', 'german', 'hallo', 'die deutsche sprache'],
  it: ['italiano', 'italian', 'ciao', 'la lingua italiana'],
  es: ['español', 'spanish', 'hola', 'la lengua española'],
  zh: ['中文', 'chinese', '你好', '普通话'],
  ja: ['日本語', 'japanese', 'こんにちは', '日本語'],
  pt: ['português', 'portuguese', 'olá', 'a língua portuguesa'],
  tr: ['türkçe', 'turkish', 'merhaba', 'türk dili'],
  ko: ['한국어', 'korean', '안녕하세요', '한국어'],
}

// خريطة أكواد اللغات للـ Web Speech API
const LANGUAGE_CODES: Record<Language, string> = {
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

/**
 * اكتشف اللغة من النص المحول من الكلام
 * يبحث عن كلمات مفتاحية ويرجع اللغة الأكثر احتمالاً
 */
export function detectLanguageFromSpeech(transcript: string): Language | null {
  if (!transcript || transcript.trim().length === 0) {
    return null
  }

  const lowerTranscript = transcript.toLowerCase().trim()

  // بحث أولي عن كلمات مفتاحية دقيقة
  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTranscript.includes(keyword.toLowerCase())) {
        return lang as Language
      }
    }
  }

  // محاولة اكتشاف من خلال الأحرف
  // إذا كان يحتوي على أحرف عربية
  if (/[\u0600-\u06FF]/.test(transcript)) {
    return 'ar'
  }

  // إذا كان يحتوي على أحرف صينية
  if (/[\u4E00-\u9FFF]/.test(transcript)) {
    return 'zh'
  }

  // إذا كان يحتوي على أحرف يابانية
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(transcript)) {
    return 'ja'
  }

  // إذا كان يحتوي على أحرف كورية
  if (/[\uAC00-\uD7AF]/.test(transcript)) {
    return 'ko'
  }

  // إذا كان يحتوي على أحرف روسية
  if (/[\u0400-\u04FF]/.test(transcript)) {
    return 'ru'
  }

  // إذا كان يحتوي على أحرف تركية مميزة
  if (/[çğıöşüÇĞİÖŞÜ]/.test(transcript)) {
    return 'tr'
  }

  // الافتراضي هو الإنجليزية
  return 'en'
}

/**
 * احصل على كود اللغة للـ Web Speech API
 */
export function getSpeechLanguageCode(language: Language): string {
  return LANGUAGE_CODES[language]
}

/**
 * قائمة بجميع اللغات المدعومة
 */
export function getSupportedLanguages(): Array<{ code: Language; name: string }> {
  return LANGUAGES.map((lang) => ({
    code: lang,
    name: lang,
  }))
}

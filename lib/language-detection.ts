import { type Language, LANGUAGES } from './dictionary'

// خريطة الكلمات الرئيسية لكل لغة - مع متغيرات وكلمات مرادفة متعددة
const LANGUAGE_KEYWORDS: Record<Language, string[]> = {
  en: ['english', 'english language', 'hello', 'hi', 'ang', 'eng'],
  ar: ['العربية', 'عربي', 'العربي', 'arabic', 'ara', 'مرحبا', 'سلام', 'التعريب'],
  ru: ['русский', 'russian', 'привет', 'русский язык', 'рус'],
  fr: ['français', 'french', 'bonjour', 'la langue française', 'fra', 'fre'],
  de: ['deutsch', 'german', 'hallo', 'die deutsche sprache', 'deu', 'ger', 'duitsch'],
  it: ['italiano', 'italian', 'ciao', 'la lingua italiana', 'ita', 'ita'],
  es: ['español', 'spanish', 'hola', 'la lengua española', 'spa', 'spa', 'hispano'],
  zh: ['中文', 'chinese', '你好', '普通话', '汉语', 'zho', 'chi', '中国'],
  ja: ['日本語', 'japanese', 'こんにちは', '日本語', 'jpn', 'jap', '日本'],
  pt: ['português', 'portuguese', 'olá', 'a língua portuguesa', 'por', 'pts'],
  tr: ['türkçe', 'turkish', 'merhaba', 'türk dili', 'tur', 'tr'],
  ko: ['한국어', 'korean', '안녕하세요', '한국어', 'kor', 'ko', '한국'],
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
  const words = lowerTranscript.split(/\s+/)

  // بحث أولي عن كلمات مفتاحية دقيقة
  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      // بحث دقيق - بداية الكلمة أو محتوى كامل
      if (lowerTranscript.includes(keywordLower)) {
        return lang as Language
      }
      // بحث على مستوى الكلمات المنفصلة
      if (words.some(word => word.includes(keywordLower) || keywordLower.includes(word))) {
        return lang as Language
      }
    }
  }

  // محاولة اكتشاف من خلال الأحرف - الأولوية الأعلى
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

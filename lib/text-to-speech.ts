import { type Language } from './dictionary'

const VOICE_ID = 'hpp4J3VqNfWAUOO0d1Us'

interface TextToSpeechOptions {
  language?: Language
  voiceId?: string
  stability?: number
  similarityBoost?: number
}

/**
 * تحويل النص إلى كلام باستخدام ElevenLabs
 */
export async function textToSpeech(
  text: string,
  options: TextToSpeechOptions = {}
): Promise<ArrayBuffer | null> {
  try {
    const voiceId = options.voiceId || VOICE_ID
    const language = options.language || 'en'

    console.log('[v0] TTS Request:', { text: text.substring(0, 30), voiceId: voiceId.substring(0, 8), language })

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        language,
        stability: options.stability || 0.5,
        similarityBoost: options.similarityBoost || 0.75,
      }),
    })

    console.log('[v0] TTS Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] TTS error:', response.statusText, errorText)
      return null
    }

    const buffer = await response.arrayBuffer()
    console.log('[v0] TTS Success:', buffer.byteLength, 'bytes')
    return buffer
  } catch (error) {
    console.error('[v0] TTS error:', error)
    return null
  }
}

/**
 * تشغيل الصوت من ArrayBuffer (MP3)
 */
export async function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve) => {
    try {
      console.log('[v0] بدء تشغيل الصوت، الحجم:', audioBuffer.byteLength)
      
      // أنشئ Blob من ArrayBuffer
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      // استخدم عنصر audio لتشغيل الصوت
      const audio = new Audio()
      audio.src = url
      audio.type = 'audio/mpeg'

      let resolved = false
      const cleanup = () => {
        if (!resolved) {
          resolved = true
          URL.revokeObjectURL(url)
          resolve()
        }
      }

      audio.onended = () => {
        console.log('[v0] انتهى تشغيل الصوت')
        cleanup()
      }

      audio.onerror = (error) => {
        console.error('[v0] خطأ في تشغيل الصوت:', error)
        cleanup()
      }

      // timeout safety - 35 ثانية
      const timeout = setTimeout(() => {
        console.log('[v0] انتهت مهلة الصوت')
        cleanup()
      }, 35000)

      // محاولة تشغيل الصوت
      const playPromise = audio.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise
          .then(() => {
            console.log('[v0] بدأ تشغيل الصوت بنجاح')
          })
          .catch((error) => {
            console.error('[v0] خطأ في تشغيل الصوت:', error)
            clearTimeout(timeout)
            cleanup()
          })
      }
    } catch (error) {
      console.error('[v0] خطأ في إعداد الصوت:', error)
      resolve()
    }
  })
}

/**
 * تشغيل النص الصوتي مباشرة
 */
export async function speakText(
  text: string,
  options: TextToSpeechOptions = {}
): Promise<void> {
  try {
    const audioBuffer = await textToSpeech(text, options)
    if (audioBuffer) {
      await playAudio(audioBuffer)
    }
  } catch (error) {
    console.error('[v0] Speak error:', error)
  }
}

/**
 * رسائل الترحيب والتأكيد بجميع اللغات
 */
export const GREETING_MESSAGES: Record<Language, string> = {
  en: 'Welcome to our exciting journey! To begin: What is your native language?',
  ar: 'أهلاً وسهلاً في رحلتنا المثيرة! لنبدأ الآن: ما هي لغتك الأم؟',
  ru: 'Добро пожаловать в нашу захватывающую жизнь! Чтобы начать: Какой ваш родной язык?',
  fr: 'Bienvenue dans notre voyage passionnant! Pour commencer: Quelle est votre langue maternelle?',
  de: 'Willkommen in unserer spannenden Reise! Um zu beginnen: Was ist deine Muttersprache?',
  it: 'Benvenuto nel nostro emozionante viaggio! Per iniziare: Qual è la tua lingua madre?',
  es: '¡Bienvenido a nuestro emocionante viaje! Para empezar: ¿Cuál es tu lengua materna?',
  zh: '欢迎来到我们的激动人心的旅程！ 开始吧：您的母语是什么？',
  ja: 'わたしたちのエキサイティングな旅へようこそ！ 始めるには：あなたの母国語は何ですか？',
  pt: 'Bem-vindo à nossa jornada emocionante! Para começar: Qual é sua língua materna?',
  tr: 'Heyecan verici yolculuğumuza hoş geldiniz! Başlamak için: Anadil nedir?',
  ko: '우리의 흥미 진진한 여정에 오신 것을 환영합니다! 시작하려면: 모국어가 무엇입니까?',
}

export const CONFIRMATION_MESSAGES: Record<Language, string> = {
  en: 'You have successfully reached the language. To confirm, click on the language button below.',
  ar: 'لقد وصلت بنجاح إلى اللغة. للتأكيد، انقر على زر اللغة أدناه.',
  ru: 'Вы успешно достигли языка. Для подтверждения нажмите кнопку языка ниже.',
  fr: 'Vous avez atteint avec succès la langue. Pour confirmer, cliquez sur le bouton de langue ci-dessous.',
  de: 'Sie haben die Sprache erfolgreich erreicht. Klicken Sie zur Bestätigung auf die Schaltfläche "Sprache" unten.',
  it: 'Hai raggiunto con successo la lingua. Per confermare, fai clic sul pulsante della lingua di seguito.',
  es: 'Ha llegado exitosamente al idioma. Para confirmar, haga clic en el botón de idioma a continuación.',
  zh: '您已成功到达该语言。 要确认，请单击下面的语言按钮。',
  ja: '言語に正常に到達しました。 確認するには、下の言語ボタンをクリックしてください。',
  pt: 'Você chegou com sucesso ao idioma. Para confirmar, clique no botão de idioma abaixo.',
  tr: 'Dile başarıyla ulaştınız. Onaylamak için aşağıdaki dil düğmesini tıklayın.',
  ko: '언어에 성공적으로 도달했습니다. 확인하려면 아래 언어 버튼을 클릭하십시오.',
}

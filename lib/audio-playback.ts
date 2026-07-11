/**
 * تشغيل ArrayBuffer صوتي مع إخراج مستوى الصوت اللحظي (0..1)
 * يُستخدم لتحريك فم الأفاتار متزامناً مع الكلام.
 */

export interface AmplitudePlaybackHandle {
  stop: () => void
  finished: Promise<void>
}

/**
 * حركة فم تقديرية بدون صوت (عند نفاد حصة الصوت أو حظر التشغيل التلقائي).
 * تقدّر مدة الكلام من طول النص وتولّد نبضات فم طبيعية.
 */
export function simulateSpeech(
  text: string,
  onAmplitude: (level: number) => void
): AmplitudePlaybackHandle {
  let stopped = false
  let rafId = 0
  let resolveFinished: () => void = () => {}
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })

  // ~65 حرف في الثانية تقريباً لإيقاع كلام مريح
  const durationMs = Math.min(16000, Math.max(2500, (text.length / 12) * 1000))
  const start = performance.now()

  const stop = () => {
    if (stopped) return
    stopped = true
    if (rafId) cancelAnimationFrame(rafId)
    onAmplitude(0)
    resolveFinished()
  }

  const tick = (now: number) => {
    if (stopped) return
    const elapsed = now - start
    if (elapsed >= durationMs) {
      stop()
      return
    }
    // نبض فم شبيه بالمقاطع الصوتية: موجتان جيبيتان + عشوائية خفيفة
    const t = elapsed / 140
    const base = (Math.sin(t) * 0.5 + 0.5) * (Math.sin(t * 2.3) * 0.5 + 0.5)
    const level = Math.min(1, base * 0.8 + Math.random() * 0.15)
    onAmplitude(level)
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
  return { stop, finished }
}

export function playWithAmplitude(
  audioBuffer: ArrayBuffer,
  onAmplitude: (level: number) => void
): AmplitudePlaybackHandle {
  let stopped = false
  let ctx: AudioContext | null = null
  let source: AudioBufferSourceNode | null = null
  let rafId = 0
  let resolveFinished: () => void = () => {}

  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })

  const cleanup = () => {
    if (rafId) cancelAnimationFrame(rafId)
    onAmplitude(0)
    try {
      source?.stop()
    } catch {}
    try {
      ctx?.close()
    } catch {}
    resolveFinished()
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    cleanup()
  }

  const run = async () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const decoded = await ctx.decodeAudioData(audioBuffer.slice(0))
      if (stopped) {
        cleanup()
        return
      }

      source = ctx.createBufferSource()
      source.buffer = decoded

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.6
      const data = new Uint8Array(analyser.frequencyBinCount)

      source.connect(analyser)
      analyser.connect(ctx.destination)

      const tick = () => {
        if (stopped) return
        analyser.getByteTimeDomainData(data)
        // حساب RMS حول المنتصف (128)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        // تضخيم وتحجيم إلى 0..1
        const level = Math.min(1, rms * 3.2)
        onAmplitude(level)
        rafId = requestAnimationFrame(tick)
      }

      source.onended = () => {
        if (!stopped) {
          stopped = true
          cleanup()
        }
      }

      source.start(0)
      rafId = requestAnimationFrame(tick)
    } catch {
      // fallback بدون تحليل: مجرد تشغيل عبر HTMLAudio
      try {
        const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => {
          URL.revokeObjectURL(url)
          stop()
        }
        // نبض وهمي بسيط للفم أثناء التشغيل
        const fakeTick = () => {
          if (stopped) return
          onAmplitude(0.35 + Math.random() * 0.4)
          rafId = requestAnimationFrame(fakeTick)
        }
        audio.play().then(() => {
          rafId = requestAnimationFrame(fakeTick)
        }).catch(() => stop())
      } catch {
        stop()
      }
    }
  }

  run()

  return { stop, finished }
}

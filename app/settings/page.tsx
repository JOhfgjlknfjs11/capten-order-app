'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const [voiceId, setVoiceId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('elevenlabs_voice_id') || ''
    }
    return ''
  })
  const [saved, setSaved] = useState(false)
  const [testText, setTestText] = useState('Welcome to Capten Order, luxury fine dining')
  const [isPlaying, setIsPlaying] = useState(false)
  const [testLanguage, setTestLanguage] = useState('en')

  const handleSaveVoiceId = () => {
    if (voiceId.trim()) {
      localStorage.setItem('elevenlabs_voice_id', voiceId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleTestTTS = async () => {
    if (!voiceId.trim()) {
      alert('Please enter a Voice ID first')
      return
    }

    setIsPlaying(true)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId,
          language: testLanguage,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.error}`)
        return
      }

      const audioBuffer = await response.arrayBuffer()
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        setIsPlaying(false)
      }

      audio.play().catch((err) => {
        console.error('[v0] Audio playback error:', err)
        setIsPlaying(false)
      })
    } catch (error) {
      console.error('[v0] TTS test error:', error)
      alert('Failed to generate speech')
      setIsPlaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-accent hover:opacity-80 mb-6">
            <span>←</span>
            <span>Back to App</span>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure ElevenLabs voice for text-to-speech</p>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Voice ID Configuration */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-foreground mb-4">ElevenLabs Voice Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Voice ID
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Enter your ElevenLabs Voice ID. Get it from{' '}
                  <a
                    href="https://elevenlabs.io/app/voice-library"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Voice Library
                  </a>
                </p>
                <input
                  type="text"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  placeholder="e.g., 21m00Tcm4TlvDq8ikWAM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-gray-400"
                />
              </div>

              <button
                onClick={handleSaveVoiceId}
                className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-opacity-90 transition"
              >
                Save Voice ID
              </button>

              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg"
                >
                  ✓ Voice ID saved successfully
                </motion.div>
              )}
            </div>
          </div>

          {/* Test TTS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-foreground mb-4">Test Text-to-Speech</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Test Language
                </label>
                <select
                  value={testLanguage}
                  onChange={(e) => setTestLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="it">Italiano (Italian)</option>
                  <option value="pt">Português (Portuguese)</option>
                  <option value="ru">Русский (Russian)</option>
                  <option value="ja">日本語 (Japanese)</option>
                  <option value="zh">中文 (Chinese)</option>
                  <option value="tr">Türkçe (Turkish)</option>
                  <option value="ko">한국어 (Korean)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Test Text
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-gray-400 resize-none"
                  placeholder="Enter text to test..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {testText.length}/500 characters
                </p>
              </div>

              <button
                onClick={handleTestTTS}
                disabled={isPlaying}
                className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition"
              >
                {isPlaying ? '🔊 Playing...' : '▶ Play Audio'}
              </button>
            </div>
          </div>

          {/* API Documentation */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h2 className="text-lg font-bold text-foreground mb-3">API Endpoint</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use this endpoint to generate speech from your frontend or backend:
            </p>
            <div className="bg-white rounded-lg p-4 font-mono text-xs overflow-x-auto border border-gray-200">
              <div className="text-gray-600 mb-2">POST /api/tts</div>
              <pre className="text-foreground">{`{
  "text": "Your text here",
  "voiceId": "your-voice-id",
  "language": "en"
}`}</pre>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Returns audio/mpeg stream. Language codes: en, ar, fr, de, es, it, pt, ru, ja, zh, tr, ko
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

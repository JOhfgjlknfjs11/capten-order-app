# Capten Order - Setup Guide

## Required Environment Variables

### 1. ElevenLabs API Key (For Avatar Voice)
**Variable Name:** `ELEVENLABS_API_KEY`

- Get your API key from: https://elevenlabs.io
- Create an account or log in
- Go to your API settings
- Copy your API key
- Add it to your environment variables

**Current Voice ID:** `wWWn96OtTHu1sn8SRGEr`

### 2. Gemini API Key (For Menu Descriptions)
**Variable Name:** `GEMINI_API_KEY`

- Get your API key from: https://aistudio.google.com/app/apikeys
- Click "Create API Key"
- Select or create a new Google Cloud project
- Copy the API key
- Add it to your environment variables

## Features Implemented

### Avatar System
- ✅ Professional talking avatar (Capten Order Captain)
- ✅ Custom voice ID: `wWWn96OtTHu1sn8SRGEr`
- ✅ Persistent avatar across language selection

### Language Detection
- ✅ Microphone button in bottom-left corner
- ✅ Automatic language detection from speech
- ✅ Real-time transcription
- ✅ Supports 12+ languages

### Gemini Integration
- ✅ Professional menu item descriptions
- ✅ Captain persona for food recommendations
- ✅ Real-time description generation
- ✅ Multi-language support

## How to Set Environment Variables

### For Local Development:
1. Create a `.env.local` file in the project root
2. Add your API keys:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_key
   GEMINI_API_KEY=your_gemini_key
   ```
3. Restart your development server

### For Vercel Deployment:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the following variables:
   - `ELEVENLABS_API_KEY`
   - `GEMINI_API_KEY`
4. Redeploy your project

## Testing the Features

1. **Avatar Voice**: Go to language selection page and listen to the greeting
2. **Microphone Button**: Click the microphone button in the bottom-left to test language detection
3. **Gemini Descriptions**: Add an item to cart and view the dynamically generated description

## Troubleshooting

### If audio is not playing:
- Check if `ELEVENLABS_API_KEY` is set correctly
- Verify the voice ID: `wWWn96OtTHu1sn8SRGEr`
- Check browser console for errors

### If menu descriptions don't load:
- Check if `GEMINI_API_KEY` is set correctly
- Verify the API key has access to the Gemini API
- Check network tab for failed requests to `/api/gemini-menu`

### If speech recognition doesn't work:
- Ensure your browser allows microphone access
- Check if using HTTPS (required for microphone in production)
- Test in Chrome or Firefox (best support)

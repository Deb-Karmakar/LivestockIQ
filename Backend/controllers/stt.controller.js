// backend/controllers/stt.controller.js
// Speech-to-Text using Groq's Whisper model (free)

import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.GROQ_KEY
});

/**
 * Convert speech to text using Groq Whisper
 * Accepts base64 audio and returns transcribed text
 */
export const transcribeSpeech = async (req, res) => {
    let tempFilePath = null;

    try {
        const { audio, language = 'hi' } = req.body;

        if (!audio) {
            return res.status(400).json({ message: 'Audio data is required' });
        }

        // Decode base64 audio and save to temp file
        const audioBuffer = Buffer.from(audio, 'base64');

        // Create temp file with .m4a extension (what expo-av records)
        tempFilePath = path.join(os.tmpdir(), `stt_${Date.now()}.m4a`);
        fs.writeFileSync(tempFilePath, audioBuffer);

        console.log(`STT: Processing audio file, size: ${audioBuffer.length} bytes`);

        // Use Groq Whisper for transcription (NOT translation)
        // Setting language explicitly and adding prompt helps keep original language
        const langCode = language === 'hi' ? 'hi' : 'en';

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-large-v3',
            language: langCode,
            response_format: 'json',
            // Prompt helps Whisper understand context and keep the language
            prompt: langCode === 'hi'
                ? 'यह हिंदी में बोली गई बातचीत है। कृपया हिंदी में ही लिखें।'
                : 'This is a conversation in English.',
        });

        console.log(`STT: Transcription result: "${transcription.text}"`);

        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        res.json({
            text: transcription.text,
            language: language
        });

    } catch (error) {
        console.error('STT Error:', error);

        // Clean up temp file on error
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        res.status(500).json({
            message: 'Failed to transcribe audio',
            error: error.message
        });
    }
};

// backend/controllers/tts.controller.js
// Google Translate TTS - Using a more reliable URL format

/**
 * Split text into chunks at sentence boundaries
 */
const splitIntoChunks = (text, maxLength = 180) => {
    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        // Try to split at sentence boundaries (., !, ?, |, ।)
        let splitIndex = -1;
        const sentenceEnders = ['. ', '। ', '? ', '! ', '|'];

        for (const ender of sentenceEnders) {
            const idx = remaining.lastIndexOf(ender, maxLength);
            if (idx > splitIndex && idx < maxLength) {
                splitIndex = idx + ender.length;
            }
        }

        // If no sentence boundary, try comma or space
        if (splitIndex <= 0) {
            const commaIdx = remaining.lastIndexOf(', ', maxLength);
            const spaceIdx = remaining.lastIndexOf(' ', maxLength);
            splitIndex = Math.max(commaIdx, spaceIdx);
        }

        // If still nothing, just split at maxLength
        if (splitIndex <= 0) {
            splitIndex = maxLength;
        }

        chunks.push(remaining.substring(0, splitIndex).trim());
        remaining = remaining.substring(splitIndex).trim();
    }

    return chunks;
};

/**
 * Fetch audio for a single chunk using Google Translate TTS
 */
const fetchAudioChunk = async (text, langCode, chunkIndex) => {
    // Use different client parameter which is more reliable
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&total=1&idx=${chunkIndex}&textlen=${text.length}&client=gtx&tk=&prev=input`;

    console.log(`TTS Fetching chunk ${chunkIndex}: ${text.substring(0, 50)}...`);

    const response = await fetch(ttsUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        }
    });

    console.log(`TTS Response status: ${response.status}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`TTS Error response: ${errorText.substring(0, 200)}`);
        throw new Error(`TTS request failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`TTS Got audio buffer: ${arrayBuffer.byteLength} bytes`);
    return Buffer.from(arrayBuffer);
};

/**
 * Convert text to speech using Google Translate TTS
 * Supports long messages by splitting into chunks
 */
export const synthesizeSpeech = async (req, res) => {
    try {
        const { text, language = 'en' } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: 'Text is required' });
        }

        const langCode = language === 'hi' ? 'hi' : 'en';

        // Split text into chunks
        const chunks = splitIntoChunks(text);
        console.log(`\n=== TTS Request ===`);
        console.log(`Language: ${langCode}`);
        console.log(`Total length: ${text.length} chars`);
        console.log(`Chunks: ${chunks.length}`);

        // Fetch audio for all chunks
        const audioBuffers = [];
        for (let i = 0; i < chunks.length; i++) {
            try {
                const buffer = await fetchAudioChunk(chunks[i], langCode, i);
                if (buffer && buffer.length > 0) {
                    audioBuffers.push(buffer);
                }
                // Small delay to avoid rate limiting
                if (chunks.length > 1 && i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (err) {
                console.error(`Chunk ${i} TTS error:`, err.message);
            }
        }

        if (audioBuffers.length === 0) {
            console.error('TTS: No audio chunks generated!');
            throw new Error('No audio chunks generated');
        }

        // Combine all audio buffers
        const combinedBuffer = Buffer.concat(audioBuffers);
        const audioBase64 = combinedBuffer.toString('base64');

        console.log(`TTS Success: ${audioBuffers.length} chunks, ${combinedBuffer.length} bytes total`);
        console.log(`===================\n`);

        res.json({
            audio: audioBase64,
            contentType: 'audio/mpeg',
            language: language,
            chunks: chunks.length,
            totalBytes: combinedBuffer.length
        });

    } catch (error) {
        console.error('TTS Error:', error.message);
        res.status(500).json({
            message: 'Failed to synthesize speech',
            error: error.message,
            fallbackToDevice: true
        });
    }
};

/**
 * Get available voices
 */
export const getVoices = async (req, res) => {
    res.json({
        voices: [
            { name: 'Hindi Female', language: 'hi', quality: 'standard' },
            { name: 'English Female', language: 'en', quality: 'standard' }
        ],
        note: 'Using Google Translate TTS - supports long messages'
    });
};

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Set CORS headers
    const allowedOrigins = ['https://hack-calendar.vercel.app', 'http://localhost:3001', 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Accept both legacy (prompt) and new (contents) payloads
        let prompt = req.body.prompt;
        if (!prompt && req.body.contents && Array.isArray(req.body.contents)) {
            // Try to extract prompt from contents[0].parts[0].text
            const parts = req.body.contents[0]?.parts;
            if (parts && Array.isArray(parts) && typeof parts[0]?.text === "string") {
                prompt = parts[0].text;
            }
        }
        const temperature = req.body.temperature ?? 0.7;
        const max_tokens = req.body.max_tokens ?? 2000;

        // Prepare Gemini API call
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
        }

        const model = "gemini-2.0-flash-exp";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Build generation config from request body
        const generationConfig = {
            temperature,
            maxOutputTokens: max_tokens,
            responseMimeType: "application/json"
        };
        
        // Include responseSchema if provided
        if (req.body.generationConfig?.responseSchema) {
            generationConfig.responseSchema = req.body.generationConfig.responseSchema;
        }
        
        const payload = {
            contents: [{
                parts: [typeof prompt === "string" ? { text: prompt } : {}]
            }],
            generationConfig
        };

        const apiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const rawText = await apiRes.text();
        let apiData;
        
        try {
            apiData = JSON.parse(rawText);
        } catch (parseErr) {
            console.error('Failed to parse Gemini API response as JSON:', parseErr);
            return res.status(502).json({ error: 'Invalid JSON from Gemini API', raw: rawText });
        }

        if (!apiRes.ok) {
            const errorMessage = apiData.error?.message || apiData.message || "Gemini API error";
            console.error('Gemini API error:', errorMessage);
            return res.status(apiRes.status).json({ error: errorMessage, raw: rawText });
        }

        // Send the raw Gemini API response to match frontend expectations
        return res.json(apiData);
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
};
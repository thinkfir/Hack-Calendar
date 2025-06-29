const fetch = require('node-fetch');

// Netlify Function format
exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    // Handle preflight OPTIONS requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        
        // Accept both legacy (prompt) and new (contents) payloads
        let prompt = body.prompt;
        if (!prompt && body.contents && Array.isArray(body.contents)) {
            const parts = body.contents[0]?.parts;
            if (parts && Array.isArray(parts) && typeof parts[0]?.text === "string") {
                prompt = parts[0].text;
            }
        }
        
        const temperature = body.temperature ?? 0.7;
        const max_tokens = body.max_tokens ?? 2000;

        // Prepare Gemini API call
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
            };
        }

        const model = "gemini-2.0-flash-exp";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Build generation config
        const generationConfig = {
            temperature,
            maxOutputTokens: max_tokens,
            responseMimeType: "application/json"
        };
        
        if (body.generationConfig?.responseSchema) {
            generationConfig.responseSchema = body.generationConfig.responseSchema;
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
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ error: 'Invalid JSON from Gemini API', raw: rawText }),
            };
        }

        if (!apiRes.ok) {
            const errorMessage = apiData.error?.message || apiData.message || "Gemini API error";
            console.error('Gemini API error:', errorMessage);
            return {
                statusCode: apiRes.status,
                headers,
                body: JSON.stringify({ error: errorMessage, raw: rawText }),
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(apiData),
        };
    } catch (err) {
        console.error('Function error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Function error', details: err.message }),
        };
    }
};
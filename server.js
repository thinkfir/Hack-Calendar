    // server.js - Express proxy for Gemini API and static file server
    const express = require('express');
    const genaiModule = require('@google/genai');
    console.log('[@google/genai] module export:', genaiModule);
    // Comment out destructuring and usage to avoid crash for now
    // const { GoogleGenAI } = genaiModule;
    // console.log('[GoogleGenAI] value:', GoogleGenAI);
    // const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const cors = require('cors');
    const path = require('path'); // Import the 'path' module to handle file paths
    
    require('dotenv').config(); // Load environment variables from .env file
    
    const app = express();
    const PORT = process.env.PORT || 3001; // Use port from .env or default to 3001
    
        // const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    
    // Middleware to enable CORS for all requests (important for development)
    app.use(cors());
    // Middleware to parse JSON bodies from incoming requests
    app.use(express.json());
    
    // Serve static files from the current directory (where server.js is located)
    app.use(express.static(__dirname));
    
    // Simple per-IP rate limiting
    const RATE_LIMIT = Infinity; // No rate limit for API requests
    const ipUsage = {}; // Object to track IP usage for rate limiting
    
    // Clear IP usage every hour to reset the rate limit
    setInterval(() => {
        for (const ip in ipUsage) delete ipUsage[ip];
    }, 60 * 60 * 1000); // 1 hour
    
    // POST endpoint to proxy requests to the Gemini API
    app.post('/gemini', async (req, res) => {
        console.log('Received POST /gemini');
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ipUsage[ip] = (ipUsage[ip] || 0) + 1;
        if (ipUsage[ip] > RATE_LIMIT) {
            return res.status(429).json({ error: 'Usage limit reached. Please try again later.' });
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
            const model = "gemini-2.5-flash";
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            console.log('Gemini payload prompt:', prompt);
            const payload = {
                contents: [{
                    parts: [typeof prompt === "string" ? { text: prompt } : {}]
                }],
                generationConfig: {
                    temperature,
                    maxOutputTokens: max_tokens,
                    responseMimeType: "application/json"
                }
            };

            const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
            const apiRes = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            // Log status and raw response for debugging
            console.log('Gemini API status:', apiRes.status);
            const rawText = await apiRes.text();
            console.log('Gemini API raw response:', rawText);

            let apiData;
            try {
                apiData = JSON.parse(rawText);
            } catch (parseErr) {
                console.error('Failed to parse Gemini API response as JSON:', parseErr);
                return res.status(502).json({ error: 'Invalid JSON from Gemini API', raw: rawText });
            }

            if (!apiRes.ok) {
                const errorMessage = apiData.error?.message || apiData.message || "Gemini API error";
                return res.status(apiRes.status).json({ error: errorMessage, raw: rawText });
            }

            // Extract the text response from Gemini
            const text = apiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

            const formattedResponse = {
                choices: [{
                    message: {
                        content: text
                    }
                }]
            };
            // Send the raw Gemini API response to match frontend expectations
            return res.json(apiData);

            res.json(formattedResponse);
        } catch (err) {
            console.error('Proxy error:', err);
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
    });
    
    // Start the Express server
    app.listen(PORT, () => {
        console.log(`Gemini proxy and static file server running on http://localhost:${PORT}`);
    });

    // server.js - Express proxy for Groq API and static file server
    const express = require('express');
    // Corrected: For node-fetch v3+ in CommonJS, access the .default export
    const fetch = require('node-fetch').default; 
    const cors = require('cors');
    const path = require('path'); // Import the 'path' module to handle file paths

    require('dotenv').config(); // Load environment variables from .env file

    const app = express();
    const PORT = process.env.PORT || 3001; // Use port from .env or default to 3001
    const GROQ_API_KEY = process.env.GROQ_API_KEY; // Your Groq API key, loaded from .env

    // Middleware to enable CORS for all requests (important for development)
    app.use(cors());
    // Middleware to parse JSON bodies from incoming requests
    app.use(express.json());

    // Serve static files from the current directory (where server.js is located)
    // This will serve your index.html, script.js, style.css, etc.
    // When you navigate to http://localhost:3001/, it will serve index.html by default.
    app.use(express.static(__dirname));

    // Simple per-IP rate limiting for Advanced AI (Groq proxy)
    // Note: While this rate limit is set to Infinity, in a real production app
    // you'd want to implement robust rate limiting to protect your API keys.
    const RATE_LIMIT = Infinity; // No rate limit for Groq API requests
    const ipUsage = {}; // Object to track IP usage for rate limiting

    // Clear IP usage every hour to reset the rate limit
    setInterval(() => {
        // Reset usage for all IPs
        for (const ip in ipUsage) delete ipUsage[ip];
    }, 60 * 60 * 1000); // 60 minutes * 60 seconds * 1000 milliseconds = 1 hour

    // POST endpoint to proxy requests to the Groq API
    app.post('/groq', async (req, res) => {
        // Get client IP for rate limiting (if RATE_LIMIT was not Infinity)
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ipUsage[ip] = (ipUsage[ip] || 0) + 1;
        if (ipUsage[ip] > RATE_LIMIT) {
            // If rate limit exceeded, send a 429 Too Many Requests response
            return res.status(429).json({ error: 'Usage limit reached for Advanced AI. Please try again later.' });
        }

        try {
            // Destructure request body to get messages, model, temperature, and max_tokens
            // Changed default model from 'mixtral-8x7b-32768' to 'llama3-8b-8192'
            const { messages, model = 'llama3-8b-8192', temperature = 0.7, max_tokens = 2000 } = req.body;

            // Make the fetch request to the official Groq API endpoint
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST', // Use POST method
                headers: {
                    'Content-Type': 'application/json', // Specify content type as JSON
                    'Authorization': `Bearer ${GROQ_API_KEY}` // Authorize with your Groq API key
                },
                // Stringify the request body JSON
                body: JSON.stringify({
                    model,      // The AI model to use
                    messages,   // Array of message objects (chat history)
                    temperature, // Controls randomness of the output
                    max_tokens  // Maximum number of tokens to generate
                })
            });

            // Parse the JSON response from Groq
            const data = await groqRes.json();
            console.log('Response from Groq API:', data); // <--- ADD THIS LINE

            // Send the Groq response back to the client with the same status
            res.status(groqRes.status).json(data);
        } catch (err) {
            // Catch any errors during the proxy process and send a 500 error response
            console.error('Proxy error:', err); // Log the error on the server
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
    });

    // Start the Express server
    app.listen(PORT, () => {
        console.log(`Groq proxy and static file server running on http://localhost:${PORT}`);
    });

// server.js - Express proxy for Groq API (keeps API key secret)
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json());

app.post('/groq', async (req, res) => {
  try {
    const { messages, model = 'mixtral-8x7b-32768', temperature = 0.7, max_tokens = 2000 } = req.body;
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });
    const data = await groqRes.json();
    res.status(groqRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Groq proxy server running on port ${PORT}`);
});
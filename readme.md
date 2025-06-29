# Hack Calendar

A hackathon project planner that uses AI to help create tasks and a schedule.

## Demo Video

https://streamable.com/nov7k6

## Deployment

### Vercel Deployment

This project is configured for deployment on Vercel. The configuration includes:

- `vercel.json` - Vercel deployment configuration
- Server-side API proxy at `/gemini` endpoint
- CORS configuration for production and development environments

### Environment Variables

Required environment variables:
- `GEMINI_API_KEY` - Your Google Gemini API key

### Local Development

1. Copy `.env.example` to `.env`
2. Add your Gemini API key to `.env`
3. Run `npm install`
4. Run `npm start` or `node server.js`
5. Open `http://localhost:3001`

### Production URLs

- Production: `https://hack-calendar.vercel.app`
- API Endpoint: `https://hack-calendar.vercel.app/gemini`

## Features

- Smart calendar with AI assistance
- Event planning and scheduling
- Integration with Google Gemini for intelligent suggestions


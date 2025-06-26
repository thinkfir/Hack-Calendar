const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
//heartbeat
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

// Routes
const hackathonRoutes = require('./routes/hackathons');
const authRoutes = require('./routes/auth');

app.use('/api/hackathons', hackathonRoutes);
app.use('/api/auth', authRoutes);

// Fallback to index.html for client-side routing
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
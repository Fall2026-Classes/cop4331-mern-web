const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';

app.use(express.json());

// Sample API Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running perfectly!', database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// Serve compiled React frontend files in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all route to redirect users back to React Router if needed
app.get('*', (req, res) => {
  res.sendFile(path.resolve(clientBuildPath, 'index.html'));
});

// Connect to MongoDB container service and start Express server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully.');
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('Database connection error:', err);
    // Still run the server even if DB fails initially so Nginx doesn't crash on bad proxy pass
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (No DB connection)`));
  });

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
// The movie-reviews API (cop4331-mern-backend). Every /api request is forwarded to it.
const API_URL = new URL(process.env.API_URL || 'http://localhost:5001');

// Health check for this web server itself.
app.get('/health', (req, res) => {
  res.json({ status: 'Web server is running', api: API_URL.origin });
});

// Forward /api/* (method, headers, body) to the API and stream the answer back.
app.use('/api', (req, res) => {
  const upstream = http.request(
    {
      hostname: API_URL.hostname,
      port: API_URL.port || 80,
      path: req.originalUrl,
      method: req.method,
      headers: { ...req.headers, host: API_URL.host },
    },
    (apiRes) => {
      res.writeHead(apiRes.statusCode, apiRes.headers);
      apiRes.pipe(res);
    }
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'API is not reachable' });
  });
  req.pipe(upstream);
});

// Serve compiled React frontend files in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all route to redirect users back to React Router if needed
app.get('*', (req, res) => {
  res.sendFile(path.resolve(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}, API at ${API_URL.origin}`));

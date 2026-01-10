const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// Serve all static files from the current directory
app.use(express.static(path.join(__dirname)));

// For any route that doesn't match a file, serve index.html (SPA-style)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Neurochat server listening on port ${port}`);
});

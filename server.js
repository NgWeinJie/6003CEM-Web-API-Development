const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

// Serve static files from these folders
app.use(express.static(path.join(__dirname, 'html')));
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/image', express.static(path.join(__dirname, 'image')));

// Optional: serve home.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'home.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

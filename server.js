const express = require('express');
const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start the server and log a message
const port = 5002;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

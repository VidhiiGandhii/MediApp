const express = require('express');
const app = express();
const port = 3000; // You can use any port that is not in use

// Middleware to parse JSON bodies
app.use(express.json());

// A simple "route" to test the server
app.get('/', (req, res) => {
  res.send('Hello from the MediApp Backend!');
});

// A sample route for user login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // In a real app, you would check the email and password against a database
  console.log('Login attempt:', email, password);

  // For now, we'll just send a success message
  if (email && password) {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
});

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
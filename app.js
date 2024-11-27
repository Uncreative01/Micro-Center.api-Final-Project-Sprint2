const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const usersRouter = require('./routes/users');  // Import users routes
const productsRouter = require('./routes/products');  // Import products routes
const purchasesRouter = require('./routes/purchases');

const app = express();
const prisma = new PrismaClient();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Setup session middleware before any routes
app.use(session({
  secret: 'your_secret_key',  // Set a secret key for encrypting the session cookie
  resave: false,  // Don't resave the session if it hasn't changed
  saveUninitialized: true,  // Save a session even if it's not initialized
  cookie: { secure: false }  // Use 'secure: true' if using HTTPS
}));

// Use the users and products routes
app.use('/users', usersRouter);  // Prefix all user routes with /users
app.use('/products', productsRouter);  // Prefix all product routes with /products

// Example Route: Test Route to check server status
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

// Test Session Route: To check if user data is stored in session
app.get('/users/check-session', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ message: 'Session exists', user: req.session.user });
  } else {
    res.status(401).json({ error: 'Session does not exist' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

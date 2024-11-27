const express = require('express');
const bcrypt = require('bcrypt');
const passwordValidator = require('password-validator');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create a password schema with the required policy
const passwordSchema = new passwordValidator();

// Password policy rules
passwordSchema
  .is().min(8)                                    // Minimum length 8
  .is().max(20)                                   // Maximum length 20 (optional, you can modify it)
  .has().uppercase()                              // At least 1 uppercase letter
  .has().lowercase()                              // At least 1 lowercase letter
  .has().digits()                                  // At least 1 number
  .has().not().spaces();                          // No spaces allowed

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Validate the password using the defined schema
  if (!passwordSchema.validate(password)) {
    return res.status(400).json({ error: 'Password does not meet the required policy.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password

    const user = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        first_name,
        last_name,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Email must be unique.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.customer.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Store user data in the session
    req.session.user = {
      customer_id: user.customer_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    res.status(200).json({ message: 'Login successful', user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase route
router.post('/purchase', async (req, res) => {
  // Ensure user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'User not logged in' });  // Unauthorized
  }

  const { street, city, province, country, postal_code, credit_card, credit_expire, credit_cvv, cart, invoice_amt, invoice_tax, invoice_total } = req.body;

  if (!street || !city || !province || !country || !postal_code || !credit_card || !credit_expire || !credit_cvv || !cart || !invoice_amt || !invoice_tax || !invoice_total) {
    return res.status(400).json({ error: 'All fields are required' });  // Bad Request
  }

  // Parse the cart to get product quantities
  const cartItems = cart.split(',').map(productId => Number(productId));

  if (cartItems.some(isNaN)) {
    return res.status(400).json({ error: 'Invalid cart data' });  // Bad Request
  }

  const customer_id = req.session.user.customer_id;

  try {
    // Create the Purchase record
    const purchase = await prisma.purchase.create({
      data: {
        customer_id,
        street,
        city,
        province,
        country,
        postal_code,
        credit_card,
        credit_expire,
        credit_cvv,
        invoice_amt,
        invoice_tax,
        invoice_total,
      },
    });

    // Loop through the cart items and create PurchaseItem records
    for (const product_id of cartItems) {
      // Here we should first check if the product exists
      const product = await prisma.product.findUnique({ where: { product_id } });

      if (!product) {
        return res.status(404).json({ error: `Product with id ${product_id} not found` });
      }

      // Check if the product already exists in the purchase (handle quantity)
      const existingItem = await prisma.purchaseItem.findUnique({
        where: {
          purchase_id_product_id: {
            purchase_id: purchase.purchase_id,
            product_id,
          },
        },
      });

      if (existingItem) {
        // If the product exists, update the quantity
        await prisma.purchaseItem.update({
          where: {
            purchase_id_product_id: {
              purchase_id: purchase.purchase_id,
              product_id,
            },
          },
          data: {
            quantity: existingItem.quantity + 1, // Increment the quantity
          },
        });
      } else {
        // If the product doesn't exist in the purchase, create a new PurchaseItem
        await prisma.purchaseItem.create({
          data: {
            purchase_id: purchase.purchase_id,
            product_id,
            quantity: cartItems.filter(id => id === product_id).length, // Calculate quantity
          },
        });
      }
    }

    res.status(200).json({ message: 'Purchase completed successfully', purchase });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the purchase' });
  }
});

// Test session route
router.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ session: req.session.user }); // Return session data
  } else {
    res.status(401).json({ error: 'No active session' }); // No session data found
  }
});

// User profile route
router.get('/profile', (req, res) => {
  if (req.session.user) {
    res.status(200).json({
      message: 'User profile',
      user: req.session.user,
    });
  } else {
    res.status(401).json({ error: 'User not logged in' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }
    res.status(200).json({ message: 'Logged out successfully.' });
  });
});

module.exports = router;

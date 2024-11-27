
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

// POST /purchase route to handle the purchase process
router.post('/purchase', async (req, res) => {
  // Step 1: Check if the user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'User not logged in.' });
  }

  // Step 2: Extract data from the request body
  const {
    street,
    city,
    province,
    country,
    postal_code,
    credit_card,
    credit_expire,
    credit_cvv,
    cart, // Comma-delimited string of product IDs, e.g., "2,5,5,4"
    invoice_amt,
    invoice_tax,
    invoice_total,
  } = req.body;

  // Validate required fields
  if (
    !street ||
    !city ||
    !province ||
    !country ||
    !postal_code ||
    !credit_card ||
    !credit_expire ||
    !credit_cvv ||
    !cart ||
    !invoice_amt ||
    !invoice_tax ||
    !invoice_total
  ) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Step 3: Parse the cart and get product IDs
  const productIds = cart.split(',').map((id) => parseInt(id, 10));

  // Step 4: Fetch the products from the database
  try {
    const products = await prisma.product.findMany({
      where: { product_id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({ error: 'Some products not found.' });
    }

    // Step 5: Create a new Purchase record
    const purchase = await prisma.purchase.create({
      data: {
        customer_id: req.session.user.customer_id,
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
        order_date: new Date(), // Set current date as order date
      },
    });

    // Step 6: Create PurchaseItem records for each product in the cart
    const purchaseItems = productIds.map((productId) => {
      const product = products.find((prod) => prod.product_id === productId);
      return {
        purchase_id: purchase.purchase_id,
        product_id: productId,
        quantity: productIds.filter((id) => id === productId).length, // Count quantity
      };
    });

    // Insert all PurchaseItems
    await prisma.purchaseItem.createMany({
      data: purchaseItems,
    });

    // Step 7: Respond with success
    res.status(201).json({
      message: 'Purchase completed successfully.',
      purchase: {
        purchase_id: purchase.purchase_id,
        customer_id: purchase.customer_id,
        street: purchase.street,
        city: purchase.city,
        province: purchase.province,
        country: purchase.country,
        postal_code: purchase.postal_code,
        invoice_amt: purchase.invoice_amt,
        invoice_tax: purchase.invoice_tax,
        invoice_total: purchase.invoice_total,
        order_date: purchase.order_date,
      },
      items: purchaseItems,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error processing purchase.' });
  }
});

module.exports = router;

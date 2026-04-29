const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { Transaction } = require('../models');
const authenticate = require('../middleware/auth');

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

/**
 * GET /api/wallet/balance
 * Returns the authenticated user's current balance.
 */
router.get('/balance', authenticate, (req, res) => {
  return res.json({ success: true, balance: req.user.balance });
});

/**
 * GET /api/wallet/transactions
 * Paginated transaction history for the authenticated user.
 */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { count, rows } = await Transaction.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return res.json({ success: true, total: count, page: parseInt(page), transactions: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/wallet/deposit
 * Creates a Razorpay order. Frontend uses the returned orderId to open the payment modal.
 */
// router.post('/deposit', authenticate, async (req, res) => {
//   const { amount } = req.body;

//   if (!amount || isNaN(amount) || amount < 10 || amount > 100000) {
//     return res.status(400).json({ success: false, message: 'Amount must be between ₹10 and ₹1,00,000' });
//   }

//   try {
//     const order = await razorpay.orders.create({
//       amount: Math.round(amount * 100), // Razorpay works in paise
//       currency: 'INR',
//       receipt: `dep_${Date.now()}`,
//       notes: { user_id: req.user.id, user_name: req.user.name },
//     });

//     return res.json({
//       success: true,
//       orderId: order.id,
//       amount,
//       currency: 'INR',
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error('Razorpay order error:', err);
//     return res.status(500).json({ success: false, message: 'Failed to create payment order' });
//   }
// });

/**
 * POST /api/wallet/withdraw
 * Creates a pending withdrawal request. Admin processes it manually via the admin panel.
 */
router.post('/withdraw', authenticate, async (req, res) => {
  const { amount, account_number, ifsc, account_holder } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ success: false, message: 'Minimum withdrawal is ₹100' });
  }
  if (!account_number || !ifsc || !account_holder) {
    return res.status(400).json({ success: false, message: 'Bank details are required' });
  }

  try {
    await sequelize.transaction(async (t) => {
      const user = await req.user.reload({ lock: t.LOCK.UPDATE, transaction: t });
      if (parseFloat(user.balance) < amount) {
        throw Object.assign(new Error('Insufficient balance'), { status: 400 });
      }

      const balanceBefore = parseFloat(user.balance);
      const balanceAfter = balanceBefore - amount;

      await user.update({ balance: balanceAfter }, { transaction: t });

      await Transaction.create(
        {
          user_id: req.user.id,
          type: 'withdrawal',
          amount: -amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: 'pending', // Admin will mark as completed after processing
          description: `Withdrawal ₹${amount} → ${account_holder} | ${account_number} | ${ifsc}`,
        },
        { transaction: t }
      );
    });

    return res.json({
      success: true,
      message: 'Withdrawal request submitted. Admin will process within 24 hours.',
    });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;

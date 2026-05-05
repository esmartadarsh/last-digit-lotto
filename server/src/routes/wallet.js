const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sequelize } = require('../config/database');
const { User, Transaction } = require('../models');
const authenticate = require('../middleware/auth');

/**
 * Helper to get Razorpay instance dynamically (ensures env vars are loaded)
 */
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

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
router.post('/deposit', authenticate, async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) < 10 || Number(amount) > 100000) {
    return res.status(400).json({ success: false, message: 'Amount must be between ₹10 and ₹1,00,000' });
  }

  try {
    const razorpay = getRazorpayInstance();
    
    // Create receipt: `dep_<timestamp>` to guarantee it's under 40 chars
    const receiptStr = `dep_${Date.now()}`;
    
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // Razorpay works in paise
      currency: 'INR',
      receipt: receiptStr,
      notes: {
        user_id: req.user.id,
        user_name: req.user.name || 'Player',
      },
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: Number(amount),
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

/**
 * POST /api/wallet/verify-payment
 * Called by the frontend immediately after the Razorpay checkout handler fires.
 * Verifies the HMAC signature server-side, then credits the user's wallet atomically.
 * This is the no-webhook approach — fully self-contained.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }
 */
router.post('/verify-payment', authenticate, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
    return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
  }

  // 1. Verify signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.warn('⚠️  Invalid Razorpay payment signature');
    return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
  }

  try {
    // 2. Check for duplicate — don't credit twice for the same payment ID
    const existing = await Transaction.findOne({
      where: { reference_id: razorpay_payment_id },
    });
    if (existing) {
      return res.json({ success: true, message: 'Payment already credited', alreadyCredited: true });
    }

    // 3. Credit balance atomically
    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(req.user.id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!user) throw new Error('User not found');

      const depositAmount = Number(amount);
      const balanceBefore = parseFloat(user.balance);
      const balanceAfter = balanceBefore + depositAmount;

      await user.update({ balance: balanceAfter }, { transaction: t });

      await Transaction.create(
        {
          user_id: req.user.id,
          type: 'deposit',
          amount: depositAmount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference_id: razorpay_payment_id,
          reference_type: 'razorpay_payment',
          status: 'completed',
          description: `Razorpay deposit ₹${depositAmount} (Order: ${razorpay_order_id})`,
        },
        { transaction: t }
      );
    });

    console.log(`✅ Deposit ₹${amount} credited to user ${req.user.id} via verify-payment`);
    return res.json({ success: true, message: `₹${amount} successfully added to your wallet!` });
  } catch (err) {
    console.error('❌ verify-payment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to credit wallet. Contact support.' });
  }
});

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

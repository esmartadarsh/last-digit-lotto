const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sequelize } = require('../config/database');
const { User, Transaction } = require('../models');

/**
 * POST /api/webhooks/razorpay
 * Razorpay calls this after a payment is captured.
 * NOTE: This route uses express.raw() middleware (registered in app.js).
 * Verifies HMAC signature before crediting balance.
 */
router.post('/razorpay', async (req, res) => {
  try {
    const rawBody = req.body.toString();
    const signature = req.headers['x-razorpay-signature'];

    // Verify Razorpay signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSig) {
      console.warn('⚠️  Invalid Razorpay webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);

    // Only process successful payments
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const userId = payment.notes?.user_id;
      const amount = payment.amount / 100; // paise → rupees

      if (!userId) {
        console.warn('⚠️  Razorpay webhook: no user_id in payment notes');
        return res.json({ success: true });
      }

      await sequelize.transaction(async (t) => {
        const user = await User.findByPk(userId, { lock: t.LOCK.UPDATE, transaction: t });
        if (!user) return;

        const balanceBefore = parseFloat(user.balance);
        const balanceAfter = balanceBefore + amount;

        await user.update({ balance: balanceAfter }, { transaction: t });

        await Transaction.create(
          {
            user_id: userId,
            type: 'deposit',
            amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            reference_id: payment.id,
            reference_type: 'razorpay_payment',
            status: 'completed',
            description: `Razorpay deposit ₹${amount} (Payment ID: ${payment.id})`,
          },
          { transaction: t }
        );
      });

      console.log(`✅ Deposit ₹${amount} credited to user ${userId}`);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;

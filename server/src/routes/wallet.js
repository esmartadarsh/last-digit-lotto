const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Transaction } = require('../models');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const DEPOSIT_EXPIRY_MINUTES = 15;

const generateOrderId = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN${yyyy}${mm}${dd}${random}`;
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
 * Creates a pending deposit request for manual UPI payment.
 */
router.post('/deposit', authenticate, async (req, res) => {
  const { amount } = req.body;

  const parsed = Number(amount);
  if (!amount || isNaN(parsed) || parsed < 10 || parsed > 100000) {
    return res.status(400).json({ success: false, message: 'Amount must be between ₹10 and ₹1,00,000' });
  }

  try {
    const orderId = generateOrderId();
    const user = await User.findByPk(req.user.id);

    // Save deposit request in DB with status pending
    await Transaction.create({
      user_id: req.user.id,
      type: 'deposit',
      amount: parsed,
      balance_before: user.balance,
      balance_after: user.balance, // balance doesn't change yet
      reference_id: orderId,
      reference_type: 'upi_deposit',
      status: 'pending',
      description: `Manual UPI deposit ₹${parsed} (Order: ${orderId})`
    });

    return res.json({
      success: true,
      amount: parsed,
      orderId,
      message: 'Deposit request created.'
    });
  } catch (err) {
    console.error('Deposit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process deposit. Please try again.' });
  }
});

/**
 * POST /api/wallet/deposit/utr
 * User submits UTR for a pending deposit. Transitions status: pending → submitted.
 * Validates: UTR format, no duplicates, not expired.
 */
router.post('/deposit/utr', authenticate, async (req, res) => {
  const { orderId, utr } = req.body;

  const utrClean = String(utr || '').replace(/\D/g, '');
  if (!orderId || utrClean.length < 12) {
    return res.status(400).json({ success: false, message: 'Please provide a valid UTR number (minimum 12 digits)' });
  }

  try {
    // Prevent duplicate UTR across ALL transactions
    const duplicateUtr = await Transaction.findOne({
      where: { description: { [Op.like]: `%UTR: ${utrClean}%` } }
    });
    if (duplicateUtr) {
      return res.status(400).json({ success: false, message: 'This UTR number has already been submitted. Contact support if this is an error.' });
    }

    const tx = await Transaction.findOne({
      where: {
        user_id: req.user.id,
        reference_id: orderId,
        type: 'deposit',
        reference_type: 'upi_deposit',
      }
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    if (tx.status === 'completed') {
      return res.json({ success: true, message: 'This deposit has already been approved.' });
    }
    if (tx.status === 'failed') {
      return res.status(400).json({ success: false, message: 'This deposit was rejected. Please start a new deposit.' });
    }
    if (tx.status === 'reversed') {
      return res.status(400).json({ success: false, message: 'This deposit has expired. Please start a new deposit.' });
    }
    if (tx.status === 'pending') {
      // Check expiry (15 minutes from creation)
      const ageMs = Date.now() - new Date(tx.created_at).getTime();
      if (ageMs > DEPOSIT_EXPIRY_MINUTES * 60 * 1000) {
        await tx.update({ status: 'reversed' });
        return res.status(400).json({ success: false, message: 'This deposit order has expired. Please create a new deposit.' });
      }
    }

    // Transition: pending → submitted (reuse description to carry UTR)
    await tx.update({
      status: 'pending', // stays pending until admin approves, but we store UTR
      description: tx.description.replace(/\|\s*UTR:.*$/, '') + ` | UTR: ${utrClean}`
    });

    return res.json({ success: true, message: 'UTR submitted successfully! Admin will verify your payment shortly.' });
  } catch (err) {
    console.error('UTR submit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit UTR.' });
  }
});

/* ═══════════════════════════ ADMIN: DEPOSIT MANAGEMENT ═══════════════════════════ */

/**
 * GET /api/wallet/admin/deposits
 * Admin: list all UPI deposit requests (pending, completed, failed, reversed).
 */
router.get('/admin/deposits', authenticate, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const where = { reference_type: 'upi_deposit', type: 'deposit' };
    if (status) where.status = status;

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return res.json({ success: true, total: count, deposits: rows });
  } catch (err) {
    console.error('Admin deposits fetch error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/wallet/admin/deposits/:txId/approve
 * Admin: approve a pending UPI deposit → credit user wallet.
 * Guards against double credit.
 */
router.post('/admin/deposits/:txId/approve', authenticate, adminOnly, async (req, res) => {
  try {
    const tx = await Transaction.findByPk(req.params.txId);
    if (!tx || tx.reference_type !== 'upi_deposit') {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }
    if (tx.status === 'completed') {
      return res.json({ success: true, message: 'Already approved — no changes made.' });
    }
    if (tx.status === 'reversed') {
      return res.status(400).json({ success: false, message: 'Cannot approve an expired deposit.' });
    }
    if (tx.status === 'failed') {
      return res.status(400).json({ success: false, message: 'Cannot approve a rejected deposit.' });
    }

    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(tx.user_id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!user) throw new Error('User not found');

      const depositAmount = parseFloat(tx.amount);
      const balanceBefore = parseFloat(user.balance);
      const balanceAfter = balanceBefore + depositAmount;

      await user.update({ balance: balanceAfter }, { transaction: t });
      await tx.update({
        status: 'completed',
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: tx.description + ` | Approved by admin`,
      }, { transaction: t });
    });

    console.log(`✅ UPI Deposit approved: ₹${tx.amount} for user ${tx.user_id} (Tx: ${tx.id})`);
    return res.json({ success: true, message: `Deposit of ₹${tx.amount} approved and wallet credited.` });
  } catch (err) {
    console.error('Deposit approve error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve deposit.' });
  }
});

/**
 * POST /api/wallet/admin/deposits/:txId/reject
 * Admin: reject a pending UPI deposit.
 */
router.post('/admin/deposits/:txId/reject', authenticate, adminOnly, async (req, res) => {
  const { reason } = req.body;
  try {
    const tx = await Transaction.findByPk(req.params.txId);
    if (!tx || tx.reference_type !== 'upi_deposit') {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }
    if (tx.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already approved deposit.' });
    }
    if (tx.status === 'failed') {
      return res.json({ success: true, message: 'Already rejected.' });
    }

    await tx.update({
      status: 'failed',
      description: tx.description + ` | Rejected by admin${reason ? ': ' + reason : ''}`,
    });

    return res.json({ success: true, message: 'Deposit rejected.' });
  } catch (err) {
    console.error('Deposit reject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject deposit.' });
  }
});

/**
 * POST /api/wallet/withdraw
 * Creates a pending withdrawal request via UPI or Bank Transfer.
 * Balance is locked (deducted) immediately; refunded if admin rejects.
 */
router.post('/withdraw', authenticate, async (req, res) => {
  const { amount, payment_method = 'upi', upi_id, account_holder, account_number, ifsc_code, bank_name } = req.body;

  const parsed = Number(amount);
  if (!parsed || isNaN(parsed) || parsed < 100) {
    return res.status(400).json({ success: false, message: 'Minimum withdrawal is ₹100' });
  }

  let referenceType, description;

  if (payment_method === 'bank') {
    if (!account_holder || account_holder.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide account holder name' });
    }
    if (!account_number || account_number.trim().length < 9) {
      return res.status(400).json({ success: false, message: 'Please provide a valid account number' });
    }
    if (!ifsc_code || ifsc_code.trim().length < 11) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 11-character IFSC code' });
    }
    if (!bank_name || bank_name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide bank name' });
    }
    referenceType = 'bank_withdrawal';
    description = `Withdrawal ₹${parsed} via Bank Transfer | Account Holder: ${account_holder.trim()} | Account Number: ${account_number.trim()} | IFSC: ${ifsc_code.trim().toUpperCase()} | Bank: ${bank_name.trim()}`;
  } else {
    // Default: UPI
    if (!upi_id || upi_id.trim().length < 5 || !upi_id.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid UPI ID (e.g. name@upi)' });
    }
    referenceType = 'upi_withdrawal';
    description = `Withdrawal ₹${parsed} via UPI | UPI ID: ${upi_id.trim()}`;
  }

  try {
    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(req.user.id, { lock: t.LOCK.UPDATE, transaction: t });
      if (parseFloat(user.balance) < parsed) {
        throw Object.assign(new Error('Insufficient balance'), { status: 400 });
      }

      const balanceBefore = parseFloat(user.balance);
      const balanceAfter = balanceBefore - parsed;

      await user.update({ balance: balanceAfter }, { transaction: t });

      await Transaction.create(
        {
          user_id: req.user.id,
          type: 'withdrawal',
          amount: -parsed,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference_type: referenceType,
          status: 'pending',
          description,
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

/* ═══════════════════════════ ADMIN: WITHDRAWAL MANAGEMENT ═══════════════════════════ */

/**
 * GET /api/wallet/admin/withdrawals
 * Admin: list all UPI withdrawal requests.
 */
router.get('/admin/withdrawals', authenticate, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { reference_type: { [Op.in]: ['upi_withdrawal', 'bank_withdrawal'] }, type: 'withdrawal' };
    if (status) where.status = status;

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return res.json({ success: true, total: count, withdrawals: rows });
  } catch (err) {
    console.error('Admin withdrawals fetch error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/wallet/admin/withdrawals/:txId/approve
 * Admin: mark withdrawal as processed (payment sent to user's UPI).
 */
router.post('/admin/withdrawals/:txId/approve', authenticate, adminOnly, async (req, res) => {
  try {
    const tx = await Transaction.findByPk(req.params.txId);
    if (!tx || !['upi_withdrawal', 'bank_withdrawal'].includes(tx.reference_type)) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }
    if (tx.status === 'completed') {
      return res.json({ success: true, message: 'Already marked as processed.' });
    }
    if (tx.status === 'failed') {
      return res.status(400).json({ success: false, message: 'Cannot approve a rejected withdrawal.' });
    }

    await tx.update({
      status: 'completed',
      description: tx.description + ` | Processed by admin`,
    });

    console.log(`✅ Withdrawal processed: ₹${Math.abs(tx.amount)} for user ${tx.user_id} (Tx: ${tx.id})`);
    return res.json({ success: true, message: `Withdrawal of ₹${Math.abs(tx.amount)} marked as processed.` });
  } catch (err) {
    console.error('Withdrawal approve error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve withdrawal.' });
  }
});

/**
 * POST /api/wallet/admin/withdrawals/:txId/reject
 * Admin: reject a pending withdrawal → refund user balance.
 */
router.post('/admin/withdrawals/:txId/reject', authenticate, adminOnly, async (req, res) => {
  const { reason } = req.body;
  try {
    const tx = await Transaction.findByPk(req.params.txId);
    if (!tx || !['upi_withdrawal', 'bank_withdrawal'].includes(tx.reference_type)) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }
    if (tx.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already processed withdrawal.' });
    }
    if (tx.status === 'failed') {
      return res.json({ success: true, message: 'Already rejected.' });
    }

    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(tx.user_id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!user) throw new Error('User not found');

      // Refund the withheld amount
      const refundAmount = Math.abs(parseFloat(tx.amount));
      const balanceBefore = parseFloat(user.balance);
      const balanceAfter = balanceBefore + refundAmount;

      await user.update({ balance: balanceAfter }, { transaction: t });
      await tx.update({
        status: 'failed',
        description: tx.description + ` | Rejected by admin${reason ? ': ' + reason : ''}`,
      }, { transaction: t });
    });

    return res.json({ success: true, message: 'Withdrawal rejected and balance refunded to user.' });
  } catch (err) {
    console.error('Withdrawal reject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject withdrawal.' });
  }
});

module.exports = router;

import { IoWalletOutline } from 'react-icons/io5';
import { FiArrowDownLeft, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import useAuthStore from '../store/useAuthStore';
import formatDate12Hour from '@/utils/formatDate12Hour';
import api from '../config/api';

const isNative = Capacitor.isNativePlatform();

export default function Balance() {
  const { user, token, refreshProfile } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // Load Razorpay web script only on browser (not needed for native app)
  useEffect(() => {
    if (isNative) return; // Native uses capacitor-razorpay plugin, no script needed
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await api.get('/wallet/transactions?limit=20');
        if (res.data.success) {
          setTransactions(res.data.transactions);
        }
      } catch (err) {
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  /** Shared: verify payment with server and credit wallet */
  const verifyAndCredit = async (paymentId, orderId, signature, amount) => {
    toast.loading('Verifying payment...', { id: 'verify' });
    try {
      const verifyRes = await api.post('/wallet/verify-payment', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        amount,
      });
      toast.dismiss('verify');
      if (verifyRes.data.success) {
        toast.success(verifyRes.data.message || 'Wallet topped up successfully! 🎉');
        await refreshProfile();
        const txRes = await api.get('/wallet/transactions?limit=20');
        if (txRes.data.success) setTransactions(txRes.data.transactions);
      } else {
        toast.error(verifyRes.data.message || 'Payment verification failed. Contact support.');
      }
    } catch (err) {
      toast.dismiss('verify');
      toast.error(err.response?.data?.message || 'Could not verify payment. Contact support.');
    }
  };

  const handleDeposit = (amountToDeposit) => {
    if (!amountToDeposit) {
      setDepositAmount('100');
      setIsDepositModalOpen(true);
      return;
    }
    processDeposit(amountToDeposit);
  };

  const processDeposit = async (amountToDeposit) => {
    const amount = Number(amountToDeposit);
    if (isNaN(amount) || amount < 10) {
      toast.error('Minimum deposit amount is ₹10.');
      return;
    }
    if (amount > 100000) {
      toast.error('Maximum deposit amount is ₹1,00,000.');
      return;
    }

    try {
      // Step 1: Create Razorpay order on server (same for both native & web)
      const { data } = await api.post('/wallet/deposit', { amount: Number(amount) });
      if (!data.success) throw new Error(data.message);

      console.log(isNative, 'check')

      const { Checkout } = await import('capacitor-razorpay');
      try {
        const result = await Checkout.open({
          key: data.key,
          amount: String(data.amount * 100), // paise, must be a string
          currency: data.currency,
          name: 'Last Digit Lotto',
          description: 'Wallet Top-Up',
          order_id: data.orderId,
          prefill: {
            name: user?.name || 'Player',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: { color: '#dc2626' },
        });
        // result.response contains paymentId, orderId, signature
        const r = result.response;
        await verifyAndCredit(r.razorpay_payment_id, r.razorpay_order_id, r.razorpay_signature, data.amount);
      } catch (nativeErr) {
        // User cancelled or payment failed
        if (nativeErr?.code === 0) {
          toast('Payment cancelled.', { icon: '❌' });
        } else {
          toast.error(`Payment failed: ${nativeErr?.description || nativeErr?.message || 'Unknown error'}`);
        }
      }

      if (isNative) {
        // ── NATIVE ANDROID: use Razorpay native SDK via Capacitor plugin ──────
        const { Checkout } = await import('capacitor-razorpay');
        try {
          const result = await Checkout.open({
            key: data.key,
            amount: String(data.amount * 100), // paise, must be a string
            currency: data.currency,
            name: 'Last Digit Lotto',
            description: 'Wallet Top-Up',
            order_id: data.orderId,
            prefill: {
              name: user?.name || 'Player',
              email: user?.email || '',
              contact: user?.phone || '',
            },
            theme: { color: '#dc2626' },
          });
          // result.response contains paymentId, orderId, signature
          const r = result.response;
          await verifyAndCredit(r.razorpay_payment_id, r.razorpay_order_id, r.razorpay_signature, data.amount);
        } catch (nativeErr) {
          // User cancelled or payment failed
          if (nativeErr?.code === 0) {
            toast('Payment cancelled.', { icon: '❌' });
          } else {
            toast.error(`Payment failed: ${nativeErr?.description || nativeErr?.message || 'Unknown error'}`);
          }
        }
      } else {
        // ── WEB BROWSER: use standard Razorpay web checkout ───────────────────
        const options = {
          key: data.key,
          amount: data.amount * 100,
          currency: data.currency,
          name: 'Last Digit Lotto',
          description: 'Wallet Top-Up',
          order_id: data.orderId,
          handler: async (response) => {
            await verifyAndCredit(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature,
              data.amount
            );
          },
          prefill: {
            name: user?.name || 'Player',
            email: user?.email || '',
          },
          theme: { color: '#dc2626' },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          toast.error(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      }

    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to initiate deposit');
    }
  };

  const currentBalance = user ? parseFloat(user.balance) : 0;

  // Quick calc
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(parseFloat(t.amount)), 0);

  const getTxIconData = (tx) => {
    if (tx.type === 'deposit') return { icon: FiArrowDownLeft, bg: '#dcfce7', color: '#16a34a' };
    if (tx.type === 'win_lottery' || tx.type === 'win_abc') return { icon: FiTrendingUp, bg: '#dcfce7', color: '#16a34a' };
    if (tx.type === 'withdrawal') return { icon: FiArrowUpRight, bg: '#fee2e2', color: '#dc2626' };
    return { icon: FiArrowUpRight, bg: '#fee2e2', color: '#dc2626' }; // Default spend
  };

  return (
    <div className="pb-24">

      {/* ── Colorful Header ── */}
      <div
        className="px-5 pt-5 pb-16"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
        }}
      >
        <h1 className="text-[22px] font-black text-white tracking-tight">My Wallet 💳</h1>
        <p className="text-emerald-100 text-xs font-medium mt-0.5">Manage your funds securely</p>
      </div>

      {/* ── Balance Card (overlapping header) ── */}
      <div className="px-4 -mt-10">
        <div
          className="relative rounded-3xl p-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #1d4ed8 100%)',
            boxShadow: '0 16px 48px rgba(30,64,175,0.35)',
          }}
        >
          {/* Wallet watermark */}
          <div className="absolute -top-3 -right-3 opacity-[0.08] pointer-events-none">
            <IoWalletOutline style={{ width: 130, height: 130, color: '#fff' }} />
          </div>

          <div className="relative z-10">
            <span className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.15em]">Total Balance</span>
            <div className="flex items-baseline gap-1 mt-1 mb-5">
              <span className="text-[46px] font-black text-white tracking-tighter leading-none">₹{Math.floor(currentBalance)}</span>
              <span className="text-blue-300 font-bold text-2xl">.{(currentBalance % 1).toFixed(2).substring(2)}</span>
            </div>

            <div className="flex gap-3 mb-5">
              {[
                { label: 'Income', value: `₹${totalIncome.toFixed(0)}`, bg: 'rgba(52,211,153,0.2)', color: '#6ee7b7' },
                { label: 'Spent', value: `₹${totalSpent.toFixed(0)}`, bg: 'rgba(252,165,165,0.2)', color: '#fca5a5' },
              ].map((s, i) => (
                <div key={i} className="flex-1 rounded-2xl px-3 py-2.5"
                  style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                  <p className="font-black text-base text-white truncate max-w-[100px]">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDeposit()}
                className="py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all text-blue-700"
                style={{ background: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}
              >
                ↓ Deposit
              </button>
              <button
                className="py-3.5 rounded-2xl font-bold text-sm text-white active:scale-95 transition-all"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
                onClick={() => toast.success("Withdrawals are processed manually via Admin.")}
              >
                ↑ Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Transfer ── */}
      <div className="px-4 mt-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '₹100', emoji: '💵', amt: 100 },
            { label: '₹500', emoji: '💴', amt: 500 },
            { label: '₹1000', emoji: '💶', amt: 1000 },
          ].map((q, i) => (
            <button key={i}
              onClick={() => handleDeposit(q.amt)}
              className="py-3 rounded-2xl text-sm font-black active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: '1.5px solid #bfdbfe',
                color: '#1d4ed8',
              }}>
              {q.emoji} {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transactions ── */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[17px] font-black text-gray-900">Recent Transactions</h3>
          <button className="text-xs font-bold text-red-600 active:opacity-70 cursor-pointer">View All →</button>
        </div>

        <div className="space-y-2.5">
          {loading ? (
            <p className="text-center text-sm font-medium text-gray-500 py-4">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-sm font-medium text-gray-500 py-4">No transactions found.</p>
          ) : (
            transactions.map((tx) => {
              const d = getTxIconData(tx);
              const Icon = d.icon;
              const isPositive = parseFloat(tx.amount) > 0;

              const titleMap = {
                'deposit': 'Deposit',
                'withdrawal': 'Withdrawal',
                'bet_lottery': 'Purchased Lottery',
                'bet_abc': 'Purchased ABC Ticket',
                'win_lottery': 'Won Lottery Draw',
                'win_abc': 'Won ABC Ticket',
                'refund': 'Refund'
              };

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: d.bg }}
                    >
                      <Icon style={{ width: 18, height: 18, color: d.color }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{titleMap[tx.type] || tx.type}</h4>
                      <p className="text-[11px] font-medium text-gray-400 mt-0.5" title={tx.description}>
                        {formatDate12Hour(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className="font-black text-sm whitespace-nowrap"
                    style={{ color: isPositive ? '#16a34a' : '#dc2626' }}
                  >
                    {isPositive ? '+' : ''}₹{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Deposit Modal ── */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60" style={{ zIndex: 51 }}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
            style={{ animation: 'modalSlideUp 0.3s ease-out' }}
          >
            <h2 className="text-xl font-black text-gray-900 mb-2">Deposit Funds</h2>
            <p className="text-sm font-medium text-gray-500 mb-6">Enter the amount you wish to add to your wallet.</p>

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="100"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-10 pr-4 text-xl font-black text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 active:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsDepositModalOpen(false);
                  processDeposit(depositAmount);
                }}
                className="flex-1 py-3.5 rounded-2xl font-black text-white bg-blue-600 active:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
              >
                Deposit
              </button>
            </div>

            <style>{`
              @keyframes modalSlideUp {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

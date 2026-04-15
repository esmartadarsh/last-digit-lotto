import { IoWalletOutline } from 'react-icons/io5';
import { FiArrowDownLeft, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

const API_BASE_URL = 'http://localhost:3000/api';

export default function Balance() {
  const { user, token, refreshProfile } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/wallet/transactions?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setTransactions(res.data.transactions);
        }
      } catch (err) {
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const handleDeposit = async (amountToDeposit) => {
    let amount = amountToDeposit;
    if (!amount) {
        amount = window.prompt("Enter amount to deposit (Min ₹10):", "100");
        if (!amount || isNaN(amount) || amount < 10) return;
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/wallet/deposit`, { amount: Number(amount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!data.success) throw new Error(data.message);

      const options = {
        key: data.key,
        amount: data.amount * 100,
        currency: data.currency,
        name: "Last Digit Lotto",
        description: "Wallet Deposit",
        order_id: data.orderId,
        handler: async function (response) {
            // Note: Actual DB balance increase happens via Backend Webhook.
            // Here we just refresh the UI after a short delay to allow webhook to process.
            toast.success("Payment successful! Updating balance...");
            setTimeout(() => {
               refreshProfile();
               location.reload(); // Refresh to pull new transactions
            }, 2000);
        },
        prefill: {
            name: user?.name || "Player",
            email: user?.email || "",
        },
        theme: {
            color: "#dc2626"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
          toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
      
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to initiate deposit");
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
                          {new Date(tx.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
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
    </div>
  );
}

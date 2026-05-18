import { IoWalletOutline } from 'react-icons/io5';
import { FiArrowDownLeft, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import useAuthStore from '../store/useAuthStore';
import formatDate12Hour from '@/utils/formatDate12Hour';
import api from '../config/api';

export default function Balance() {
  const { user, token, refreshProfile } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // Phase 2 states
  const [depositStep, setDepositStep] = useState(1);
  const [orderData, setOrderData] = useState(null);
  const [utr, setUtr] = useState('');

  // Withdraw states
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi'); // 'upi' | 'bank'
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
  // Bank transfer fields
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

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

  useEffect(() => {
    const check = () => setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleDeposit = (amountToDeposit) => {
    console.log('reaching 1')
    if (!amountToDeposit) {
      setDepositAmount('100');
      setDepositStep(1);
      setUtr('');
      setIsDepositModalOpen(true);
      return;
    }
    console.log('reaching 2')

    processDeposit(amountToDeposit);
  };

  const processDeposit = async (amountToDeposit) => {
    console.log('reaching 3')

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
      // Phase 2: UPI Manual Flow
      const { data } = await api.post('/wallet/deposit', { amount: Number(amount) });
      if (!data.success) throw new Error(data.message);
      console.log('reaching 4')

      setOrderData({ orderId: data.orderId, amount: data.amount });
      setDepositStep(2);
      setUtr('');
      setIsDepositModalOpen(true); // if it was triggered via quick buttons
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to initiate deposit');
    }
  };

  const submitUtr = async () => {
    if (!utr || utr.trim().length < 12) {
      return toast.error('Please enter a valid 12-digit UTR');
    }
    try {
      const { data } = await api.post('/wallet/deposit/utr', { orderId: orderData.orderId, utr });
      if (data.success) {
        toast.success('UTR submitted! Your deposit will be credited after admin verification.', { duration: 5000 });
        setIsDepositModalOpen(false);
        setDepositStep(1);

        // Refresh transactions to show pending
        const txRes = await api.get('/wallet/transactions?limit=20');
        if (txRes.data.success) setTransactions(txRes.data.transactions);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit UTR');
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Deposit_QR_${orderData?.orderId || 'Scan'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount < 100) {
      return toast.error('Minimum withdrawal amount is ₹100.');
    }

    if (withdrawMethod === 'upi') {
      if (!withdrawUpiId.trim() || !withdrawUpiId.includes('@')) {
        return toast.error('Please enter a valid UPI ID (e.g. name@upi).');
      }
    } else {
      if (!bankAccountHolder.trim()) return toast.error('Please enter account holder name.');
      if (!bankAccountNumber.trim() || bankAccountNumber.trim().length < 9) return toast.error('Please enter a valid account number.');
      if (!bankIfsc.trim() || bankIfsc.trim().length < 11) return toast.error('Please enter a valid 11-character IFSC code.');
      if (!bankName.trim()) return toast.error('Please enter your bank name.');
    }

    setWithdrawLoading(true);
    try {
      const payload = { amount, payment_method: withdrawMethod };
      if (withdrawMethod === 'upi') {
        payload.upi_id = withdrawUpiId.trim();
      } else {
        payload.account_holder = bankAccountHolder.trim();
        payload.account_number = bankAccountNumber.trim();
        payload.ifsc_code = bankIfsc.trim().toUpperCase();
        payload.bank_name = bankName.trim();
      }

      const { data } = await api.post('/wallet/withdraw', payload);
      if (data.success) {
        toast.success(data.message || 'Withdrawal request submitted!');
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        setWithdrawUpiId('');
        setBankAccountHolder('');
        setBankAccountNumber('');
        setBankIfsc('');
        setBankName('');
        await refreshProfile();
        const txRes = await api.get('/wallet/transactions?limit=20');
        if (txRes.data.success) setTransactions(txRes.data.transactions);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const currentBalance = user ? parseFloat(user.balance) : 0;

  // Quick calc
  // Only count completed/approved transactions for income & spent stats
  const totalIncome = transactions.filter(t => parseFloat(t.amount) > 0 && t.status === 'completed').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalSpent = transactions.filter(t => parseFloat(t.amount) < 0 && t.status === 'completed').reduce((acc, t) => acc + Math.abs(parseFloat(t.amount)), 0);

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
                onClick={() => {
                  setWithdrawAmount('');
                  setWithdrawMethod('upi');
                  setWithdrawUpiId('');
                  setBankAccountHolder('');
                  setBankAccountNumber('');
                  setBankIfsc('');
                  setBankName('');
                  setIsWithdrawModalOpen(true);
                }}
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

              // Status badge for deposit/withdrawal
              const showStatusBadge = tx.type === 'deposit' || tx.type === 'withdrawal';
              const statusBadge = {
                pending: { label: 'Pending', bg: '#fef9c3', color: '#92400e', border: '#fde68a' },
                completed: { label: tx.type === 'deposit' ? 'Approved' : 'Processed', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
                failed: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
                reversed: { label: 'Expired', bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
              }[tx.status] || { label: tx.status, bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };

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
                      {showStatusBadge && (
                        <span
                          className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}
                        >
                          {statusBadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="font-black text-sm whitespace-nowrap"
                    style={{
                      color: tx.type === 'deposit' && tx.status !== 'completed'
                        ? '#9ca3af'
                        : isPositive ? '#16a34a' : '#dc2626'
                    }}
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
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
          style={{ zIndex: 51 }}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
            style={{ animation: 'modalSlideUp 0.3s ease-out' }}
          >
            {depositStep === 1 ? (
              <>
                <h2 className="text-xl font-black text-gray-900 mb-2">
                  Deposit Funds
                </h2>

                <p className="text-sm font-medium text-gray-500 mb-6">
                  Enter the amount you wish to add to your wallet.
                </p>

                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                    ₹
                  </span>

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
                    onClick={() => {
                      setIsDepositModalOpen(false);
                      setDepositStep(1);
                    }}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 active:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => processDeposit(depositAmount)}
                    className="flex-1 py-3.5 rounded-2xl font-black text-white bg-blue-600 active:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-gray-900 mb-1">
                  Pay & Verify
                </h2>

                <p className="text-[13px] font-medium text-gray-500 mb-4 leading-tight">
                  Pay ₹{orderData?.amount} using any UPI app and enter the 12-digit
                  UTR below.
                </p>

                {/* Pay block — QR for iOS/Android */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5 flex flex-col items-center border border-gray-100">
                  {/* Canvas-based QR — works reliably on iOS Safari / WebKit */}
                  <div
                    style={{ width: 168, height: 168, padding: 4, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                  >
                    <QRCodeCanvas
                      id="qr-canvas"
                      value={`upi://pay?pa=gpay-12200293398@okbizaxis&pn=LotteryApp&am=${orderData?.amount}&cu=INR&tn=${orderData?.orderId}`}
                      size={160}
                      width={160}
                      height={160}
                      style={{ display: 'block' }}
                    />
                  </div>

                  <p className="text-[10px] text-center text-gray-400 mt-2 font-bold uppercase tracking-wider">
                    Scan to Pay using UPI
                  </p>

                  {/* Download QR & Click to Pay Buttons */}
                  <div className="mt-3 flex items-center gap-2 w-full">
                    {/* Icon-only Download button */}
                    <button
                      onClick={downloadQR}
                      title="Download QR Code"
                      className="flex-shrink-0 flex items-center justify-center active:scale-95 transition-all"
                      style={{
                        background: '#e0e7ff',
                        color: '#4338ca',
                        border: '1.5px solid #c7d2fe',
                        borderRadius: 12,
                        width: 44,
                        height: 44,
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>

                    {/* Click to Pay — mobile only */}
                    {isMobile && (
                      <a
                        href={`upi://pay?pa=gpay-12200293398@okbizaxis&pn=LotteryApp&am=${orderData?.amount}&cu=INR&tn=${orderData?.orderId}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] bg-blue-600 active:bg-blue-700 font-black active:scale-95 transition-all"
                        style={{
                          color: '#fff',
                          border: 'none',
                          boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                          textDecoration: 'none',
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Open In Upi App
                      </a>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                    12-Digit UTR Number
                  </label>

                  <input
                    type="text"
                    value={utr}
                    onChange={(e) =>
                      setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))
                    }
                    placeholder="e.g. 123456789012"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all text-center tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsDepositModalOpen(false);
                      setDepositStep(1);
                    }}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 active:bg-gray-200 transition-all text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={submitUtr}
                    className="flex-[1.5] py-3.5 rounded-2xl font-black text-white bg-blue-600 active:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 text-sm"
                  >
                    Submit UTR
                  </button>
                </div>
              </>
            )}

            <style>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
          </div>
        </div>
      )}

      {/* ── Withdraw Modal ── */}
      {isWithdrawModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
          style={{ zIndex: 51 }}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-y-auto"
            style={{ animation: 'modalSlideUp 0.3s ease-out', maxHeight: '90vh' }}
          >
            <h2 className="text-xl font-black text-gray-900 mb-1">Withdraw Funds</h2>
            <p className="text-sm font-medium text-gray-500 mb-4">
              Admin will process your request within 24 hours.
            </p>

            {/* Amount */}
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Min ₹100"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-10 pr-4 text-xl font-black text-gray-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all"
                autoFocus
              />
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setWithdrawMethod('upi')}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border-2"
                  style={withdrawMethod === 'upi'
                    ? { background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', borderColor: '#f97316', color: '#ea580c' }
                    : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  <span style={{ fontSize: 18 }}>📱</span> UPI
                </button>
                <button
                  onClick={() => setWithdrawMethod('bank')}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border-2"
                  style={withdrawMethod === 'bank'
                    ? { background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderColor: '#3b82f6', color: '#1d4ed8' }
                    : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  <span style={{ fontSize: 18 }}>🏦</span> Bank Transfer
                </button>
              </div>
            </div>

            {/* UPI Fields */}
            {withdrawMethod === 'upi' && (
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Your UPI ID
                </label>
                <input
                  type="text"
                  value={withdrawUpiId}
                  onChange={(e) => setWithdrawUpiId(e.target.value)}
                  placeholder="e.g. yourname@okicici"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all"
                />
              </div>
            )}

            {/* Bank Transfer Fields */}
            {withdrawMethod === 'bank' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Full name as per bank"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter account number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. SBI"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Info note */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-5">
              <p className="text-[12px] font-semibold text-orange-700 leading-snug">
                ⚠️ Balance is deducted immediately and refunded if admin rejects the request.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 active:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="flex-[1.5] py-3.5 rounded-2xl font-black text-white active:scale-95 transition-all shadow-lg text-sm"
                style={{ background: withdrawLoading ? '#f97316aa' : 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 6px 20px rgba(249,115,22,0.35)' }}
              >
                {withdrawLoading ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>

            <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
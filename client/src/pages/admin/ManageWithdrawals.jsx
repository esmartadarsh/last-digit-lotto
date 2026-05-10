import { useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle, FiXCircle, FiClock, FiSearch,
  FiRefreshCw, FiUser, FiArrowUpRight, FiSmartphone, FiCreditCard
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../config/api';
import formatDate12Hour from '@/utils/formatDate12Hour';

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Processed' },
  { key: 'failed', label: 'Rejected' },
  { key: '', label: 'All' },
];

const STATUS_BADGE = {
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  completed: { label: 'Processed', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  failed: { label: 'Rejected', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
};

/** Parse payment details from description string */
function parsePaymentDetails(description, referenceType) {
  if (!description) return null;

  if (referenceType === 'bank_withdrawal' || description.includes('Bank Transfer')) {
    const holder = description.match(/Account Holder:\s*([^|]+)/)?.[1]?.trim();
    const number = description.match(/Account Number:\s*([^|]+)/)?.[1]?.trim();
    const ifsc = description.match(/IFSC:\s*([^|]+)/)?.[1]?.trim();
    const bank = description.match(/Bank:\s*([^|]+)/)?.[1]?.trim();
    return { method: 'bank', holder, number, ifsc, bank };
  }

  // UPI
  const upiId = description.match(/UPI ID:\s*(\S+)/)?.[1];
  return { method: 'upi', upiId };
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-2xl w-full max-w-sm p-6 border border-slate-700 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-4">{message}</p>
        {children}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-[1.5] py-3 rounded-xl font-black text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (activeTab) params.set('status', activeTab);
      const res = await api.get(`/wallet/admin/withdrawals?${params}`);
      if (res.data.success) {
        setWithdrawals(res.data.withdrawals);
        setTotal(res.data.total);
      }
    } catch (err) {
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApprove = async () => {
    if (!approveModal) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/wallet/admin/withdrawals/${approveModal.tx.id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message || 'Withdrawal approved!');
        setApproveModal(null);
        fetchWithdrawals();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/wallet/admin/withdrawals/${rejectModal.tx.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      if (res.data.success) {
        toast.success('Withdrawal rejected. User balance has been refunded.');
        setRejectModal(null);
        setRejectReason('');
        fetchWithdrawals();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = withdrawals.filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const details = parsePaymentDetails(w.description, w.reference_type);
    const searchStr = details?.method === 'bank'
      ? `${details.holder || ''} ${details.number || ''} ${details.ifsc || ''} ${details.bank || ''}`
      : (details?.upiId || '');
    return (
      w.user?.name?.toLowerCase().includes(s) ||
      w.user?.email?.toLowerCase().includes(s) ||
      searchStr.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(total / LIMIT);
  const pendingTotal = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Math.abs(parseFloat(w.amount)), 0);

  return (
    <div className="space-y-6 max-w-[1200px] w-full mx-auto">

      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>
          <p className="text-slate-400 text-sm mt-1">Review and process UPI & bank transfer withdrawal requests</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-slate-300 transition-colors"
        >
          <FiRefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Requests', value: total, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Pending Payout', value: `₹${pendingTotal.toFixed(0)}`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Showing Page', value: `${page} / ${totalPages || 1}`, color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border px-5 py-4 ${s.bg}`}>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, UPI ID or account number..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">Loading withdrawals...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FiArrowUpRight size={36} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 font-medium">No withdrawal requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-4 font-semibold">User</th>
                  <th className="text-center px-4 py-4 font-semibold">Method</th>
                  <th className="text-left px-5 py-4 font-semibold">Payment Details</th>
                  <th className="text-right px-5 py-4 font-semibold">Amount</th>
                  <th className="text-center px-5 py-4 font-semibold">Status</th>
                  <th className="text-left px-5 py-4 font-semibold">Requested At</th>
                  <th className="text-center px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((tx) => {
                  const badge = STATUS_BADGE[tx.status] || STATUS_BADGE.pending;
                  const details = parsePaymentDetails(tx.description, tx.reference_type);
                  const isPending = tx.status === 'pending';
                  const isBank = details?.method === 'bank';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <FiUser size={15} className="text-orange-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold leading-tight truncate max-w-[130px]">
                              {tx.user?.name || 'Unknown'}
                            </p>
                            <p className="text-slate-500 text-xs truncate max-w-[130px]">{tx.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Method Badge */}
                      <td className="px-4 py-4 text-center">
                        {isBank ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <FiCreditCard size={11} /> Bank
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                            <FiSmartphone size={11} /> UPI
                          </span>
                        )}
                      </td>

                      {/* Payment Details */}
                      <td className="px-5 py-4 max-w-[220px]">
                        {isBank ? (
                          <div className="space-y-0.5">
                            <p className="text-white font-semibold text-xs truncate">{details.holder}</p>
                            <p className="font-mono text-blue-300 text-xs">
                              {details.number ? details.number : '—'}
                            </p>
                            <p className="text-slate-400 text-xs">{details.ifsc} · {details.bank}</p>
                          </div>
                        ) : details?.upiId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg truncate max-w-[160px]">
                              {details.upiId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not provided</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-black text-white text-base">
                          ₹{Math.abs(parseFloat(tx.amount)).toFixed(0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {tx.status === 'completed' && <FiCheckCircle size={11} />}
                          {tx.status === 'failed' && <FiXCircle size={11} />}
                          {tx.status === 'pending' && <FiClock size={11} />}
                          {badge.label}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4">
                        <span className="text-slate-400 text-xs">{formatDate12Hour(tx.created_at)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setApproveModal({ tx, details })}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                              <FiCheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => { setRejectModal({ tx }); setRejectReason(''); }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 transition-colors"
                            >
                              <FiXCircle size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs italic block text-center">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === p
                ? 'bg-red-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Approve Confirm Modal */}
      <ConfirmModal
        isOpen={!!approveModal}
        title="Approve Withdrawal"
        message={`Approve withdrawal of ₹${Math.abs(parseFloat(approveModal?.tx?.amount || 0)).toFixed(0)} for ${approveModal?.tx?.user?.name || 'user'}? Ensure you have sent the money before approving.`}
        onConfirm={handleApprove}
        onCancel={() => setApproveModal(null)}
        confirmLabel={actionLoading ? 'Approving...' : 'Mark as Processed'}
      >
        {approveModal && (
          <div className="mt-3 bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-2">
            {approveModal.details?.method === 'bank' ? (
              <>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Bank Transfer Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-400">Account Holder</span>
                  <span className="text-white font-bold">{approveModal.details.holder || '—'}</span>
                  <span className="text-slate-400">Account No.</span>
                  <span className="font-mono text-blue-300 font-bold">{approveModal.details.number || '—'}</span>
                  <span className="text-slate-400">IFSC</span>
                  <span className="font-mono text-blue-300 font-bold">{approveModal.details.ifsc || '—'}</span>
                  <span className="text-slate-400">Bank</span>
                  <span className="text-white font-bold">{approveModal.details.bank || '—'}</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">UPI ID to pay</p>
                <p className="font-mono text-violet-300 font-bold text-sm">{approveModal.details?.upiId || '—'}</p>
              </>
            )}
          </div>
        )}
      </ConfirmModal>

      {/* Reject Confirm Modal */}
      <ConfirmModal
        isOpen={!!rejectModal}
        title="Reject Withdrawal"
        message={`Reject withdrawal of ₹${Math.abs(parseFloat(rejectModal?.tx?.amount || 0)).toFixed(0)} from ${rejectModal?.tx?.user?.name || 'user'}? Their balance will be refunded automatically.`}
        onConfirm={handleReject}
        onCancel={() => { setRejectModal(null); setRejectReason(''); }}
        confirmLabel={actionLoading ? 'Rejecting...' : 'Reject & Refund'}
        danger
      >
        <div className="mt-2">
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Reason (optional)
          </label>
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Invalid account details, user request..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </ConfirmModal>

    </div>
  );
}

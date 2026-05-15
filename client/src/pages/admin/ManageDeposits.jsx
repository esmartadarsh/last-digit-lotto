import { useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle, FiXCircle, FiClock, FiSearch,
  FiRefreshCw, FiFilter, FiUser, FiHash, FiDollarSign
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../config/api';
import formatDate12Hour from '@/utils/formatDate12Hour';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Approved' },
  { key: 'failed', label: 'Rejected' },
  { key: 'reversed', label: 'Expired' },
];

const STATUS_BADGE = {
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  completed: { label: 'Approved', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  failed: { label: 'Rejected', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  reversed: { label: 'Expired', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

function parseUtr(description) {
  const match = description?.match(/UTR:\s*(\d+)/);
  return match ? match[1] : null;
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

export default function ManageDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Confirm modals
  const [approveModal, setApproveModal] = useState(null); // { tx }
  const [rejectModal, setRejectModal] = useState(null);   // { tx }
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (activeTab) params.set('status', activeTab);
      const res = await api.get(`/wallet/admin/deposits?${params}`);
      if (res.data.success) {
        setDeposits(res.data.deposits);
        setTotal(res.data.total);
      }
    } catch (err) {
      toast.error('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleApprove = async () => {
    if (!approveModal) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/wallet/admin/deposits/${approveModal.tx.id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message);
        setApproveModal(null);
        fetchDeposits();
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
      const res = await api.post(`/wallet/admin/deposits/${rejectModal.tx.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      if (res.data.success) {
        toast.success('Deposit rejected');
        setRejectModal(null);
        setRejectReason('');
        fetchDeposits();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = deposits.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.reference_id?.toLowerCase().includes(s) ||
      d.user?.name?.toLowerCase().includes(s) ||
      d.user?.email?.toLowerCase().includes(s) ||
      parseUtr(d.description)?.includes(s)
    );
  });

  const totalPages = Math.ceil(total / LIMIT);

  const summaryStats = [
    { label: 'Total Requests', value: total, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6 max-w-[1200px] w-full mx-auto">

      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">UPI Deposit Requests</h1>
          <p className="text-slate-400 text-sm mt-1">Review, approve or reject manual UPI payments</p>
        </div>
        <button
          onClick={fetchDeposits}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-slate-300 transition-colors"
        >
          <FiRefreshCw size={15} />
          Refresh
        </button>
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
          placeholder="Search by name, email, order ID or UTR..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">Loading deposits...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-medium">No deposit requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-4 font-semibold">User</th>
                  <th className="text-left px-5 py-4 font-semibold">Order ID</th>
                  <th className="text-left px-5 py-4 font-semibold">UTR</th>
                  <th className="text-right px-5 py-4 font-semibold">Amount</th>
                  <th className="text-center px-5 py-4 font-semibold">Status</th>
                  <th className="text-left px-5 py-4 font-semibold">Created At</th>
                  <th className="text-center px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((tx) => {
                  const badge = STATUS_BADGE[tx.status] || STATUS_BADGE.pending;
                  const utr = parseUtr(tx.description);
                  const isPending = tx.status === 'pending';
                  const hasUtr = !!utr;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <FiUser size={15} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold leading-tight truncate max-w-[130px]">
                              {tx.user?.name || 'Unknown'}
                            </p>
                            <p className="text-slate-500 text-xs truncate max-w-[130px]">{tx.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Order ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded-lg">
                          {tx.reference_id}
                        </span>
                      </td>

                      {/* UTR */}
                      <td className="px-5 py-4">
                        {hasUtr ? (
                          <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                            {utr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not submitted</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-black text-white text-base">₹{parseFloat(tx.amount).toFixed(0)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {tx.status === 'completed' && <FiCheckCircle size={11} />}
                          {tx.status === 'failed' && <FiXCircle size={11} />}
                          {(tx.status === 'pending' || tx.status === 'reversed') && <FiClock size={11} />}
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
                              onClick={() => setApproveModal({ tx })}
                              disabled={!hasUtr}
                              title={!hasUtr ? 'Cannot approve: user has not submitted UTR yet' : 'Approve deposit'}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${hasUtr
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
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

      {/* Approve confirm modal */}
      <ConfirmModal
        isOpen={!!approveModal}
        title="Approve Deposit"
        message={`Approve ₹${approveModal?.tx?.amount} deposit from ${approveModal?.tx?.user?.name || 'user'}? Their wallet will be credited immediately.`}
        onConfirm={handleApprove}
        onCancel={() => setApproveModal(null)}
        confirmLabel={actionLoading ? 'Approving...' : 'Approve & Credit'}
      />

      {/* Reject confirm modal */}
      <ConfirmModal
        isOpen={!!rejectModal}
        title="Reject Deposit"
        message={`Reject ₹${rejectModal?.tx?.amount} deposit from ${rejectModal?.tx?.user?.name || 'user'}? This action cannot be undone.`}
        onConfirm={handleReject}
        onCancel={() => { setRejectModal(null); setRejectReason(''); }}
        confirmLabel={actionLoading ? 'Rejecting...' : 'Reject'}
        danger
      >
        <div className="mt-2">
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Reason (optional)
          </label>
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. UTR not found, wrong amount..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </ConfirmModal>

    </div>
  );
}

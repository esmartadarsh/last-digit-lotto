import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

export default function ManageUsers() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const goTo = (pg) => setPage(Math.min(Math.max(1, pg), totalPages));
  const handleLimitChange = (v) => { setLimit(Number(v)); setPage(1); };
  const pageNumbers = () => {
    const range = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) range.push(i);
    return range;
  };

  // Balance Adjustment Modal State
  const [adjustModal, setAdjustModal] = useState({ show: false, user: null, amount: '', type: 'add' });
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get(`/admin/users`, { params });
      if (res.data.success) {
        setUsers(res.data.users);
        setTotal(res.data.total);
      }
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, page, limit, debouncedSearch]);

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    const { user, amount, type } = adjustModal;
    const amountNum = parseFloat(amount);

    if (!user || isNaN(amountNum) || amountNum <= 0) return toast.error("Enter a valid positive amount");

    const finalAmount = type === 'add' ? amountNum : -amountNum;

    try {
      setAdjusting(true);
      toast.loading(`${type === 'add' ? 'Adding' : 'Deducting'} balance...`, { id: 'adj' });
      const res = await api.put(`/admin/users/${user.id}/balance`, {
        amount: finalAmount,
        reason: 'Manual adjustment via Admin Panel'
      });
      toast.success(`Successfully ${type === 'add' ? 'added' : 'deducted'} ₹${amountNum} ${type === 'add' ? 'to' : 'from'} ${user.name}'s balance!`, { id: 'adj' });
      setAdjustModal({ show: false, user: null, amount: '', type: 'add' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to adjust balance", { id: 'adj' });
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col max-w-[1200px] w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Users & Balances</h1>
        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-64 transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Rows per page:</span>
          <select value={limit} onChange={e => handleLimitChange(e.target.value)}
            className="bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors">
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-slate-500">
            {total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit, total)} of ${total}` : '0 results'}
          </span>
        </div>
      </div>

      <div className="bg-[#1e293b]/80 backdrop-blur border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0f172a] text-slate-400 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <svg className="w-5 h-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span className="text-sm">Loading users…</span>
                </div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-slate-500 text-sm">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-bold text-white block">{u.name}</span>
                  <span className="text-xs text-slate-500">{u.email || u.phone || 'No contact'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    'bg-slate-700/50 text-slate-400 border border-slate-600'
                    }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-lg font-black text-emerald-400">₹{parseFloat(u.balance).toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAdjustModal({ show: true, user: u, amount: '', type: 'add' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition-colors border border-emerald-500/20"
                    >
                      <span>➕ Add</span>
                    </button>
                    <button
                      onClick={() => setAdjustModal({ show: true, user: u, amount: '', type: 'sub' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-colors border border-red-500/20"
                    >
                      <span>➖ Sub</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginator */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#334155] flex items-center justify-center gap-1.5 bg-[#0f172a]">
            <button onClick={() => goTo(page - 1)} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            {pageNumbers()[0] > 1 && (<><button onClick={() => goTo(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">1</button>{pageNumbers()[0] > 2 && <span className="text-slate-600 text-xs px-1">…</span>}</>)}
            {pageNumbers().map(pg => (
              <button key={pg} onClick={() => goTo(pg)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all ${pg === page ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'bg-[#1e293b] border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500'}`}>{pg}</button>
            ))}
            {pageNumbers()[pageNumbers().length - 1] < totalPages && (<>{pageNumbers()[pageNumbers().length - 1] < totalPages - 1 && <span className="text-slate-600 text-xs px-1">…</span>}<button onClick={() => goTo(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">{totalPages}</button></>)}
            <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Balance Adjustment Modal ── */}
      {adjustModal.show && adjustModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl max-w-md w-full shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">
              {adjustModal.type === 'add' ? 'Add Balance' : 'Deduct Balance'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              User: <span className="text-white font-semibold">{adjustModal.user.name}</span> ({adjustModal.user.email || adjustModal.user.phone})<br />
              Current Balance: <span className="font-mono text-emerald-400 font-bold">₹{parseFloat(adjustModal.user.balance).toFixed(2)}</span>
            </p>

            <form onSubmit={handleAdjustBalance}>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Amount to {adjustModal.type === 'add' ? 'Add' : 'Deduct'} (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={adjustModal.amount}
                  onChange={e => setAdjustModal(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g. 500"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-lg"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setAdjustModal({ show: false, user: null, amount: '', type: 'add' })}
                  className="px-5 py-2.5 font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg text-white ${adjustModal.type === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                      : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                    }`}
                >
                  {adjusting ? 'Processing...' : (adjustModal.type === 'add' ? 'Add Balance' : 'Deduct Balance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

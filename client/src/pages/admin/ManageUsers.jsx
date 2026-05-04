import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

export default function ManageUsers() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Pagination (simplified)
  const [search, setSearch] = useState('');

  // Balance Adjustment Modal State
  const [adjustModal, setAdjustModal] = useState({ show: false, user: null, amount: '', type: 'add' });
  const [adjusting, setAdjusting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users`);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

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

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase();
    return (u.email?.toLowerCase().includes(s) ||
      u.name?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s));
  });

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
              <tr><td colSpan="4" className="text-center py-8">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8">No users found.</td></tr>
            ) : filteredUsers.map((u) => (
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
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg text-white ${
                    adjustModal.type === 'add' 
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

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

  const handleAdjustBalance = async (userId, userEmail, currentBalance) => {
    const amountStr = window.prompt(`Adjust balance for ${userEmail}. Current Balance: ₹${currentBalance}\nEnter positive amount to add, negative to deduct:`);
    if (!amountStr || isNaN(amountStr)) return;

    const amount = parseFloat(amountStr);

    try {
      toast.loading("Adjusting balance...", { id: 'adj' });
      const res = await api.put(`/admin/users/${userId}/balance`, {
        amount,
        reason: 'Manual adjustment via Admin Panel'
      });
      toast.success("Balance updated!", { id: 'adj' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to adjust balance", { id: 'adj' });
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
              {/* <th className="px-6 py-4 text-right">Actions</th> */}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

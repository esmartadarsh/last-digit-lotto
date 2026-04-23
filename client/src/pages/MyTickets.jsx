import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import useAuthStore from "../store/useAuthStore"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MyTickets() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Active, History

  useEffect(() => {
    const fetchTickets = async () => {
      if (!token) return;
      try {
        setLoading(true);
        // Fetch both concurrently
        const [lotteryRes, abcRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/lottery-tickets/me?limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/abc-tickets/me?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const lottery = lotteryRes.data.success ? lotteryRes.data.tickets.map(t => ({
          ...t,
          appType: 'lottery',
          // format UI fields
          uiId: t.ticket_number,
          uiDraw: t.draw?.game?.name || 'Lottery',
          uiTime: t.draw?.scheduled_at,
          uiAmount: parseFloat(t.price),
        })) : [];

        const abc = abcRes.data.success ? abcRes.data.tickets.map(t => ({
          ...t,
          appType: 'abc',
          uiId: `ABC - ${t.position} = ${t.digits} (x${t.qty})`,
          uiDraw: t.draw?.game?.name || 'ABC',
          uiTime: t.draw?.scheduled_at,
          uiAmount: parseFloat(t.total_price),
        })) : [];

        const merged = [...lottery, ...abc].sort(
          (a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
        );

        setTickets(merged);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [token]);

  const stats = {
      active: tickets.filter(t => t.status === 'active').length,
      won: tickets.filter(t => t.status === 'won').length,
      lost: tickets.filter(t => t.status === 'lost').length,
      spent: tickets.reduce((sum, t) => sum + t.uiAmount, 0)
  };

  const filteredTickets = tickets.filter(t => {
      if (filter === 'Active') return t.status === 'active';
      if (filter === 'History') return t.status !== 'active';
      return true; // All
  });

  const getTagData = (status) => {
      if (status === 'active') return { bg: '#eef2ff', text: '#4338ca', label: '● ACTIVE', topBg: 'linear-gradient(135deg, #4f46e5, #7c3aed)' };
      if (status === 'won') return { bg: '#d1fae5', text: '#065f46', label: '🏆 WON', topBg: 'linear-gradient(135deg, #059669, #10b981)' };
      return { bg: '#f3f4f6', text: '#6b7280', label: '✕ LOST', topBg: 'linear-gradient(135deg, #6b7280, #9ca3af)' };
  };

  return (
    <div className="pb-24 min-h-screen" style={{ background: "#f0f2f8", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div
        className="px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c084fc 100%)' }}
      >
        <h1 className="text-[22px] font-black text-white tracking-tight">My Tickets 🎟️</h1>
        <p className="text-purple-100 text-xs font-medium mt-0.5">View your active and past entries</p>
      </div>

      {/* ── Stats Banner ── */}
      <div className="px-4 mt-4">
        <div
          className="grid grid-cols-4 gap-0 rounded-2xl overflow-hidden bg-white"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}
        >
          {[
            { label: 'Active', value: stats.active, color: '#4f46e5', bg: '#eef2ff' },
            { label: 'Won', value: stats.won, color: '#059669', bg: '#d1fae5' },
            { label: 'Lost', value: stats.lost, color: '#9ca3af', bg: '#f9fafb' },
            { label: 'Spent', value: `₹${stats.spent}`, color: '#dc2626', bg: '#fff1f2' },
          ].map((s, i) => (
            <div key={i} className="py-3 text-center" style={{ background: s.bg }}>
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 p-1 rounded-2xl bg-gray-100">
          {[
              { id: 'All', label: `All (${tickets.length})` },
              { id: 'Active', label: `Active (${stats.active})` },
              { id: 'History', label: `History (${stats.won + stats.lost})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={filter === tab.id ? {
                background: '#dc2626',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
              } : {
                color: '#9ca3af',
                background: 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ticket Cards ── */}
      <div className="px-4 mt-4 space-y-4">
        {loading ? (
             <p className="text-center text-sm font-medium text-gray-500 py-10">Loading tickets...</p>
        ) : filteredTickets.length === 0 ? (
             <p className="text-center text-sm font-medium text-gray-500 py-10">No tickets found.</p>
        ) : filteredTickets.map((ticket) => {
            const tag = getTagData(ticket.status);
            
            return (
              <div
                key={ticket.id}
                className="rounded-2xl overflow-hidden bg-white cursor-pointer active:scale-[0.98] transition-all"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09)', border: '1px solid #f3f4f6' }}
              >
                {/* Colored top strip */}
                <div className="px-4 py-3 flex justify-between items-center" style={{ background: tag.topBg }}>
                  <div>
                    <h3 className="font-black text-white text-base">{ticket.uiDraw} {ticket.appType === 'abc' ? "ABC" : ""}</h3>
                    <p className="text-white/70 text-[10px] font-mono mt-0.5">{ticket.uiId}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide"
                    style={{ background: tag.bg, color: tag.text }}
                  >
                    {tag.label}
                  </span>
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                  <p className="text-[11px] text-gray-400 font-medium mb-3">
                    Draw: {new Date(ticket.uiTime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Bet Amount</p>
                      <p className="font-black text-gray-800 text-base">₹{ticket.uiAmount}</p>
                    </div>

                    {ticket.status === 'won' && (
                        <div className="text-right">
                           <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Winnings</p>
                           <p className="font-black text-green-600 text-lg">+₹{parseFloat(ticket.win_amount)}</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            );
        })}
      </div>

    </div>
  );
}

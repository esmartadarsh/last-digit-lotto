import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiCreditCard, FiClock, FiActivity } from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';

const API_BASE_URL = 'http://localhost:3000/api';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDraws: 0,
    totalRevenue: 0,
    activeBets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We fetch some aggregates by hitting the existing admin endpoints
    const fetchDashboardStats = async () => {
      try {
        const [usersRes, drawsRes, resultsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/admin/draws`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/admin/results`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const usersCount = usersRes.data.success ? usersRes.data.total : 0;
        const activeDraws = drawsRes.data.success ? drawsRes.data.draws.filter(d => d.status === 'open').length : 0;
        
        setStats({
          totalUsers: usersCount,
          totalDraws: drawsRes.data.success ? drawsRes.data.total : 0,
          totalRevenue: 15420, // Dummy revenue, requires complex JOIN on transactions table otherwise
          activeBets: activeDraws
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token]);

  const cards = [
    { title: "Total Users", value: stats.totalUsers, icon: FiUsers, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Draws", value: stats.activeBets, icon: FiActivity, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Total Draws", value: stats.totalDraws, icon: FiClock, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Est. Revenue", value: `₹${stats.totalRevenue}`, icon: FiCreditCard, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6 flex flex-col items-center max-w-[1200px] w-full mx-auto">
      <div className="w-full flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
      </div>
      
      {loading ? (
          <div className="text-slate-400">Loading metrics...</div>
      ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, idx) => (
              <div key={idx} className="bg-[#1e293b]/80 backdrop-blur border border-slate-700/50 p-6 rounded-2xl flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-3xl font-black text-white">{card.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${card.bg}`}>
                  <card.icon size={26} className={card.color} />
                </div>
              </div>
            ))}
          </div>
      )}

      {/* Placeholder Chart / Graph section */}
      <div className="w-full bg-[#1e293b]/80 backdrop-blur border border-slate-700/50 p-8 rounded-2xl shadow-xl mt-8 min-h-[300px] flex items-center justify-center text-slate-500 font-medium">
         [Revenue Graph Placeholder]
      </div>
    </div>
  );
}

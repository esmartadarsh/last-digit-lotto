import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ManageDraws() {
  const { token } = useAuthStore();
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // For deciding winning results
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [winningInput, setWinningInput] = useState('');

  const fetchDraws = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/draws`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDraws(res.data.draws);
      }
    } catch (err) {
      toast.error("Failed to fetch draws");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraws();
  }, [token]);

  const handleCloseDraw = async (drawId) => {
    if (!window.confirm("Are you sure you want to manually close this draw?")) return;
    try {
      toast.loading("Closing draw...", { id: 'close' });
      const res = await axios.post(`${API_BASE_URL}/admin/draws/${drawId}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message, { id: 'close' });
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to close draw", { id: 'close' });
    }
  };

  const handleResolveDraw = async () => {
    if (!selectedDraw) return;
    
    let payload = {};
    if (selectedDraw.game.type === 'lottery') {
       if (winningInput.length !== 8) return toast.error("Lottery ticket must be 8 characters long");
       payload = { winningNumber: winningInput.toUpperCase() };
    } else {
       if (winningInput.length !== 3) return toast.error("ABC result must be exactly 3 digits");
       payload = { 
           winningA: parseInt(winningInput[0]), 
           winningB: parseInt(winningInput[1]), 
           winningC: parseInt(winningInput[2]) 
       };
    }

    try {
      toast.loading("Processing winners & payouts...", { id: 'resolve' });
      const res = await axios.post(`${API_BASE_URL}/admin/draws/${selectedDraw.id}/resolve`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message, { id: 'resolve' });
      setSelectedDraw(null);
      setWinningInput('');
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve draw", { id: 'resolve' });
    }
  };

  return (
    <div className="space-y-6 flex flex-col max-w-[1200px] w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Manage Draws</h1>
          <button className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-red-500/20">
             + Create Draw (Auto)
          </button>
      </div>

      <div className="bg-[#1e293b]/80 backdrop-blur border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0f172a] text-slate-400 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">ID / Time</th>
              <th className="px-6 py-4">Game</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-8">Loading draws...</td></tr>
            ) : draws.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8">No draws found.</td></tr>
            ) : draws.map((draw) => (
              <tr key={draw.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs block text-slate-500">{draw.id.substring(0,8)}</span>
                  <span className="font-semibold text-white">
                      {new Date(draw.scheduled_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${draw.game.type === 'lottery' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                      <span className="font-medium text-white">{draw.game.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      draw.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      draw.status === 'closed' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                      'bg-slate-700/50 text-slate-400 border border-slate-600'
                  }`}>
                    {draw.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {draw.status === 'open' && (
                      <button onClick={() => handleCloseDraw(draw.id)} className="text-amber-500 hover:text-amber-400 font-medium px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                          Close Draw
                      </button>
                  )}
                  {draw.status === 'closed' && (
                      <button onClick={() => setSelectedDraw(draw)} className="text-emerald-400 hover:text-emerald-300 font-medium px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                          Resolve Winners
                      </button>
                  )}
                  {draw.status === 'completed' && (
                     <span className="text-slate-500 italic text-xs">Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resolve Modal */}
      {selectedDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-2xl max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Resolve Draw: {selectedDraw.game.name}</h2>
              <p className="text-sm text-slate-400 mb-6">Enter the winning numbers to distribute payouts automatically.</p>
              
              <div className="mb-6">
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                     {selectedDraw.game.type === 'lottery' ? "Winning Ticket (8 Char)" : "Winning ABC Digits (3 Char)"}
                 </label>
                 <input 
                    type="text" 
                    value={winningInput}
                    onChange={(e) => setWinningInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 font-mono text-lg tracking-widest uppercase transition-colors"
                    placeholder={selectedDraw.game.type === 'lottery' ? "e.g. 46A42171" : "e.g. 575"}
                    maxLength={selectedDraw.game.type === 'lottery' ? 8 : 3}
                 />
              </div>

              <div className="flex gap-3 justify-end">
                  <button onClick={() => { setSelectedDraw(null); setWinningInput(''); }} className="px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors">
                      Cancel
                  </button>
                  <button onClick={handleResolveDraw} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg font-semibold transition-colors">
                      Confirm Payouts
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

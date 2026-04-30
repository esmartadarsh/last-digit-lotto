import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

// Format metadata for each of the 8 lottery ticket boxes
const BOX_META = [
  { label: 'N', type: 'tel' },
  { label: 'N', type: 'tel' },
  { label: 'L', type: 'text' },
  { label: 'N', type: 'tel' },
  { label: 'N', type: 'tel' },
  { label: 'N', type: 'tel' },
  { label: 'N', type: 'tel' },
  { label: 'N', type: 'tel' },
];

export default function ManageDraws() {
  const { token } = useAuthStore();
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDraw, setSelectedDraw] = useState(null);

  // Lottery: 8 individual boxes
  const [winningBoxes, setWinningBoxes] = useState(Array(8).fill(''));
  const lotteryRefs = useRef([]);

  // ABC: 3 digit inputs
  const [digitA, setDigitA] = useState('');
  const [digitB, setDigitB] = useState('');
  const [digitC, setDigitC] = useState('');

  const fetchDraws = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/draws`);
      if (res.data.success) setDraws(res.data.draws);
    } catch (err) {
      toast.error("Failed to fetch draws");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDraws(); }, [token]);

  const openModal = (draw) => {
    setSelectedDraw(draw);
    setWinningBoxes(Array(8).fill(''));
    setDigitA(''); setDigitB(''); setDigitC('');
  };

  const closeModal = () => {
    setSelectedDraw(null);
    setWinningBoxes(Array(8).fill(''));
    setDigitA(''); setDigitB(''); setDigitC('');
  };

  // ── Lottery box handlers ──
  const handleBoxChange = (idx, rawValue) => {
    const isLetter = idx === 2;
    const cleaned = isLetter
      ? rawValue.replace(/[^A-Za-z]/g, '').toUpperCase().slice(-1)
      : rawValue.replace(/\D/g, '').slice(-1);

    const next = [...winningBoxes];
    next[idx] = cleaned;
    setWinningBoxes(next);
    if (cleaned && idx < 7) lotteryRefs.current[idx + 1]?.focus();
  };

  const handleBoxKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !winningBoxes[idx] && idx > 0) {
      const next = [...winningBoxes];
      next[idx - 1] = '';
      setWinningBoxes(next);
      lotteryRefs.current[idx - 1]?.focus();
    }
  };

  const handleCloseDraw = async (drawId) => {
    if (!window.confirm("Are you sure you want to manually close this draw?")) return;
    try {
      toast.loading("Closing draw...", { id: 'close' });
      const res = await api.put(`/admin/draws/${drawId}/close`);
      toast.success(res.data.message || 'Draw closed', { id: 'close' });
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to close draw", { id: 'close' });
    }
  };

  const handleResolveDraw = async () => {
    if (!selectedDraw) return;

    if (selectedDraw.game.type === 'lottery') {
      const winningNumber = winningBoxes.join('').toUpperCase();
      if (winningNumber.length !== 8) return toast.error("All 8 boxes must be filled");
      try {
        toast.loading("Processing winners & payouts...", { id: 'resolve' });
        const res = await api.post(`/admin/results/lottery`,
          { drawId: selectedDraw.id, winningNumber }
        );
        toast.success(res.data.message || 'Result announced!', { id: 'resolve' });
        closeModal(); fetchDraws();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to resolve draw", { id: 'resolve' });
      }
    } else {
      const a = parseInt(digitA), b = parseInt(digitB), c = parseInt(digitC);
      if ([a, b, c].some(d => isNaN(d) || d < 0 || d > 9)) return toast.error('A, B, C must each be a single digit (0–9)');
      try {
        toast.loading("Processing winners & payouts...", { id: 'resolve' });
        const res = await api.post(`/admin/results/abc`,
          { drawId: selectedDraw.id, a, b, c }
        );
        toast.success(res.data.message || 'Result announced!', { id: 'resolve' });
        closeModal(); fetchDraws();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to resolve draw", { id: 'resolve' });
      }
    }
  };

  return (
    <div className="space-y-6 flex flex-col max-w-[1200px] w-full mx-auto">
      {/* <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Manage Draws</h1>
        <button className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-red-500/20">
          + Create Draw (Auto)
        </button>
      </div> */}

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
                  <span className="font-mono text-xs block text-slate-500">{draw.id.substring(0, 8)}</span>
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
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${draw.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
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
                    <button onClick={() => openModal(draw)} className="text-emerald-400 hover:text-emerald-300 font-medium px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
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

      {/* ── Resolve Modal ── */}
      {selectedDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-2xl max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Resolve Draw: {selectedDraw.game.name}</h2>
            <p className="text-sm text-slate-400 mb-6">Enter the winning numbers to distribute payouts automatically.</p>

            {/* ── Lottery: 8 individual boxes ── */}
            {selectedDraw.game.type === 'lottery' && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Winning Ticket
                  {/* &nbsp;·&nbsp; Format: N · N · <span className="text-red-400">L</span> · N · N · N · N · N */}
                </p>
                <div className="flex gap-1.5 justify-between">
                  {BOX_META.map((meta, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <input
                        ref={el => lotteryRefs.current[i] = el}
                        type={meta.type}
                        inputMode={meta.type === 'tel' ? 'numeric' : 'text'}
                        maxLength={1}
                        value={winningBoxes[i]}
                        onChange={e => handleBoxChange(i, e.target.value)}
                        onKeyDown={e => handleBoxKeyDown(i, e)}
                        style={{
                          height: '52px',
                          width: '100%',
                          borderRadius: '10px',
                          textAlign: 'center',
                          fontWeight: '900',
                          fontSize: '1.25rem',
                          outline: 'none',
                          transition: 'all 0.15s',
                          background: winningBoxes[i] ? '#1e3a5f' : '#0f172a',
                          border: `2px solid ${winningBoxes[i] ? (i === 2 ? '#dc2626' : '#6366f1') : '#334155'}`,
                          color: i === 2 ? '#f87171' : '#a5b4fc',
                          fontFamily: "'Inter', monospace",
                        }}
                      />
                      <span style={{ fontSize: '9px', fontWeight: 900, color: i === 2 ? '#dc2626' : '#6366f1' }}>
                        {meta.label}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Preview */}
                {winningBoxes.every(b => b !== '') && (
                  <div className="mt-3 py-2 rounded-xl text-center font-black tracking-[0.3em] text-lg"
                    style={{ background: '#0f172a', border: '1.5px solid #334155', color: '#e2e8f0' }}>
                    {winningBoxes.join('').toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* ── ABC: 3 digit inputs ── */}
            {selectedDraw.game.type === 'abc' && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Enter Winning Digits (0–9)</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Digit A', val: digitA, set: setDigitA },
                    { label: 'Digit B', val: digitB, set: setDigitB },
                    { label: 'Digit C', val: digitC, set: setDigitC },
                  ].map(({ label, val, set }) => (
                    <div key={label} className="flex flex-col items-center">
                      <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
                      <input
                        type="number" min="0" max="9"
                        value={val}
                        onChange={e => set(e.target.value.slice(-1))}
                        className="w-full text-center bg-[#0f172a] border border-slate-700 focus:border-emerald-500 rounded-xl px-2 py-4 text-white font-mono text-3xl font-black focus:outline-none transition-colors"
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
                {digitA !== '' && digitB !== '' && digitC !== '' && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-1">Winning Combination</p>
                    <p className="text-3xl font-black text-emerald-400 tracking-widest font-mono">
                      A={digitA} · B={digitB} · C={digitC}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={closeModal} className="px-5 py-2.5 font-medium text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleResolveDraw} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-lg shadow-red-500/20">
                Confirm Payouts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

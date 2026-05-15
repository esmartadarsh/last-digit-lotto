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

const LIMIT_OPTIONS = [10, 20, 50];

export default function ManageDraws() {
  const { token } = useAuthStore();
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Pagination & filter state ──
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [selectedDraw, setSelectedDraw] = useState(null);

  // Lottery: 8 individual boxes
  const [winningBoxes, setWinningBoxes] = useState(Array(8).fill(''));
  const lotteryRefs = useRef([]);

  // ABC: 3 digit inputs
  const [digitA, setDigitA] = useState('');
  const [digitB, setDigitB] = useState('');
  const [digitC, setDigitC] = useState('');

  // fetchDraws reads current state via useEffect dependency array
  const fetchDraws = async (pg, lmt, sf) => {
    try {
      setLoading(true);
      const params = { page: pg, limit: lmt };
      if (sf) params.status = sf;
      const res = await api.get(`/admin/draws`, { params });
      if (res.data.success) {
        setDraws(res.data.draws);
        setTotal(res.data.total);
      }
    } catch (err) {
      toast.error("Failed to fetch draws");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDraws(page, limit, statusFilter); }, [token, page, limit, statusFilter]);

  // ── Filter helpers (reset page to 1) ──
  const handleStatusChange = (val) => { setStatusFilter(val); setPage(1); };
  const handleLimitChange  = (val) => { setLimit(Number(val)); setPage(1); };

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
      fetchDraws(page, limit, statusFilter);
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
        closeModal(); fetchDraws(page, limit, statusFilter);
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
        closeModal(); fetchDraws(page, limit, statusFilter);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to resolve draw", { id: 'resolve' });
      }
    }
  };

  // ── Pagination helpers ──
  const goTo = (pg) => setPage(Math.min(Math.max(1, pg), totalPages));
  const pageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i);
    return range;
  };

  return (
    <div className="space-y-4 flex flex-col max-w-[1200px] w-full mx-auto">

      {/* ── Filter / Controls Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-[#0f172a] border border-[#334155] rounded-xl p-1">
          {[{v:'',l:'All'},{v:'open',l:'Open'},{v:'closed',l:'Closed'},{v:'completed',l:'Completed'}].map(opt => (
            <button
              key={opt.v}
              onClick={() => handleStatusChange(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === opt.v
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>

        {/* Rows-per-page + record count */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={e => handleLimitChange(e.target.value)}
            className="bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {LIMIT_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-slate-500">
            {total > 0
              ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`
              : '0 results'}
          </span>
        </div>
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
              <tr>
                <td colSpan="4" className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="w-5 h-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <span className="text-sm">Loading draws…</span>
                  </div>
                </td>
              </tr>
            ) : draws.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-12 text-slate-500 text-sm">
                  No draws found{statusFilter ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
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
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#334155] flex items-center justify-center gap-1.5 bg-[#0f172a]">
            {/* Prev */}
            <button onClick={() => goTo(page - 1)} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>

            {/* First + ellipsis */}
            {pageNumbers()[0] > 1 && (
              <>
                <button onClick={() => goTo(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">1</button>
                {pageNumbers()[0] > 2 && <span className="text-slate-600 text-xs px-1">…</span>}
              </>
            )}

            {/* Page buttons */}
            {pageNumbers().map(pg => (
              <button key={pg} onClick={() => goTo(pg)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                  pg === page
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-[#1e293b] border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500'
                }`}>{pg}</button>
            ))}

            {/* Last + ellipsis */}
            {pageNumbers()[pageNumbers().length - 1] < totalPages && (
              <>
                {pageNumbers()[pageNumbers().length - 1] < totalPages - 1 && <span className="text-slate-600 text-xs px-1">…</span>}
                <button onClick={() => goTo(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">{totalPages}</button>
              </>
            )}

            {/* Next */}
            <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>

      {selectedDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-2xl max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Resolve Draw: {selectedDraw.game.name}</h2>
            <p className="text-sm text-slate-400 mb-6">Enter the winning numbers to distribute payouts automatically.</p>

            {/* ── Lottery: 8 individual boxes ── */}
            {selectedDraw.game.type === 'lottery' && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Winning Ticket</p>
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

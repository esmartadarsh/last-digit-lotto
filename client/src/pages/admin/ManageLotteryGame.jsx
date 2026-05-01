import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiActivity, FiX, FiImage, FiTrash2, FiAward } from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import ImageCropperModal from '../../components/ImageCropperModal';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import api from '../../config/api';
import { TIME_SLOTS } from '../../data.js'

const STATUS_COLORS = {
  open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  completed: 'bg-slate-700/50 text-slate-400 border border-slate-600',
};

// ── Prize configs ──
const PRIZE_CONFIG = [
  { key: 'second', label: '2nd Prize', digits: 5, count: 10, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  { key: 'third', label: '3rd Prize', digits: 4, count: 10, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' },
  { key: 'fourth', label: '4th Prize', digits: 4, count: 10, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
  { key: 'fifth', label: '5th Prize', digits: 4, count: 100, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' },
];

// Parse pasted text into valid number chips of exact `digits` length
function parsePastedNumbers(text, digits) {
  const tokens = text.split(/[\s,\n\r\t]+/).map(t => t.trim()).filter(Boolean);
  const valid = [];
  for (const t of tokens) {
    const cleaned = t.replace(/\D/g, '');
    // Chunk into groups of `digits`
    for (let i = 0; i + digits <= cleaned.length; i += digits) {
      valid.push(cleaned.slice(i, i + digits));
    }
    // If it doesn't divide evenly but has >= digits chars, take first `digits`
    if (cleaned.length >= digits && cleaned.length % digits !== 0) {
      // already handled above via loop
    }
    // If token is shorter than digits, pad with zeros? No — skip it
  }
  return valid;
}

// 1st prize box metadata (N N L N N N N N)
const BOX_META_1ST = [
  { type: 'tel' }, { type: 'tel' }, { type: 'text' },
  { type: 'tel' }, { type: 'tel' }, { type: 'tel' }, { type: 'tel' }, { type: 'tel' },
];



export default function ManageLotteryGame() {
  const { token } = useAuthStore();

  // ── State ──
  const [games, setGames] = useState([]);
  const [draws, setDraws] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingDraws, setLoadingDraws] = useState(true);

  // Create Game form
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameSlug, setGameSlug] = useState('');
  const [creatingGame, setCreatingGame] = useState(false);

  // Create Draw form
  const [showDrawForm, setShowDrawForm] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [drawHour, setDrawHour] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [creatingDraw, setCreatingDraw] = useState(false);

  // Banner image
  const [showCropper, setShowCropper] = useState(false);
  const [bannerBlob, setBannerBlob] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // ── Resolve / Announce Result ──
  const [resolveDraw, setResolveDraw] = useState(null);
  const [resolving, setResolving] = useState(false);
  // 1st prize — 8 individual boxes
  const [firstBoxes, setFirstBoxes] = useState(Array(8).fill(''));
  const firstRefs = useRef([]);
  // Paste-based prizes  { second: [], third: [], fourth: [], fifth: [] }
  const [prizeNumbers, setPrizeNumbers] = useState({ second: [], third: [], fourth: [], fifth: [] });
  // Textarea draft values per prize
  const [pasteDraft, setPasteDraft] = useState({ second: '', third: '', fourth: '', fifth: '' });

  // ── Fetchers ──
  const fetchGames = async () => {
    try {
      setLoadingGames(true);
      const res = await api.get(`/admin/draws`, {
        params: { limit: 200 }
      });
      // Get all draws, extract unique lottery games from them
      const allDraws = res.data.draws || [];
      const lotteryDraws = allDraws.filter(d => d.game?.type === 'lottery');
      setDraws(lotteryDraws);

      // fetch game list separately
      const gRes = await api.get(`/games`);
      setGames((gRes.data.games || []).filter(g => g.type === 'lottery'));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoadingGames(false);
      setLoadingDraws(false);
    }
  };

  useEffect(() => { fetchGames(); }, [token]);

  // ── Create Game ──
  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!gameName || !gameSlug) return toast.error('Name and slug are required');
    setCreatingGame(true);
    try {
      await api.post(`/admin/games`,
        { name: gameName, slug: gameSlug.toLowerCase().replace(/\s+/g, '-'), type: 'lottery' }
      );
      toast.success(`Game "${gameName}" created!`);
      setGameName(''); setGameSlug('');
      setShowGameForm(false);
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create game');
    } finally {
      setCreatingGame(false);
    }
  };

  // ── Create Draw ──
  const handleCreateDraw = async (e) => {
    e.preventDefault();
    if (!selectedGameId || !drawDate || !drawHour || !ticketPrice) return toast.error('All fields are required');
    // Combine date + hour slot into ISO-compatible local datetime string
    const scheduled_at = `${drawDate}T${drawHour}:00`;
    setCreatingDraw(true);
    try {
      let banner_url = null;

      // Upload banner to Firebase Storage if one was selected
      if (bannerBlob) {
        setUploadingBanner(true);
        toast.loading('Uploading banner...', { id: 'banner' });
        const drawTempId = `lottery_${Date.now()}`;
        const storageRef = ref(storage, `draw-banners/${drawTempId}.webp`);
        const snapshot = await uploadBytes(storageRef, bannerBlob, { contentType: 'image/webp' });
        banner_url = await getDownloadURL(snapshot.ref);
        toast.dismiss('banner');
        setUploadingBanner(false);
      }

      await api.post(`/admin/draws`,
        { game_id: parseInt(selectedGameId), scheduled_at, ticket_price: parseFloat(ticketPrice), banner_url }
      );
      toast.success('Draw created successfully!');
      setSelectedGameId(''); setDrawDate(''); setDrawHour(''); setTicketPrice('');
      setBannerBlob(null); setBannerPreview(null);
      setShowDrawForm(false);
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create draw');
    } finally {
      setCreatingDraw(false);
      setUploadingBanner(false);
    }
  };

  // ── Close Draw ──
  const handleCloseDraw = async (drawId) => {
    if (!window.confirm('Close this draw? Players will no longer be able to buy tickets.')) return;
    try {
      await api.put(`/admin/draws/${drawId}/close`);
      toast.success('Draw closed!');
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close draw');
    }
  };

  // ── Delete Draw ──
  const handleDeleteDraw = async (drawId) => {
    if (!window.confirm('Are you sure you want to completely delete this draw? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/draws/${drawId}`);
      toast.success('Draw deleted!');
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete draw');
    }
  };

  // ── Toggle Game Active Status (commented out) ──
  // const handleToggleGame = async (gameId, currentStatus) => {
  //   if (!window.confirm(`Are you sure you want to make this game ${currentStatus ? 'inactive' : 'active'}?`)) return;
  //   try {
  //     await api.put(`/admin/games/${gameId}/toggle-active`);
  //     toast.success(`Game marked as ${currentStatus ? 'inactive' : 'active'}!`);
  //     fetchGames();
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || 'Failed to toggle game status');
  //   }
  // };

  // ── Delete Game ──
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game? To delete a game, it must NOT have any active draws.')) return;
    try {
      await api.delete(`/admin/games/${gameId}`);
      toast.success('Game deleted successfully!');
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete game. Ensure all of its draws are deleted first.');
    }
  };

  // ── 1st prize box handlers ──
  const handleFirstBoxChange = (idx, raw) => {
    const isLetter = idx === 2;
    const cleaned = isLetter
      ? raw.replace(/[^A-Za-z]/g, '').toUpperCase().slice(-1)
      : raw.replace(/\D/g, '').slice(-1);
    const next = [...firstBoxes]; next[idx] = cleaned; setFirstBoxes(next);
    if (cleaned && idx < 7) firstRefs.current[idx + 1]?.focus();
  };
  const handleFirstBoxKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !firstBoxes[idx] && idx > 0) {
      const next = [...firstBoxes]; next[idx - 1] = ''; setFirstBoxes(next);
      firstRefs.current[idx - 1]?.focus();
    }
  };

  // ── Paste-prize handlers ──
  const handlePasteDraft = (key, digits, text) => {
    const parsed = parsePastedNumbers(text, digits);
    if (!parsed.length) return;
    setPrizeNumbers(prev => {
      const merged = [...new Set([...prev[key], ...parsed])];
      return { ...prev, [key]: merged };
    });
    setPasteDraft(prev => ({ ...prev, [key]: '' }));
  };
  const removeChip = (key, idx) => {
    setPrizeNumbers(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  // ── Open / Close modal ──
  const openResolveModal = (draw) => {
    setResolveDraw(draw);
    setFirstBoxes(Array(8).fill(''));
    setPrizeNumbers({ second: [], third: [], fourth: [], fifth: [] });
    setPasteDraft({ second: '', third: '', fourth: '', fifth: '' });
  };
  const closeResolveModal = () => {
    setResolveDraw(null);
    setFirstBoxes(Array(8).fill(''));
    setPrizeNumbers({ second: [], third: [], fourth: [], fifth: [] });
    setPasteDraft({ second: '', third: '', fourth: '', fifth: '' });
  };

  // ── Submit Result ──
  const handleAnnounceResult = async () => {
    const firstPrize = firstBoxes.join('').toUpperCase();
    if (firstPrize.length !== 8) return toast.error('Fill all 8 boxes for 1st Prize');
    for (const cfg of PRIZE_CONFIG) {
      if (prizeNumbers[cfg.key].length !== cfg.count)
        return toast.error(`${cfg.label} needs exactly ${cfg.count} numbers (have ${prizeNumbers[cfg.key].length})`);
    }
    setResolving(true);
    try {
      await api.post(`/admin/results/lottery`, {
        drawId: resolveDraw.id,
        winningNumber: firstPrize,
        prizes: {
          second: prizeNumbers.second,
          third: prizeNumbers.third,
          fourth: prizeNumbers.fourth,
          fifth: prizeNumbers.fifth,
        },
      });
      toast.success('Results announced & payouts processed!');
      closeResolveModal();
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to announce result');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] w-full mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Lottery Game Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Create lottery games and manage their draws & results.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowGameForm(v => !v); setShowDrawForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <FiPlus size={16} /> New Game
          </button>
          <button
            onClick={() => { setShowDrawForm(v => !v); setShowGameForm(false); }}
            disabled={games.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiActivity size={16} /> New Draw
          </button>
        </div>
      </div>

      {/* ── Create Game Form ── */}
      {showGameForm && (
        <div className="bg-[#1e293b] border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Create Lottery Game</h2>
              <p className="text-sm text-slate-400 mt-1">Add a new lottery game that players can participate in.</p>
            </div>
            <button onClick={() => setShowGameForm(false)} className="text-slate-400 hover:text-white transition-colors p-1">
              <FiX size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateGame} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Game Name</label>
              <input type="text" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="e.g. Nagaland State Lottery"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Slug (URL key)</label>
              <input type="text" value={gameSlug} onChange={e => setGameSlug(e.target.value)} placeholder="e.g. nagaland"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={creatingGame}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60">
                {creatingGame ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Create Draw Form ── */}
      {showDrawForm && (
        <div className="bg-[#1e293b] border border-red-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Create Lottery Draw</h2>
              <p className="text-sm text-slate-400 mt-1">Schedule a new draw for a lottery game.</p>
            </div>
            <button onClick={() => setShowDrawForm(false)} className="text-slate-400 hover:text-white transition-colors p-1">
              <FiX size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateDraw} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Game</label>
              <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="">Select a game...</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Draw Date</label>
              <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Time Slot</label>
              <select value={drawHour} onChange={e => setDrawHour(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="">Select time...</option>
                {TIME_SLOTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ticket Price (₹)</label>
              <input type="number" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} placeholder="e.g. 100" min="1" step="0.01"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div className="md:col-span-4 flex flex-col gap-4">
              {/* Banner Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Draw Banner Image (1920×1080)</label>
                {bannerPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 group" style={{ maxHeight: 180 }}>
                    <img src={bannerPreview} alt="Banner preview" className="w-full object-cover" style={{ maxHeight: 180 }} />
                    <button
                      type="button"
                      onClick={() => { setBannerBlob(null); setBannerPreview(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCropper(true)}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-slate-600 hover:border-red-500 flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <FiImage size={20} />
                    <span className="text-sm font-medium">Upload Banner (optional)</span>
                  </button>
                )}
                {bannerPreview && (
                  <button type="button" onClick={() => setShowCropper(true)} className="text-xs text-slate-400 hover:text-white mt-1.5 transition-colors">
                    ↑ Change image
                  </button>
                )}
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={creatingDraw || uploadingBanner}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60">
                  {creatingDraw ? 'Creating Draw...' : 'Create Draw'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Games List ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span> Lottery Games ({games.length})
        </h2>
        {games.length === 0 ? (
          <div className="bg-[#1e293b]/60 border border-slate-700 rounded-2xl p-8 text-center text-slate-500">
            No lottery games yet. Click <strong>"New Game"</strong> to create one.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {games.map(g => (
              <div key={g.id} className="bg-[#1e293b] border border-indigo-500/20 rounded-xl px-5 py-3 flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <div>
                    <p className="text-white font-semibold text-sm">{g.name}</p>
                    <p className="text-slate-500 text-xs font-mono">/{g.slug}</p>
                  </div>
                </div>
                {/* Toggle active/inactive button commented out */}
                {/* <button onClick={() => handleToggleGame(g.id, g.is_active)} className="text-xs text-slate-400 hover:text-white underline shrink-0 whitespace-nowrap">
                  {g.is_active ? 'Set Inactive' : 'Set Active'}
                </button> */}
                {/* <button onClick={() => handleDeleteGame(g.id)} className="text-xs text-red-400 hover:text-red-300 underline shrink-0 whitespace-nowrap">
                  Delete Game
                </button> */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Draws Table ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span> Lottery Draws
        </h2>
        <div className="bg-[#1e293b]/80 backdrop-blur border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0f172a] text-slate-400 font-semibold uppercase text-xs">
              <tr>
                {/* <th className="px-4 py-4">Banner</th> */}
                <th className="px-6 py-4">Game</th>
                <th className="px-6 py-4">Scheduled At</th>
                <th className="px-6 py-4">Ticket Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {loadingDraws ? (
                <tr><td colSpan="6" className="text-center py-10 text-slate-500">Loading draws...</td></tr>
              ) : draws.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-10 text-slate-500">No lottery draws found. Create one above.</td></tr>
              ) : draws.map(draw => (
                <tr key={draw.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* <td className="px-4 py-3">
                    {draw.banner_url ? (
                      <img
                        src={draw.banner_url}
                        alt="banner"
                        className="w-20 h-11 object-cover rounded-lg border border-slate-700"
                      />
                    ) : (
                      <div className="w-20 h-11 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-600 text-xs">No img</div>
                    )}
                  </td> */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">{draw.game?.name}</span>
                    <span className="text-xs text-slate-500 font-mono block">/{draw.game?.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">
                      {new Date(draw.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-emerald-400">₹{parseFloat(draw.ticket_price).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[draw.status]}`}>
                      {draw.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {draw.status === 'open' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleCloseDraw(draw.id)}
                            className="text-amber-400 font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-xs">
                            Close Draw
                          </button>
                          <button onClick={() => handleDeleteDraw(draw.id)}
                            className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">
                            Delete
                          </button>
                        </div>
                      )}
                      {draw.status === 'closed' && (
                        <div className="flex gap-2">
                          <button onClick={() => openResolveModal(draw)}
                            className="text-emerald-400 font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-xs">
                            Announce Result
                          </button>
                          <button onClick={() => handleDeleteDraw(draw.id)}
                            className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">
                            Delete
                          </button>
                        </div>
                      )}
                      {draw.status === 'completed' && (
                        <span className="text-slate-500 italic text-xs">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Multi-Prize Result Announcement Modal ── */}
      {resolveDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3" onClick={e => { if (e.target === e.currentTarget) closeResolveModal(); }}>
          <div
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-full flex flex-col"
            style={{ maxWidth: 720, maxHeight: '92vh' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <FiAward className="text-indigo-400" size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-none">Announce Result</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{resolveDraw.game?.name} · {new Date(resolveDraw.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
              <button onClick={closeResolveModal} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                <FiX size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* ── 1st Prize ── */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#818cf8' }}>🥇 1st Prize — 1 × 8-digit Number</span>
                  {firstBoxes.every(b => b !== '') && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 tracking-widest">
                      {firstBoxes.join('').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {BOX_META_1ST.map((meta, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <input
                        ref={el => firstRefs.current[i] = el}
                        type={meta.type}
                        inputMode={meta.type === 'tel' ? 'numeric' : 'text'}
                        maxLength={1}
                        value={firstBoxes[i]}
                        onChange={e => handleFirstBoxChange(i, e.target.value)}
                        onKeyDown={e => handleFirstBoxKeyDown(i, e)}
                        style={{
                          height: 48, width: '100%', borderRadius: 10,
                          textAlign: 'center', fontWeight: 900, fontSize: '1.1rem',
                          outline: 'none', transition: 'all 0.15s',
                          background: firstBoxes[i] ? '#1e3a5f' : '#0a0f1e',
                          border: `2px solid ${firstBoxes[i] ? (i === 2 ? '#dc2626' : '#6366f1') : '#1e293b'}`,
                          color: i === 2 ? '#f87171' : '#a5b4fc',
                          fontFamily: "'Inter', monospace",
                        }}
                      />
                      <span style={{ fontSize: 8, fontWeight: 900, color: i === 2 ? '#dc2626' : '#6366f1' }}>
                        {i === 2 ? 'L' : 'N'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 2nd – 5th Prizes ── */}
              {PRIZE_CONFIG.map(cfg => {
                const nums = prizeNumbers[cfg.key];
                const draft = pasteDraft[cfg.key];
                const isFull = nums.length >= cfg.count;
                return (
                  <div key={cfg.key} className="rounded-xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    {/* Prize header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                        {cfg.key === 'second' ? '🥈' : cfg.key === 'third' ? '🥉' : cfg.key === 'fourth' ? '🏅' : '🎖️'} {cfg.label} — {cfg.count} × {cfg.digits}-digit Numbers
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: isFull ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                          color: isFull ? '#34d399' : cfg.color,
                          border: `1px solid ${isFull ? 'rgba(52,211,153,0.3)' : cfg.border}`,
                        }}
                      >
                        {nums.length} / {cfg.count}
                      </span>
                    </div>

                    {/* Chips */}
                    {nums.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {nums.map((n, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold"
                            style={{ background: 'rgba(255,255,255,0.06)', color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            {n}
                            <button
                              onClick={() => removeChip(cfg.key, i)}
                              className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                              style={{ color: cfg.color, lineHeight: 1 }}
                            >
                              <FiX size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Paste area */}
                    {!isFull && (
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={draft}
                          onChange={e => setPasteDraft(prev => ({ ...prev, [cfg.key]: e.target.value }))}
                          onPaste={e => {
                            e.preventDefault();
                            const text = e.clipboardData.getData('text');
                            handlePasteDraft(cfg.key, cfg.digits, text);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePasteDraft(cfg.key, cfg.digits, draft);
                            }
                          }}
                          placeholder={`Paste ${cfg.digits}-digit numbers here (space / newline separated)…`}
                          className="w-full resize-none text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none transition-colors placeholder-slate-600"
                          style={{
                            background: 'rgba(0,0,0,0.25)',
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                          }}
                        />
                        {draft.trim() && (
                          <button
                            onClick={() => handlePasteDraft(cfg.key, cfg.digits, draft)}
                            className="absolute right-2 bottom-2 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors"
                            style={{ background: cfg.border, color: cfg.color }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    )}
                    {isFull && (
                      <p className="text-[10px] font-semibold" style={{ color: '#34d399' }}>✓ Complete — {cfg.count} numbers entered</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1e293b] flex items-center justify-between gap-4 shrink-0">
              <div className="text-xs text-slate-500">
                All prizes must be complete before confirming.
              </div>
              <div className="flex gap-3">
                <button onClick={closeResolveModal} className="px-5 py-2 font-medium text-slate-400 hover:text-white transition-colors text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleAnnounceResult}
                  disabled={resolving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-indigo-500/20 text-sm"
                >
                  {resolving ? 'Processing...' : 'Confirm & Announce'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Cropper Modal ── */}
      {showCropper && (
        <ImageCropperModal
          onCropped={(blob, preview) => { setBannerBlob(blob); setBannerPreview(preview); setShowCropper(false); }}
          onCancel={() => setShowCropper(false)}
        />
      )}

    </div>
  );
}

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiActivity, FiX, FiImage, FiTrash2 } from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import ImageCropperModal from '../../components/ImageCropperModal';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import api from '../../config/api';

const STATUS_COLORS = {
  open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  completed: 'bg-slate-700/50 text-slate-400 border border-slate-600',
};

export default function ManageAbcGame() {
  const { token, user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  // ── State ──
  const [games, setGames] = useState([]);
  const [draws, setDraws] = useState([]);
  const [loadingDraws, setLoadingDraws] = useState(true);

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const handleStatusChange = (v) => { setStatusFilter(v); setPage(1); };
  const handleLimitChange  = (v) => { setLimit(Number(v)); setPage(1); };
  const goTo = (pg) => setPage(Math.min(Math.max(1, pg), totalPages));
  const pageNumbers = () => {
    const range = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) range.push(i);
    return range;
  };

  // Create Game form
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameSlug, setGameSlug] = useState('');
  const [creatingGame, setCreatingGame] = useState(false);

  // Create Draw form
  const [showDrawForm, setShowDrawForm] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [drawHour12, setDrawHour12] = useState('');
  const [drawMinute, setDrawMinute] = useState('');
  const [drawAmPm, setDrawAmPm] = useState('PM'); // Defaulting to PM as 1PM/8PM are common
  const [singleDigitPrice, setSingleDigitPrice] = useState('');
  const [doubleDigitPrice, setDoubleDigitPrice] = useState('');
  const [tripleDigitPrice, setTripleDigitPrice] = useState('');
  const [creatingDraw, setCreatingDraw] = useState(false);

  // Banner image
  const [showCropper, setShowCropper] = useState(false);
  const [bannerBlob, setBannerBlob] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Resolve Draw
  const [resolveDraw, setResolveDraw] = useState(null);
  const [editResolveDraw, setEditResolveDraw] = useState(null);
  const [digitA, setDigitA] = useState('');
  const [digitB, setDigitB] = useState('');
  const [digitC, setDigitC] = useState('');
  const [resolving, setResolving] = useState(false);

  // ── Fetchers ──
  const fetchData = async (pg = page, lmt = limit, sf = statusFilter) => {
    try {
      setLoadingDraws(true);
      const params = { game_type: 'abc', page: pg, limit: lmt };
      if (sf) params.status = sf;
      const [drawsRes, gamesRes] = await Promise.all([
        api.get(`/admin/draws`, { params }),
        api.get(`/games`)
      ]);
      setDraws(drawsRes.data.draws || []);
      setTotal(drawsRes.data.total || 0);
      setGames((gamesRes.data.games || []).filter(g => g.type === 'abc'));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoadingDraws(false);
    }
  };

  useEffect(() => { fetchData(page, limit, statusFilter); }, [token, page, limit, statusFilter]);

  // ── Create Game ──
  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!gameName || !gameSlug) return toast.error('Name and slug are required');
    setCreatingGame(true);
    try {
      await api.post(`/admin/games`,
        { name: gameName, slug: gameSlug.toLowerCase().replace(/\s+/g, '-'), type: 'abc' }
      );
      toast.success(`Game "${gameName}" created!`);
      setGameName(''); setGameSlug('');
      setShowGameForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create game');
    } finally {
      setCreatingGame(false);
    }
  };

  // ── Create Draw ──
  const handleCreateDraw = async (e) => {
    e.preventDefault();
    if (!selectedGameId || !drawDate || !drawHour12 || !drawMinute || !singleDigitPrice || !doubleDigitPrice || !tripleDigitPrice) {
      return toast.error('All fields are required including all three digit prices');
    }

    let hours24 = parseInt(drawHour12, 10);
    if (drawAmPm === 'PM' && hours24 !== 12) hours24 += 12;
    if (drawAmPm === 'AM' && hours24 === 12) hours24 = 0;
    
    const formattedHour24 = hours24.toString().padStart(2, '0');
    const formattedMinute = drawMinute.toString().padStart(2, '0');
    const drawHour = `${formattedHour24}:${formattedMinute}`;
    const scheduled_at = `${drawDate}T${drawHour}:00`;
    setCreatingDraw(true);
    try {
      let banner_url = null;

      if (bannerBlob) {
        setUploadingBanner(true);
        toast.loading('Uploading banner...', { id: 'banner' });
        const timeStr = drawHour.replace(/:/g, '-');
        const drawTempId = `abc_${drawDate}_${timeStr}_${Date.now()}`;
        const storageRef = ref(storage, `draw-banners/abc/${drawTempId}.webp`);
        const snapshot = await uploadBytes(storageRef, bannerBlob, { contentType: 'image/webp' });
        banner_url = await getDownloadURL(snapshot.ref);
        toast.dismiss('banner');
        setUploadingBanner(false);
      }

      await api.post(`/admin/draws`,
        {
          game_id: parseInt(selectedGameId),
          scheduled_at,
          single_digit_price: parseFloat(singleDigitPrice),
          double_digit_price: parseFloat(doubleDigitPrice),
          triple_digit_price: parseFloat(tripleDigitPrice),
          time_slot: drawHour,
          banner_url,
        }
      );
      toast.success('Draw created successfully!');
      setSelectedGameId(''); setDrawDate(''); 
      setDrawHour12(''); setDrawMinute(''); setDrawAmPm('PM');
      setSingleDigitPrice(''); setDoubleDigitPrice(''); setTripleDigitPrice('');
      setBannerBlob(null); setBannerPreview(null);
      setShowDrawForm(false);
      fetchData();
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
      fetchData(page, limit, statusFilter);
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
      fetchData(page, limit, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete draw');
    }
  };

  // ── Delete Game ──
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game? To delete a game, it must NOT have any active draws.')) return;
    try {
      await api.delete(`/admin/games/${gameId}`);
      toast.success('Game deleted successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete game. Ensure all of its draws are deleted first.');
    }
  };

  // ── Resolve Draw ──
  const handleResolveDraw = async () => {
    const a = parseInt(digitA);
    const b = parseInt(digitB);
    const c = parseInt(digitC);
    if ([a, b, c].some(d => isNaN(d) || d < 0 || d > 9)) {
      return toast.error('A, B, C must each be a single digit (0-9)');
    }
    setResolving(true);
    try {
      await api.post(`/admin/results/abc`, { drawId: resolveDraw.id, a, b, c });
      toast.success('ABC results announced & payouts processed!');
      setResolveDraw(null); setDigitA(''); setDigitB(''); setDigitC('');
      fetchData(page, limit, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve draw');
    } finally {
      setResolving(false);
    }
  };

  // ── Edit Result ──
  const openEditResolveModal = async (draw) => {
    toast.loading('Fetching existing result...', { id: 'fetch-abc' });
    try {
      const res = await api.get(`/results/abc/${draw.id}`);
      if (res.data.success) {
        const result = res.data.result;
        setDigitA(result.a !== undefined && result.a !== null ? String(result.a) : '');
        setDigitB(result.b !== undefined && result.b !== null ? String(result.b) : '');
        setDigitC(result.c !== undefined && result.c !== null ? String(result.c) : '');
        setEditResolveDraw(draw);
        toast.dismiss('fetch-abc');
      }
    } catch (err) {
      toast.error('Failed to fetch existing result', { id: 'fetch-abc' });
    }
  };

  const handleEditResolveDraw = async () => {
    if (digitA === '' || digitB === '' || digitC === '') return toast.error('Enter all 3 digits');
    setResolving(true);
    try {
      await api.put(`/admin/results/abc`, {
        drawId: editResolveDraw.id,
        a: parseInt(digitA, 10),
        b: parseInt(digitB, 10),
        c: parseInt(digitC, 10),
      });
      toast.success('ABC Result updated successfully!');
      setEditResolveDraw(null);
      setDigitA(''); setDigitB(''); setDigitC('');
      fetchData(page, limit, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update result');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] w-full mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ABC Game Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Create ABC games with 1PM & 8PM time slots and manage results.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowGameForm(v => !v); setShowDrawForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-emerald-700 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <FiPlus size={16} /> New ABC Game
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
        <div className="bg-[#1e293b] border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Create ABC Game</h2>
              <p className="text-sm text-slate-400 mt-1">Add an ABC (A/B/C digit) game with two daily time slots.</p>
            </div>
            <button onClick={() => setShowGameForm(false)} className="text-slate-400 hover:text-white transition-colors p-1">
              <FiX size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateGame} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Game Name</label>
              <input type="text" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="e.g. Goa ABC Lottery"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Slug (URL key)</label>
              <input type="text" value={gameSlug} onChange={e => setGameSlug(e.target.value)} placeholder="e.g. goa-abc"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={creatingGame}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60">
                {creatingGame ? 'Creating...' : 'Create ABC Game'}
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
              <h2 className="text-lg font-bold text-white">Create ABC Draw</h2>
              <p className="text-sm text-slate-400 mt-1">Schedule a draw with a specific time slot (1PM or 8PM).</p>
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
                <option value="">Select game...</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Draw Date</label>
              <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Time</label>
              <div className="flex gap-2">
                <select value={drawHour12} onChange={e => setDrawHour12(e.target.value)} required
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-2 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                  <option value="">HH</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-white font-bold self-center">:</span>
                <select value={drawMinute} onChange={e => setDrawMinute(e.target.value)} required
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-2 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                  <option value="">MM</option>
                  {[...Array(60)].map((_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                  ))}
                </select>
                <select value={drawAmPm} onChange={e => setDrawAmPm(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-2 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* ── ABC-specific prices ── */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Single Digit Price (₹)</label>
              <input type="number" value={singleDigitPrice} onChange={e => setSingleDigitPrice(e.target.value)} placeholder="e.g. 10.4" min="0.01" step="0.01"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Double Digit Price (₹)</label>
              <input type="number" value={doubleDigitPrice} onChange={e => setDoubleDigitPrice(e.target.value)} placeholder="e.g. 12" min="0.01" step="0.01"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Triple Digit Price (₹)</label>
              <input type="number" value={tripleDigitPrice} onChange={e => setTripleDigitPrice(e.target.value)} placeholder="e.g. 30" min="0.01" step="0.01"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex flex-col gap-4">
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
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> ABC Games ({games.length})
        </h2>
        {games.length === 0 ? (
          <div className="bg-[#1e293b]/60 border border-slate-700 rounded-2xl p-8 text-center text-slate-500">
            No ABC games yet. Click <strong>"New ABC Game"</strong> to create one.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {games.map(g => (
              <div key={g.id} className="bg-[#1e293b] border border-emerald-500/20 rounded-xl px-5 py-3 flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <div>
                    <p className="text-white font-semibold text-sm">{g.name}</p>
                    <p className="text-slate-500 text-xs font-mono">/{g.slug}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Draws Table ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span> ABC Draws
        </h2>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1 bg-[#0f172a] border border-[#334155] rounded-xl p-1">
            {[{v:'',l:'All'},{v:'open',l:'Open'},{v:'closed',l:'Closed'},{v:'completed',l:'Completed'}].map(opt => (
              <button key={opt.v} onClick={() => handleStatusChange(opt.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === opt.v ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                {opt.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Rows per page:</span>
            <select value={limit} onChange={e => handleLimitChange(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors">
              {[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-slate-500">
              {total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit,total)} of ${total}` : '0 results'}
            </span>
          </div>
        </div>

        <div className="bg-[#1e293b]/80 backdrop-blur border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0f172a] text-slate-400 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Game</th>
                <th className="px-6 py-4">Scheduled At</th>
                <th className="px-6 py-4">Single (₹)</th>
                <th className="px-6 py-4">Double (₹)</th>
                <th className="px-6 py-4">Triple (₹)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {loadingDraws ? (
                <tr><td colSpan="7" className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="w-5 h-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <span className="text-sm">Loading draws…</span>
                  </div>
                </td></tr>
              ) : draws.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-500 text-sm">
                  No ABC draws found{statusFilter ? ` with status "${statusFilter}"` : ''}. Create one above.
                </td></tr>
              ) : draws.map(draw => (
                <tr key={draw.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4"><span className="font-semibold text-white">{draw.game?.name}</span></td>
                  <td className="px-6 py-4"><span className="font-semibold text-white">{new Date(draw.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></td>
                  <td className="px-6 py-4"><span className="font-mono font-bold text-sky-400">₹{draw.single_digit_price ? parseFloat(draw.single_digit_price).toFixed(2) : '—'}</span></td>
                  <td className="px-6 py-4"><span className="font-mono font-bold text-amber-400">₹{draw.double_digit_price ? parseFloat(draw.double_digit_price).toFixed(2) : '—'}</span></td>
                  <td className="px-6 py-4"><span className="font-mono font-bold text-emerald-400">₹{draw.triple_digit_price ? parseFloat(draw.triple_digit_price).toFixed(2) : '—'}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[draw.status]}`}>{draw.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {draw.status === 'open' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleCloseDraw(draw.id)} className="text-amber-400 font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-xs">Close Draw</button>
                          {isSuperAdmin && (<button onClick={() => handleDeleteDraw(draw.id)} className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">Delete</button>)}
                        </div>
                      )}
                      {draw.status === 'closed' && (
                        <div className="flex gap-2">
                          <button onClick={() => { setResolveDraw(draw); setDigitA(''); setDigitB(''); setDigitC(''); }} className="text-emerald-400 font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-xs">Announce Result</button>
                          {isSuperAdmin && (<button onClick={() => handleDeleteDraw(draw.id)} className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">Delete</button>)}
                        </div>
                      )}
                      {draw.status === 'completed' && (
                        <div className="flex gap-2 items-center">
                          <span className="text-slate-500 italic text-xs">Completed</span>
                          <button onClick={() => openEditResolveModal(draw)} className="text-indigo-400 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors text-xs">Edit Result</button>
                        </div>
                      )}
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
      </div>

      {/* ── Resolve Modal ── */}
      {resolveDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Announce ABC Result</h2>
            <p className="text-sm text-slate-400 mb-6">
              Game: <strong className="text-white">{resolveDraw.game?.name}</strong><br />
              Scheduled: {new Date(resolveDraw.scheduled_at).toLocaleString('en-IN')}
            </p>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Enter Winning Digits (0-9)</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Digit A', val: digitA, set: setDigitA },
                { label: 'Digit B', val: digitB, set: setDigitB },
                { label: 'Digit C', val: digitC, set: setDigitC },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex flex-col items-center">
                  <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
                  <input
                    type="number" min="0" max="9" maxLength={1}
                    value={val}
                    onChange={e => set(e.target.value.slice(-1))}
                    className="w-full text-center bg-[#0f172a] border border-slate-700 focus:border-emerald-500 rounded-xl px-2 py-4 text-white font-mono text-3xl font-black focus:outline-none transition-colors"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            {digitA !== '' && digitB !== '' && digitC !== '' && (
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <p className="text-xs text-slate-400 mb-1">Winning Combination</p>
                <p className="text-3xl font-black text-emerald-400 tracking-widest font-mono">
                  A={digitA} · B={digitB} · C={digitC}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setResolveDraw(null); setDigitA(''); setDigitB(''); setDigitC(''); }}
                className="px-5 py-2.5 font-medium text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleResolveDraw} disabled={resolving}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-emerald-500/20">
                {resolving ? 'Processing...' : 'Confirm & Pay Winners'}
              </button>
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

      {/* ── Edit Resolve Modal ── */}
      {editResolveDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Edit ABC Result</h2>
            <p className="text-sm text-slate-400 mb-6">
              Game: <strong className="text-white">{editResolveDraw.game?.name}</strong><br />
              Scheduled: {new Date(editResolveDraw.scheduled_at).toLocaleString('en-IN')}
            </p>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Enter Winning Digits (0-9)</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Digit A', val: digitA, set: setDigitA },
                { label: 'Digit B', val: digitB, set: setDigitB },
                { label: 'Digit C', val: digitC, set: setDigitC },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex flex-col items-center">
                  <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
                  <input
                    type="number" min="0" max="9" maxLength={1}
                    value={val}
                    onChange={e => set(e.target.value.slice(-1))}
                    className="w-full text-center bg-[#0f172a] border border-slate-700 focus:border-emerald-500 rounded-xl px-2 py-4 text-white font-mono text-3xl font-black focus:outline-none transition-colors"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            {digitA !== '' && digitB !== '' && digitC !== '' && (
              <div className="mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                <p className="text-xs text-slate-400 mb-1">Winning Combination</p>
                <p className="text-3xl font-black text-indigo-400 tracking-widest font-mono">
                  A={digitA} · B={digitB} · C={digitC}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setEditResolveDraw(null); setDigitA(''); setDigitB(''); setDigitC(''); }}
                className="px-5 py-2.5 font-medium text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleEditResolveDraw} disabled={resolving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-indigo-500/20">
                {resolving ? 'Updating...' : 'Update Result'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

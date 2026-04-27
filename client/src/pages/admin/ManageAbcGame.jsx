import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPlus, FiActivity, FiX, FiImage, FiTrash2 } from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import ImageCropperModal from '../../components/ImageCropperModal';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_COLORS = {
  open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  completed: 'bg-slate-700/50 text-slate-400 border border-slate-600',
};

const TIME_SLOTS = [
  { label: '12 AM', value: '00:00' }, { label: '1 AM', value: '01:00' },
  { label: '2 AM', value: '02:00' }, { label: '3 AM', value: '03:00' },
  { label: '4 AM', value: '04:00' }, { label: '5 AM', value: '05:00' },
  { label: '6 AM', value: '06:00' }, { label: '7 AM', value: '07:00' },
  { label: '8 AM', value: '08:00' }, { label: '9 AM', value: '09:00' },
  { label: '10 AM', value: '10:00' }, { label: '11 AM', value: '11:00' },
  { label: '12 PM', value: '12:00' }, { label: '1 PM', value: '13:00' },
  { label: '2 PM', value: '14:00' }, { label: '3 PM', value: '15:00' },
  { label: '4 PM', value: '16:00' }, { label: '5 PM', value: '17:00' },
  { label: '6 PM', value: '18:00' }, { label: '7 PM', value: '19:00' },
  { label: '8 PM', value: '20:00' }, { label: '9 PM', value: '21:00' },
  { label: '10 PM', value: '22:00' }, { label: '11 PM', value: '23:00' },
];

export default function ManageAbcGame() {
  const { token } = useAuthStore();

  // ── State ──
  const [games, setGames] = useState([]);
  const [draws, setDraws] = useState([]);
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
  const [timeSlot, setTimeSlot] = useState('1PM');
  const [creatingDraw, setCreatingDraw] = useState(false);

  // Banner image
  const [showCropper, setShowCropper] = useState(false);
  const [bannerBlob, setBannerBlob] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Resolve Draw
  const [resolveDraw, setResolveDraw] = useState(null);
  const [digitA, setDigitA] = useState('');
  const [digitB, setDigitB] = useState('');
  const [digitC, setDigitC] = useState('');
  const [resolving, setResolving] = useState(false);

  // ── Fetchers ──
  const fetchData = async () => {
    try {
      setLoadingDraws(true);
      const [drawsRes, gamesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/draws`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 200 }
        }),
        axios.get(`${API_BASE_URL}/games`)
      ]);

      const allDraws = drawsRes.data.draws || [];
      setDraws(allDraws.filter(d => d.game?.type === 'abc'));
      setGames((gamesRes.data.games || []).filter(g => g.type === 'abc'));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoadingDraws(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  // ── Create Game ──
  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!gameName || !gameSlug) return toast.error('Name and slug are required');
    setCreatingGame(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/games`,
        { name: gameName, slug: gameSlug.toLowerCase().replace(/\s+/g, '-'), type: 'abc' },
        { headers: { Authorization: `Bearer ${token}` } }
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
        const drawTempId = `abc_${Date.now()}`;
        const storageRef = ref(storage, `draw-banners/${drawTempId}.webp`);
        const snapshot = await uploadBytes(storageRef, bannerBlob, { contentType: 'image/webp' });
        banner_url = await getDownloadURL(snapshot.ref);
        toast.dismiss('banner');
        setUploadingBanner(false);
      }

      await axios.post(`${API_BASE_URL}/admin/draws`,
        {
          game_id: parseInt(selectedGameId),
          scheduled_at,
          ticket_price: parseFloat(ticketPrice),
          time_slot: timeSlot,
          banner_url,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Draw created successfully!');
      setSelectedGameId(''); setDrawDate(''); setDrawHour(''); setTicketPrice(''); setTimeSlot('1PM');
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
      await axios.put(`${API_BASE_URL}/admin/draws/${drawId}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Draw closed!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close draw');
    }
  };

  // ── Delete Draw ──
  const handleDeleteDraw = async (drawId) => {
    if (!window.confirm('Are you sure you want to completely delete this draw? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/draws/${drawId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Draw deleted!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete draw');
    }
  };

  // ── Toggle Game Active Status (commented out) ──
  // const handleToggleGame = async (gameId, currentStatus) => {
  //   if (!window.confirm(`Are you sure you want to make this game ${currentStatus ? 'inactive' : 'active'}?`)) return;
  //   try {
  //     await axios.put(`${API_BASE_URL}/admin/games/${gameId}/toggle-active`, {}, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     toast.success(`Game marked as ${currentStatus ? 'inactive' : 'active'}!`);
  //     fetchData();
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || 'Failed to toggle game status');
  //   }
  // };

  // ── Delete Game ──
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game? To delete a game, it must NOT have any active draws.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      await axios.post(`${API_BASE_URL}/admin/results/abc`,
        { drawId: resolveDraw.id, a, b, c },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('ABC results announced & payouts processed!');
      setResolveDraw(null); setDigitA(''); setDigitB(''); setDigitC('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve draw');
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
          <form onSubmit={handleCreateDraw} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Game</label>
              <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="">Select game...</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Time Slot</label>
              <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="1PM">1PM Draw</option>
                <option value="8PM">8PM Draw</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Draw Date</label>
              <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Time</label>
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
              <input type="number" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} placeholder="e.g. 10" min="1" step="0.01"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-4">
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
          <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span> ABC Draws
        </h2>
        <div className="bg-[#1e293b]/80 backdrop-blur border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0f172a] text-slate-400 font-semibold uppercase text-xs">
              <tr>
                {/* <th className="px-4 py-4">Banner</th> */}
                <th className="px-6 py-4">Game</th>
                <th className="px-6 py-4">Time Slot</th>
                <th className="px-6 py-4">Scheduled At</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {loadingDraws ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-500">Loading draws...</td></tr>
              ) : draws.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-500">No ABC draws found. Create one above.</td></tr>
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
                  </td>
                  <td className="px-6 py-4">
                    {draw.time_slot ? (
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${draw.time_slot === '1PM'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>{draw.time_slot}</span>
                    ) : <span className="text-slate-500 text-xs">—</span>}
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
                          <button onClick={() => { setResolveDraw(draw); setDigitA(''); setDigitB(''); setDigitC(''); }}
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

      {/* ── Resolve Modal ── */}
      {resolveDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Announce ABC Result</h2>
            <p className="text-sm text-slate-400 mb-6">
              Game: <strong className="text-white">{resolveDraw.game?.name}</strong> · {resolveDraw.time_slot}<br />
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

    </div>
  );
}

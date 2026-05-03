import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiImage, FiTrash2, FiAward } from 'react-icons/fi';
import useAuthStore from '@/store/useAuthStore';
import ImageCropperModal from '@/components/ImageCropperModal';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import api from '@/config/api';
import { PRIZE_CONFIG } from '@/data.js'
import Header from './components/Header'
import GameForm from './components/GameForm'
import GamesList from './components/GamesList'
import DrawForm from './components/DrawForm'
import DrawsTable from './components/DrawsTable'
import ResolveModal from './components/ResolveModal'

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
  // Result image
  const [resultImageFile, setResultImageFile] = useState(null);
  const [resultImagePreview, setResultImagePreview] = useState(null);

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
        const timeStr = drawHour.replace(/:/g, '-');
        const drawTempId = `lottery_${drawDate}_${timeStr}_${Date.now()}`;
        const storageRef = ref(storage, `draw-banners/lottery/${drawTempId}.webp`);
        const snapshot = await uploadBytes(storageRef, bannerBlob, { contentType: 'image/webp' });
        banner_url = await getDownloadURL(snapshot.ref);
        toast.dismiss('banner');
        setUploadingBanner(false);
      }

      await api.post(`/admin/draws`,
        { game_id: parseInt(selectedGameId), scheduled_at, ticket_price: parseFloat(ticketPrice), time_slot: drawHour, banner_url }
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

  // ── Result image handlers ──
  const handleResultImageSelect = (file) => {
    setResultImageFile(file);
    setResultImagePreview(URL.createObjectURL(file));
  };
  const handleResultImageClear = () => {
    setResultImageFile(null);
    setResultImagePreview(null);
  };

  // ── Open / Close modal ──
  const openResolveModal = (draw) => {
    setResolveDraw(draw);
    setFirstBoxes(Array(8).fill(''));
    setPrizeNumbers({ second: [], third: [], fourth: [], fifth: [] });
    setPasteDraft({ second: '', third: '', fourth: '', fifth: '' });
    setResultImageFile(null);
    setResultImagePreview(null);
  };
  const closeResolveModal = () => {
    setResolveDraw(null);
    setFirstBoxes(Array(8).fill(''));
    setPrizeNumbers({ second: [], third: [], fourth: [], fifth: [] });
    setPasteDraft({ second: '', third: '', fourth: '', fifth: '' });
    setResultImageFile(null);
    setResultImagePreview(null);
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
      // Upload result image to Firebase Storage if selected
      let result_image_url = null;
      if (resultImageFile) {
        toast.loading('Uploading result image...', { id: 'result-img' });
        const scheduledDate = new Date(resolveDraw.scheduled_at);
        const dateStr = scheduledDate.toISOString().split('T')[0];
        const timeStr = scheduledDate.toTimeString().split(' ')[0].replace(/:/g, '-');
        const imgRef = ref(storage, `results/result_lottery_${resolveDraw.id}_${dateStr}_${timeStr}_${Date.now()}.webp`);
        const snapshot = await uploadBytes(imgRef, resultImageFile, { contentType: resultImageFile.type });
        result_image_url = await getDownloadURL(snapshot.ref);
        toast.dismiss('result-img');
      }

      await api.post(`/admin/results/lottery`, {
        drawId: resolveDraw.id,
        winningNumber: firstPrize,
        prizes: {
          second: prizeNumbers.second,
          third: prizeNumbers.third,
          fourth: prizeNumbers.fourth,
          fifth: prizeNumbers.fifth,
        },
        result_image_url,
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
      <Header
        setShowGameForm={setShowGameForm}
        setShowDrawForm={setShowDrawForm}
        games={games}
      />

      {/* ── Create Game Form ── */}
      <GameForm
        show={showGameForm}
        onClose={() => setShowGameForm(false)}
        onSubmit={handleCreateGame}
        gameName={gameName}
        gameSlug={gameSlug}
        setGameName={setGameName}
        setGameSlug={setGameSlug}
        loading={creatingGame}
      />

      {/* ── Create Draw Form ── */}
      <DrawForm
        show={showDrawForm}
        onClose={() => setShowDrawForm(false)}
        onSubmit={handleCreateDraw}
        games={games}

        selectedGameId={selectedGameId}
        setSelectedGameId={setSelectedGameId}
        drawDate={drawDate}
        setDrawDate={setDrawDate}
        drawHour={drawHour}
        setDrawHour={setDrawHour}
        ticketPrice={ticketPrice}
        setTicketPrice={setTicketPrice}

        bannerPreview={bannerPreview}
        setBannerPreview={setBannerPreview}
        setBannerBlob={setBannerBlob}

        showCropper={showCropper}
        setShowCropper={setShowCropper}

        loading={creatingDraw}
        uploading={uploadingBanner}
      />

      {/* ── Games List ── */}
      <GamesList games={games} />

      {/* ── Draws Table ── */}
      <DrawsTable
        draws={draws}
        loading={loadingDraws}
        onCloseDraw={handleCloseDraw}
        onDeleteDraw={handleDeleteDraw}
        onAnnounce={openResolveModal}
      />

      {/* ── Multi-Prize Result Announcement Modal ── */}
      <ResolveModal
        draw={resolveDraw}
        onClose={closeResolveModal}
        onSubmit={handleAnnounceResult}
        resolving={resolving}

        firstBoxes={firstBoxes}
        firstRefs={firstRefs}
        handleFirstBoxChange={handleFirstBoxChange}
        handleFirstBoxKeyDown={handleFirstBoxKeyDown}

        prizeNumbers={prizeNumbers}
        pasteDraft={pasteDraft}
        setPasteDraft={setPasteDraft}
        handlePasteDraft={handlePasteDraft}
        removeChip={removeChip}

        resultImagePreview={resultImagePreview}
        onResultImageSelect={handleResultImageSelect}
        onResultImageClear={handleResultImageClear}
      />

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

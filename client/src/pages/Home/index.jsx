import ProfileImg from "@/assets/imgs/default-profile-img.png"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../config/api"
import formatTime from "@/utils/formatTime"
import formatDate12Hour, { formatTime12Hour } from "@/utils/formatDate12Hour"
import useAuthStore from "../../store/useAuthStore"
import QuickActions from "./components/QuickActions"
import RecentWinners from "./components/RecentWinners"
import Header from "./components/Header"
import JackpotCard from "./components/JackpotCard"

const RecentWinnersData = [
    { name: 'Rahul K.', won: '₹12,000', game: 'Lucky Spin', img: '12' },
    { name: 'Sneha P.', won: '₹5,500', game: 'Bingo Rush', img: '44' },
    { name: 'Arjun M.', won: '₹8,200', game: 'Cards Win', img: '60' },
    { name: 'Priya S.', won: '₹3,100', game: 'Dice Roll', img: '36' },
]

function Countdown({ scheduledAt }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const timeLeft = Math.max(
        Math.floor((new Date(scheduledAt) - now) / 1000),
        0
    );

    return <span>⏱ {formatTime(timeLeft)}</span>;
}

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [lotteryDraws, setLotteryDraws] = useState([]);
    const [abcDraws, setAbcDraws] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useEffect(() => {
        // Show disclaimer only if user hasn't accepted it before
        const accepted = localStorage.getItem('disclaimer_accepted');
        if (!accepted) {
            setShowDisclaimer(true);
        }
    }, []);

    useEffect(() => {
        const fetchActiveDraws = async () => {
            try {
                const res = await api.get('/draws/active');
                if (res.data.success) {
                    const draws = res.data.draws;

                    // Separate by game type
                    setLotteryDraws(draws.filter(d => d.game.type === 'lottery'));

                    const abcDrawsRaw = draws.filter(d => d.game.type === 'abc');
                    const uniqueAbcDraws = [];
                    const seenGroups = new Set();

                    for (const draw of abcDrawsRaw) {
                        const dateObj = new Date(draw.scheduled_at);
                        // Using local timezone date string (YYYY-MM-DD format equivalent)
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const dateString = `${year}-${month}-${day}`;

                        const key = `${draw.game.id}-${dateString}`;
                        if (!seenGroups.has(key)) {
                            uniqueAbcDraws.push({ ...draw, groupedDate: dateString });
                            seenGroups.add(key);
                        }
                    }
                    setAbcDraws(uniqueAbcDraws);
                }
            } catch (err) {
                console.error("Failed to fetch active draws:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveDraws();
    }, []);

    // Time difference calculator for countdowns
    const calculateTimeLeft = (scheduledAt) => {
        const diff = new Date(scheduledAt).getTime() - new Date().getTime();
        return diff > 0 ? Math.floor(diff / 1000) : 0;
    };

    return (
        <div className="pb-4">

            {/* ── Disclaimer Modal ── */}
            {showDisclaimer && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        animation: 'fadeInOverlay 0.25s ease',
                    }}
                >
                    <div
                        style={{
                            background: 'linear-gradient(145deg, #ffffff, #f8f9ff)',
                            borderRadius: '20px',
                            padding: '28px 24px 24px',
                            maxWidth: '350px',
                            width: '100%',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.6)',
                            animation: 'slideUpModal 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                            position: 'relative',
                        }}
                    >
                        {/* Icon */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: '0 4px 15px rgba(239,68,68,0.35)',
                            }}>
                                ⚠️
                            </div>
                        </div>

                        {/* Title */}
                        <h2 style={{
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: '800',
                            color: '#111827',
                            marginBottom: '12px',
                            letterSpacing: '-0.3px',
                        }}>
                            Disclaimer
                        </h2>

                        {/* Divider */}
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)', marginBottom: '14px' }} />

                        {/* Body */}
                        <p style={{
                            fontSize: '13.5px',
                            lineHeight: '1.65',
                            color: '#4b5563',
                            textAlign: 'center',
                            marginBottom: '22px',
                        }}>
                            The developers and publishers of this app are not responsible for any personal, or other losses or damages incurred through the use of this app. All actions and decisions made based on the app's content are solely at the user's own risk. The app is provided <strong style={{ color: '#374151' }}>'as is,'</strong> without any warranties or guarantees. Users are advised to use the app responsibly.
                        </p>

                        {/* Close Button */}
                        <button
                            onClick={() => {
                                localStorage.setItem('disclaimer_accepted', 'true');
                                setShowDisclaimer(false);
                            }}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '13px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                letterSpacing: '0.2px',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; }}
                        >
                            I Understand
                        </button>
                    </div>

                    {/* Keyframe styles */}
                    <style>{`
                        @keyframes fadeInOverlay {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUpModal {
                            from { opacity: 0; transform: translateY(30px) scale(0.95); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                </div>
            )}

            {/* ── Top Header Bar ── */}
            <Header user={{
                name: user?.name || "Player",
                balance: user ? parseFloat(user.balance) : 0,
                avatar: user?.avatar_url || ProfileImg
            }} />

            {/* ── Jackpot Card ── */}
            {lotteryDraws.length > 0 && (
                <JackpotCard
                    draw={lotteryDraws[0]}
                    onPlay={() => navigate(`/lottery-ticket/${lotteryDraws[0].game.slug}?drawId=${lotteryDraws[0].id}`)}
                />
            )}

            {/* ── Quick Actions ── */}
            {/* <QuickActions /> */}

            {/* ── Lottery Games  ── */}
            <div className="px-4 mt-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[17px] font-black text-gray-900">🎰 Lottery Games</h3>
                </div>

                {loading ? (
                    <div className="text-sm text-gray-500">Loading games...</div>
                ) : lotteryDraws.length === 0 ? (
                    <div className="text-sm text-gray-500">No active lottery draws right now.</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {lotteryDraws.map((draw) => (
                            <div
                                key={draw.id}
                                className="relative overflow-hidden rounded-2xl cursor-pointer active:scale-95 transition-all bg-gray-200"
                                style={{ aspectRatio: '16/9' }}
                                onClick={() => navigate(`/lottery-ticket/${draw.game.slug}?drawId=${draw.id}`)}
                            >
                                {draw.banner_url || draw.game.banner_url ? (
                                    <img src={draw.banner_url || draw.game.banner_url} alt={draw.game.name} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-2 text-center text-white font-bold">
                                        {draw.game.name}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                <div className="absolute bottom-[24px] left-[6px] text-white text-[12px] font-bold">
                                    {draw.game.name}
                                </div>

                                <div className="absolute bottom-[5px] left-[6px] px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-mono font-bold">
                                    <Countdown scheduledAt={draw.scheduled_at} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Abc Games  ── */}
            <div className="px-4 mt-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[17px] font-black text-gray-900">🎲 ABC Games</h3>
                </div>

                {loading ? (
                    <div className="text-sm text-gray-500">Loading games...</div>
                ) : abcDraws.length === 0 ? (
                    <div className="text-sm text-gray-500">No active ABC draws right now.</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {abcDraws.map((draw) => (
                            <div
                                key={draw.id}
                                className="relative overflow-hidden rounded-2xl cursor-pointer active:scale-95 transition-all bg-gray-200"
                                style={{ aspectRatio: '16/9' }}
                                onClick={() => navigate(`/abc-ticket/${draw.game.slug}?drawId=${draw.id}&date=${draw.groupedDate}`)}
                            >
                                {draw.banner_url || draw.game.banner_url ? (
                                    <img src={draw.banner_url || draw.game.banner_url} alt={draw.game.name} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-2 text-center text-white font-bold">
                                        {draw.game.name}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                <div className="absolute bottom-[24px] left-[6px] text-white text-[12px] font-bold">
                                    {draw.game.name} {draw.time_slot && `- ${formatTime12Hour(draw.time_slot)}`}
                                </div>

                                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-mono font-bold">
                                    <Countdown scheduledAt={draw.scheduled_at} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Recent Winners ── */}
            {/* <RecentWinners data={RecentWinnersData} /> */}

        </div>
    );
}

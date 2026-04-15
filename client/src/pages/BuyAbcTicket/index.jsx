import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import Header from "./components/Header";
import DrawBanner from "./components/DrawBanner";
import TimeSelectorTabs from "./components/TimeSelectorTabs";
import Tabs from "./components/Tabs";
import BuyingTab from "./components/BuyingTab";
import HistoryTab from "./components/HistoryTab";
import BottomBar from "./components/BottomBar";
import HowToPlayModal from "./components/HowToPlayModal";

const API_BASE_URL = 'http://localhost:3000/api';

/* ── Countdown hook ── */
function useCountdown(targetDateStr) {
    const [secs, setSecs] = useState(0);

    useEffect(() => {
        if (!targetDateStr) return;
        
        const tick = () => {
            const diff = new Date(targetDateStr).getTime() - new Date().getTime();
            setSecs(diff > 0 ? Math.floor(diff / 1000) : 0);
        };
        
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetDateStr]);

    return secs;
}

/* ── Format seconds → 8 digit chars (DD HH MM SS) ── */
function toDigits(totalSecs) {
    const dd = String(Math.floor(totalSecs / 86400)).padStart(2, "0");
    const hh = String(Math.floor((totalSecs % 86400) / 3600)).padStart(2, "0");
    const mm = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
    const ss = String(totalSecs % 60).padStart(2, "0");
    return `${dd}:${hh}:${mm}:${ss}`.split("").filter((c) => c !== ":");
}

/* ══════════════════════ MAIN PAGE ══════════════════════ */
export default function BuyAbcTicket() {
    const navigate = useNavigate();
    const { game } = useParams();
    const { user, token, refreshProfile } = useAuthStore();

    /* ── API State ── */
    const [apiDraws, setApiDraws] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
        const fetchGameAndDraws = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE_URL}/games/${game}`);
                if (res.data.success && res.data.game.draws.length > 0) {
                    setApiDraws(res.data.game.draws);
                }
            } catch (err) {
                toast.error("Failed to load game details.");
            } finally {
                setLoading(false);
            }
        };
        fetchGameAndDraws();
    }, [game]);

    /* ── Tab + time slot ── */
    const [activeTab, setActiveTab] = useState("buying");
    
    // time_slot is usually "1PM" or "8PM" from DB
    const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
    
    const activeDraw = apiDraws[selectedTimeIndex] || null;
    const secs = useCountdown(activeDraw?.scheduled_at);
    const digits = toDigits(secs);

    // If activeDraw exists, use its price as 'single', and calculate double/triple based on ratios if needed. 
    // Actually, in the backend price is unified per draw, but slots dictate base prices.
    // Let's dynamically map it. Single = base, double = base + ~2, triple = base * ~3
    const basePrice = activeDraw ? parseFloat(activeDraw.ticket_price) : 10.4;
    const prices = {
        single: basePrice,
        double: basePrice * 1.15, // approx logic or hardcode for now
        triple: basePrice * 2.88
    };

    /* ── Number inputs ── */
    const [single, setSingle] = useState({ A: "", B: "", C: "" });
    const [double, setDouble] = useState({
        AB: { a: "", b: "" },
        AC: { a: "", b: "" },
        BC: { a: "", b: "" },
    });
    const [triple, setTriple] = useState({ a: "", b: "", c: "" });

    /* ── Quantities ── */
    const [singleQty, setSingleQty] = useState({ A: 1, B: 1, C: 1 });
    const [doubleQty, setDoubleQty] = useState({ AB: 1, AC: 1, BC: 1 });
    const [tripleQty, setTripleQty] = useState(1);

    /* ── Cart ── */
    const [selections, setSelections] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    /* ── How to Play modal ── */
    const [howToPlayOpen, setHowToPlayOpen] = useState(false);

    /* ── Tabs config ── */
    const tabList = [
        { key: "buying", label: "Buying" },
        { key: "history", label: "Result History" },
    ];

    /* ── Derived totals ── */
    const totalNumbers = selections.reduce((acc, s) => acc + (s.qty || 1), 0);
    const totalCost = selections.reduce((acc, s) => acc + s.price, 0);

    /* ── Actions ── */
    const addSelection = (type, pricePerTicket, data, qty = 1) => {
        setSelections((prev) => [
            ...prev,
            {
                type,
                price: pricePerTicket * qty,
                pricePerTicket,
                data,
                qty,
                id: Date.now() + Math.random(),
            },
        ]);
    };

    const removeSelection = (id) => {
        setSelections((prev) => prev.filter((s) => s.id !== id));
    };

    const quickGuess = (type) => {
        const r = () => Math.floor(Math.random() * 10);
        if (type === "single") {
            setSingle({ A: r(), B: r(), C: r() });
        } else if (type === "double") {
            setDouble({
                AB: { a: r(), b: r() },
                AC: { a: r(), b: r() },
                BC: { a: r(), b: r() },
            });
        } else {
            setTriple({ a: r(), b: r(), c: r() });
        }
    };

    const handlePurchase = async () => {
        if (!activeDraw) return toast.error("No active draw available");
        if (selections.length === 0) return toast.error("Cart is empty");
        if (user.balance < totalCost) return toast.error("Insufficient balance!");

        // Map selections to API payload expects { type, position, digits, qty }
        const payload = selections.map(s => {
            let position = '';
            let digits = '';
            if (s.type === 'single') {
                position = s.data.board; // 'A', 'B', 'C'
                digits = String(s.data.digit);
            } else if (s.type === 'double') {
                position = s.data.combo; // 'AB', 'AC', 'BC'
                digits = `${s.data.a}${s.data.b}`;
            } else {
                position = 'ABC';
                digits = `${s.data.a}${s.data.b}${s.data.c}`;
            }
            
            return {
                type: s.type,
                position,
                digits,
                qty: s.qty
            };
        });

        try {
            setIsPurchasing(true);
            const res = await axios.post(`${API_BASE_URL}/abc-tickets/purchase`, {
                drawId: activeDraw.id,
                selections: payload
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("ABC Tickets purchased successfully!");
                setSelections([]);
                setCartOpen(false);
                refreshProfile();
                navigate('/tickets');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Purchase failed");
        } finally {
            setIsPurchasing(false);
        }
    };

    if (loading) {
       return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">Loading...</div>;
    }

    return (
        <div
            className="relative flex flex-col min-h-screen"
            style={{ background: "#f0f2f8", fontFamily: "'Inter', sans-serif" }}
        >
            {/* Header */}
            <Header
                onBack={() => navigate(-1)}
                onTicket={() => navigate("/tickets")}
            />

            {/* Time selector tabs */}
            {apiDraws.length > 0 ? (
                <TimeSelectorTabs
                    times={apiDraws.map((d) => d.time_slot || new Date(d.scheduled_at).toLocaleTimeString())}
                    activeIndex={selectedTimeIndex}
                    onChange={setSelectedTimeIndex}
                />
            ) : (
                <div className="p-4 text-center text-red-500 font-bold">No active draws for this game.</div>
            )}

            {/* Draw banner */}
            <DrawBanner
                title={`ABC-${game ? game.toUpperCase() : ''} ${activeDraw?.time_slot || ''}`}
                date={activeDraw ? new Date(activeDraw.scheduled_at).toLocaleDateString('en-GB') : "N/A"}
                digits={digits}
                balls={[
                    { label: "5", color: "linear-gradient(135deg, #dc2626, #f87171)" },
                    { label: "7", color: "linear-gradient(135deg, #d97706, #fbbf24)" },
                    { label: "5", color: "linear-gradient(135deg, #2563eb, #60a5fa)" },
                ]}
                onHowToPlay={() => setHowToPlayOpen(true)}
            />

            {/* Buying / History tabs */}
            <Tabs tabs={tabList} activeTab={activeTab} onChange={setActiveTab} />

            {/* Buying tab */}
            {activeTab === "buying" && (
                <BuyingTab
                    single={single} setSingle={setSingle}
                    double={double} setDouble={setDouble}
                    triple={triple} setTriple={setTriple}
                    singleQty={singleQty} setSingleQty={setSingleQty}
                    doubleQty={doubleQty} setDoubleQty={setDoubleQty}
                    tripleQty={tripleQty} setTripleQty={setTripleQty}
                    addSelection={addSelection}
                    quickGuess={quickGuess}
                    prices={prices}
                />
            )}

            {/* History tab */}
            {activeTab === "history" && <HistoryTab data={[]} />}

            {/* Bottom bar */}
            <BottomBar
                totalNumbers={totalNumbers}
                totalCost={totalCost}
                balance={user ? parseFloat(user.balance) : 0}
                onBuy={handlePurchase}
                isPurchasing={isPurchasing}
                cartOpen={cartOpen}
                onToggleCart={() => setCartOpen((o) => !o)}
                selections={selections}
                onRemoveSelection={removeSelection}
            />

            {/* How to Play modal */}
            {howToPlayOpen && (
                <HowToPlayModal onClose={() => setHowToPlayOpen(false)} />
            )}
        </div>
    );
}

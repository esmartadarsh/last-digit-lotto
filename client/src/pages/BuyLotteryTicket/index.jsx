import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import formatTime from "@/utils/formatTime";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import api from "../../config/api";
import Header from "./components/Header.jsx";
import DrawBanner from "./components/DrawBanner";
import JackpotNumbers from "./components/JackpotNumbers";
import Tabs from "./components/Tabs";
import BottomBar from "./components/BottomBar.jsx";
import BuyingSection from "./components/BuyingSection.jsx";
import ResultsSection from "./components/ResultsSection.jsx";
import {
  generateTicketId,
  generateSameSetOptions,
  validateCustomTicket,
} from "../../utils/ticketGenerator";


/* ── Static Data ── */
const JACKPOT_BALLS = ["8", "8", "C", "2", "0", "6", "6", "2"];

export default function BuyLotteryTicket() {
  const navigate = useNavigate();
  const { game } = useParams();
  const { user, token, refreshProfile } = useAuthStore();

  /* ── API State ── */
  const [activeDraw, setActiveDraw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  /* ── Outer tab (Buying / Result History) ── */
  const [activeTab, setActiveTab] = useState("buying");
  const [recentResults, setRecentResults] = useState([]);

  /* ── Purchase mode ── */
  const [buyMode, setBuyMode] = useState("quickPicks");

  /* ── Same Set state ── */
  const [sameSetSubTab, setSameSetSubTab] = useState("numberSelect");
  const [sameSetOptions, setSameSetOptions] = useState(() => generateSameSetOptions(6));
  const [luckyNumber, setLuckyNumber] = useState("");

  /* ── Customize state ── */
  const [customBoxes, setCustomBoxes] = useState(Array(8).fill(""));

  /* ── Unified cart ── */
  const [cartItems, setCartItems] = useState([]);

  /* ── Draw date ── */
  const [selectedDate, setSelectedDate] = useState("");

  /* ── About accordion ── */
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const fetchGameAndDraw = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/games/${game}`);
        if (res.data.success && res.data.game.draws.length > 0) {
          const draw = res.data.game.draws[0];
          setActiveDraw(draw);
          setSelectedDate(draw.scheduled_at.split('T')[0]);
        }
      } catch (err) {
        toast.error("Failed to load game details.");
      } finally {
        setLoading(false);
      }
    };
    fetchGameAndDraw();
  }, [game]);

  useEffect(() => {
    if (activeTab === "history" && recentResults.length === 0) {
      api
        .get(`/results/lottery/recent?game=${game}`)
        .then((res) => {
          if (res.data.success) {
            setRecentResults(res.data.results);
          }
        })
        .catch((err) => console.error("Failed to fetch results", err));
    }
  }, [activeTab, game, recentResults.length]);

  /* ── Derived totals ── */
  const totalTickets = cartItems.reduce(
    (sum, item) => sum + (item.kind === "sameSet" ? 10 : 1),
    0
  );
  const TICKET_PRICE = activeDraw ? parseFloat(activeDraw.ticket_price) : 0;
  const totalCost = totalTickets * TICKET_PRICE;

  /* ── Actions ── */

  // Add 10 fully random tickets
  const addQuickPicks = () => {
    const newItems = Array.from({ length: 10 }, () => ({
      kind: "ticket",
      id: generateTicketId(),
    }));
    setCartItems((prev) => [...prev, ...newItems]);
  };

  const addOneTicket = () =>
    setCartItems((prev) => [...prev, { kind: "ticket", id: generateTicketId() }]);

  const toggleSameSet = (last4) => {
    const exists = cartItems.some((i) => i.kind === "sameSet" && i.last4 === last4);
    if (exists) {
      setCartItems((prev) =>
        prev.filter((i) => !(i.kind === "sameSet" && i.last4 === last4))
      );
    } else {
      setCartItems((prev) => [...prev, { kind: "sameSet", last4 }]);
    }
  };

  const addLuckyNumber = () => {
    if (!/^\d{4}$/.test(luckyNumber)) return;
    const exists = cartItems.some((i) => i.kind === "sameSet" && i.last4 === luckyNumber);
    if (!exists) {
      setCartItems((prev) => [...prev, { kind: "sameSet", last4: luckyNumber }]);
    }
    setLuckyNumber("");
  };

  const refreshSameSetOptions = () => {
    const inCart = cartItems.filter((i) => i.kind === "sameSet").map((i) => i.last4);
    setSameSetOptions(generateSameSetOptions(6, inCart));
  };

  const addCustomTicket = () => {
    if (!validateCustomTicket(customBoxes)) return;
    const ticketId = customBoxes.join("").toUpperCase();
    const duplicate = cartItems.some((i) => i.kind === "ticket" && i.id === ticketId);
    if (!duplicate) {
      setCartItems((prev) => [...prev, { kind: "ticket", id: ticketId }]);
      setCustomBoxes(Array(8).fill(""));
    }
  };

  const removeCartItem = (idx) =>
    setCartItems((prev) => prev.filter((_, i) => i !== idx));

  const clearCart = () => setCartItems([]);

  const handlePurchase = async () => {
    // Auth gate — browsing is open, but payment requires login
    if (!user || !token) {
      toast.error("Please log in to purchase tickets");
      navigate('/login', { state: { from: `/lottery-ticket/${game}` } });
      return;
    }
    if (!activeDraw) return toast.error("No active draw available");
    if (cartItems.length === 0) return toast.error("Cart is empty");
    // TODO: re-enable balance check once Razorpay top-up is wired
    // if (parseFloat(user.balance) < totalCost) return toast.error("Insufficient balance!");

    // Map cart items into the format the backend expects
    const payloadTickets = cartItems.map(item => {
      if (item.kind === 'ticket') {
        return { ticketNumber: item.id, kind: 'ticket' };
      } else {
        // Unroll sameSet logic is NOT needed here because the backend handles expanding them if needed,
        // oh wait, my backend expects 8 char ticket numbers for ALL tickets.
        // Let's generate the first 4 chars here and let backend save the full 8 chars.
        // Actually, backend needs the FULL 10 tickets explicitly sent from the client.
        const fullSet = [];
        for (let i = 0; i < 10; i++) {
          fullSet.push({
            ticketNumber: generateTicketId().substring(0, 4) + item.last4,
            kind: 'sameSet',
            last4: item.last4
          });
        }
        return fullSet;
      }
    }).flat();

    try {
      setIsPurchasing(true);
      const res = await api.post(`/lottery-tickets/purchase`, {
        drawId: activeDraw.id,
        tickets: payloadTickets
      });

      if (res.data.success) {
        toast.success("Tickets purchased successfully!");
        clearCart();
        refreshProfile(); // update balance
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
      className="relative flex flex-col min-h-screen pb-20"
      style={{ background: "#f0f2f8", fontFamily: "'Inter', sans-serif" }}
    >
      <Header title={game ? game.toUpperCase() : "Lottery"} />

      <DrawBanner
        username={user?.name || "Player"}
        drawNumber={`NO.${activeDraw?.id.substring(0, 8)}`}
        drawTime={activeDraw ? new Date(activeDraw.scheduled_at).toLocaleString('en-GB') : "N/A"}
        bannerUrl={activeDraw?.banner_url}
      />

      <JackpotNumbers balls={JACKPOT_BALLS} />

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "buying" && (
        <BuyingSection
          cartItems={cartItems}
          buyMode={buyMode}
          setBuyMode={setBuyMode}
          sameSetSubTab={sameSetSubTab}
          setSameSetSubTab={setSameSetSubTab}
          sameSetOptions={sameSetOptions}
          luckyNumber={luckyNumber}
          setLuckyNumber={setLuckyNumber}
          customBoxes={customBoxes}
          setCustomBoxes={setCustomBoxes}
          addQuickPicks={addQuickPicks}
          addOneTicket={addOneTicket}
          toggleSameSet={toggleSameSet}
          addLuckyNumber={addLuckyNumber}
          refreshSameSetOptions={refreshSameSetOptions}
          addCustomTicket={addCustomTicket}
          removeCartItem={removeCartItem}
          clearCart={clearCart}
          DRAW_DATES={[{ label: selectedDate, value: selectedDate }]}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          aboutOpen={aboutOpen}
          setAboutOpen={setAboutOpen}
        />
      )}

      {activeTab === "history" && <ResultsSection data={recentResults} />}

      <BottomBar
        ticketsCount={totalTickets}
        totalCost={totalCost}
        balance={user ? parseFloat(user.balance) : 0}
        onPurchase={handlePurchase}
        isPurchasing={isPurchasing}
      />
    </div>
  );
}

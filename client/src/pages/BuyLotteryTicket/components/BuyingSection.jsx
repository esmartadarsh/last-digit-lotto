import { useRef } from "react";

/* ─── helpers ─── */
const formatCardDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

/* ─── sub-components ─── */

function ModeSelector({ buyMode, setBuyMode, addQuickPicks }) {
  const modes = [
    { key: "quickPicks", icon: "🛒", label: "10 Quick Picks" },
    { key: "sameSet", icon: "🛒", label: "10 Same Set" },
    { key: "customize", icon: "", label: "Customize your tickets" },
  ];
  return (
    <div
      className="flex rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid #e5e7eb", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {modes.map((m, i) => (
        <div key={m.key} className="flex flex-1">
          {i > 0 && <div style={{ width: "1px", background: "#e5e7eb", flexShrink: 0 }} />}
          <button
            onClick={() => {
              setBuyMode(m.key);
              if (m.key === "quickPicks") addQuickPicks();
            }}
            className="flex-1 py-3 px-1.5 flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-95"
            style={
              buyMode === m.key
                ? { background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff" }
                : { background: "#fff", color: "#374151" }
            }
          >
            <p className="text-[11px] font-black leading-tight block"> {m.icon} {m.label} </p>
            {/* { && <span className="text-base leading-none">{m.icon}</span>} */}
            {/* {<span className="text-[11px] font-black leading-tight block">{m.label}</span>} */}
          </button>
        </div>
      ))}
    </div>
  );
}

function SameSetPanel({
  sameSetSubTab, setSameSetSubTab,
  sameSetOptions, selectedDate,
  luckyNumber, setLuckyNumber,
  toggleSameSet, addLuckyNumber, refreshSameSetOptions,
  cartItems,
}) {
  const inCart = cartItems.filter((i) => i.kind === "sameSet").map((i) => i.last4);
  const isSelected = (opt) => inCart.includes(opt);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}
    >
      {/* Sub-tab toggle */}
      <div className="flex gap-1 bg-gray-100 p-1">
        {[
          { key: "numberSelect", label: "Number Select" },
          { key: "luckyNumber", label: "Lucky Number" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSameSetSubTab(t.key)}
            className="flex-1 py-2 rounded-xl text-[12px] font-black transition-all active:scale-95"
            style={
              sameSetSubTab === t.key
                ? { background: "#fff", color: "#16a34a", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
                : { background: "transparent", color: "#9ca3af" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Number Select ── */}
      {sameSetSubTab === "numberSelect" && (
        <div className="bg-white px-4 pb-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-[13px] font-black text-gray-800">Number Select</p>
              <p className="text-[11px] text-gray-400">10 tickets for per set</p>
            </div>
            <button
              onClick={refreshSameSetOptions}
              className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-all"
              style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}
            >
              <span className="text-green-600 text-base">🔄</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {sameSetOptions.map((opt) => {
              const sel = isSelected(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleSameSet(opt)}
                  className="rounded-2xl overflow-hidden text-left transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    border: sel ? "2.5px solid #fbbf24" : "2.5px solid transparent",
                    boxShadow: sel
                      ? "0 0 0 2px rgba(251,191,36,0.4), 0 4px 12px rgba(34,197,94,0.3)"
                      : "0 4px 12px rgba(34,197,94,0.2)",
                  }}
                >
                  {/* badge + checkbox */}
                  <div className="flex items-center justify-between px-2.5 pt-2.5">
                    <span
                      className="text-white font-black text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#f59e0b" }}
                    >
                      10
                    </span>
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center"
                      style={{
                        background: sel ? "#fff" : "rgba(255,255,255,0.25)",
                        border: "1.5px solid rgba(255,255,255,0.7)",
                      }}
                    >
                      {sel && <span className="text-green-600 text-[9px] font-black">✓</span>}
                    </div>
                  </div>

                  {/* 4-digit number */}
                  <p className="text-orange-400 font-black text-2xl text-center tracking-wider px-2 py-1">
                    {opt}
                  </p>

                  {/* date */}
                  <p className="text-green-200 font-bold text-[10px] text-center pb-2.5 px-2">
                    {formatCardDate(selectedDate)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lucky Number ── */}
      {sameSetSubTab === "luckyNumber" && (
        <div className="bg-white px-4 py-4">
          <p className="text-[13px] font-black text-gray-800 mb-0.5">Enter your lucky 4 digits</p>
          <p className="text-[11px] text-gray-400 mb-4">These will be the last 4 digits of all 10 tickets</p>
          <div className="flex gap-1 w-[100%]">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={4}
              value={luckyNumber}
              onChange={(e) => setLuckyNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              className="flex-1 w-[80%] px-4 py-3 rounded-xl text-center outline-none"
              style={{
                background: "#f9fafb",
                border: "2px solid #e5e7eb",
                fontSize: "24px",
                fontWeight: 900,
                color: "#f97316",
                letterSpacing: "0.25em",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <button
              onClick={addLuckyNumber}
              disabled={luckyNumber.length !== 4}
              className="px-5 w-[20%] rounded-xl font-black text-[12px] transition-all active:scale-95"
              style={{
                background: luckyNumber.length === 4
                  ? "linear-gradient(135deg,#16a34a,#15803d)"
                  : "#e5e7eb",
                color: luckyNumber.length === 4 ? "#fff" : "#9ca3af",
                boxShadow: luckyNumber.length === 4 ? "0 6px 16px rgba(22,163,74,0.35)" : "none",
              }}
            >
              Add ×10
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomizePanel({ customBoxes, setCustomBoxes, addCustomTicket }) {
  const inputRefs = useRef([]);

  const isLetterBox = (i) => i === 2;

  const handleChange = (idx, rawValue) => {
    const cleaned = isLetterBox(idx)
      ? rawValue.replace(/[^A-Za-z]/g, "").toUpperCase().slice(-1)
      : rawValue.replace(/\D/g, "").slice(-1);

    const next = [...customBoxes];
    next[idx] = cleaned;
    setCustomBoxes(next);

    if (cleaned && idx < 7) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !customBoxes[idx] && idx > 0) {
      const next = [...customBoxes];
      next[idx - 1] = "";
      setCustomBoxes(next);
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const BOX_META = [
    { label: "N", color: "#6366f1" },
    { label: "N", color: "#6366f1" },
    { label: "L", color: "#dc2626" },
    { label: "N", color: "#6366f1" },
    { label: "N", color: "#6366f1" },
    { label: "N", color: "#6366f1" },
    { label: "N", color: "#6366f1" },
    { label: "N", color: "#6366f1" },
  ];

  const allFilled = customBoxes.every((b) => b !== "");

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
      >
        <p className="text-white font-black text-[13px]">Customize Your Ticket</p>
        <p className="text-indigo-200 text-[11px] mt-0.5">Format: N N L N N N N N</p>
      </div>

      <div className="px-4 py-4">
        {/* 8 input boxes */}
        <div className="flex gap-1.5 justify-between mb-4">
          {BOX_META.map((meta, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <input
                ref={(el) => (inputRefs.current[i] = el)}
                type={isLetterBox(i) ? "text" : "tel"}
                inputMode={isLetterBox(i) ? "text" : "numeric"}
                maxLength={1}
                value={customBoxes[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-full rounded-xl text-center font-black text-base outline-none transition-all"
                style={{
                  height: "44px",
                  background: customBoxes[i] ? "#f0f9ff" : "#f9fafb",
                  border: customBoxes[i]
                    ? `2px solid ${meta.color}`
                    : "2px solid #e5e7eb",
                  color: meta.color,
                  fontFamily: "'Inter', monospace",
                }}
              />
              <span className="text-[9px] font-black" style={{ color: meta.color }}>
                {meta.label}
              </span>
            </div>
          ))}
        </div>

        {/* Preview */}
        {allFilled && (
          <div
            className="mb-3 py-2 rounded-xl text-center font-black tracking-widest"
            style={{ background: "#f0fdf4", border: "1.5px solid #86efac", color: "#16a34a", fontSize: "18px" }}
          >
            {customBoxes.join("")}
          </div>
        )}

        {/* Add button */}
        <button
          onClick={addCustomTicket}
          disabled={!allFilled}
          className="w-full py-3 rounded-xl font-black text-[13px] transition-all active:scale-95"
          style={{
            background: allFilled
              ? "linear-gradient(135deg,#6366f1,#4f46e5)"
              : "#e5e7eb",
            color: allFilled ? "#fff" : "#9ca3af",
            boxShadow: allFilled ? "0 6px 16px rgba(99,102,241,0.35)" : "none",
          }}
        >
          ＋ Add Ticket to Cart
        </button>
      </div>
    </div>
  );
}

function ShoppingCart({ cartItems, removeCartItem, clearCart, addOneTicket }) {
  const total = cartItems.reduce((s, i) => s + (i.kind === "sameSet" ? 10 : 1), 0);
  const sameSetItems = cartItems.filter((i) => i.kind === "sameSet");
  const ticketItems = cartItems.map((item, idx) => ({ ...item, _idx: idx })).filter((i) => i.kind === "ticket");

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-white text-base">🛒</span>
          <span className="text-white font-black text-[13px]">Shopping Cart ({total})</span>
        </div>
        <button
          onClick={clearCart}
          className="w-7 h-7 flex items-center justify-center rounded-lg active:scale-90 transition-all"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <span className="text-white text-sm">🗑</span>
        </button>
      </div>

      <div className="bg-white px-4 py-3">
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4 font-medium">
            Your cart is empty. Add some tickets!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Same-set group rows */}
            {sameSetItems.length > 0 && (
              <div className="flex flex-col gap-2">
                {cartItems.map((item, idx) => {
                  if (item.kind !== "sameSet") return null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-white font-black text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "#16a34a" }}
                        >
                          ×10
                        </span>
                        <span className="font-black text-[13px]">
                          <span className="text-gray-400">(----)</span>
                          <span className="text-orange-500">{item.last4}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => removeCartItem(idx)}
                        className="w-5 h-5 flex items-center justify-center rounded-full active:scale-90 transition-all"
                        style={{ background: "#fee2e2" }}
                      >
                        <span className="text-red-500 font-black text-[11px] leading-none">−</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Individual ticket chips (3-col grid) */}
            {ticketItems.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {cartItems.map((item, idx) => {
                  if (item.kind !== "ticket") return null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl"
                      style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
                    >
                      <span className="text-[10px] font-bold text-gray-700 tracking-tight">
                        {item.id}
                      </span>
                      <button
                        onClick={() => removeCartItem(idx)}
                        className="w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 active:scale-90 transition-all"
                        style={{ background: "#fee2e2", marginLeft: "3px" }}
                      >
                        <span className="text-red-500 text-[10px] font-black leading-none">−</span>
                      </button>
                    </div>
                  );
                })}

                {/* ⊕ Add one ticket */}
                <button
                  onClick={addOneTicket}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl font-bold text-[11px] active:scale-95 transition-all"
                  style={{ border: "2px dashed #dc2626", color: "#dc2626", background: "#fff5f5" }}
                >
                  <span className="text-base leading-none">⊕</span> Add
                </button>
              </div>
            )}

            {/* If only same-sets exist, still show the Add button */}
            {ticketItems.length === 0 && sameSetItems.length > 0 && (
              <button
                onClick={addOneTicket}
                className="self-start flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-[11px] active:scale-95 transition-all"
                style={{ border: "2px dashed #dc2626", color: "#dc2626", background: "#fff5f5" }}
              >
                <span className="text-base leading-none">⊕</span> Add single ticket
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function BuyingSection({
  cartItems,
  buyMode, setBuyMode,
  sameSetSubTab, setSameSetSubTab,
  sameSetOptions,
  luckyNumber, setLuckyNumber,
  customBoxes, setCustomBoxes,
  addQuickPicks,
  addOneTicket,
  toggleSameSet,
  addLuckyNumber,
  refreshSameSetOptions,
  addCustomTicket,
  removeCartItem,
  clearCart,
  DRAW_DATES, selectedDate, setSelectedDate,
  aboutOpen, setAboutOpen,
}) {
  return (
    <div className="px-4 mt-4 space-y-4 pb-36">

      {/* 1 ── Mode Selector ── */}
      <ModeSelector buyMode={buyMode} setBuyMode={setBuyMode} addQuickPicks={addQuickPicks} />

      {/* 2 ── Conditional panels ── */}
      {buyMode === "sameSet" && (
        <SameSetPanel
          sameSetSubTab={sameSetSubTab}
          setSameSetSubTab={setSameSetSubTab}
          sameSetOptions={sameSetOptions}
          selectedDate={selectedDate}
          luckyNumber={luckyNumber}
          setLuckyNumber={setLuckyNumber}
          toggleSameSet={toggleSameSet}
          addLuckyNumber={addLuckyNumber}
          refreshSameSetOptions={refreshSameSetOptions}
          cartItems={cartItems}
        />
      )}

      {buyMode === "customize" && (
        <CustomizePanel
          customBoxes={customBoxes}
          setCustomBoxes={setCustomBoxes}
          addCustomTicket={addCustomTicket}
        />
      )}

      {/* 3 ── Shopping Cart ── */}
      <ShoppingCart
        cartItems={cartItems}
        removeCartItem={removeCartItem}
        clearCart={clearCart}
        addOneTicket={addOneTicket}
      />

      {/* 4 ── Draw Date Selector ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}
      >
        <div className="px-4 py-3" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          <p className="text-white font-black text-[13px]">Select Draw Date</p>
        </div>
        <div className="bg-white px-4 py-3 flex gap-2 flex-wrap">
          {DRAW_DATES.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
              style={
                selectedDate === d.value
                  ? { background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", boxShadow: "0 4px 12px rgba(220,38,38,0.3)" }
                  : { background: "#f3f4f6", color: "#6b7280" }
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5 ── About Accordion ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}
      >
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white active:bg-gray-50 transition-all"
        >
          <span className="font-bold text-[13px] text-gray-700">About Nagaland Lottery Online</span>
          <span className="text-gray-400 font-black text-lg">{aboutOpen ? "∧" : "∨"}</span>
        </button>
        {aboutOpen && (
          <div className="px-4 pb-4 bg-white text-[12px] text-gray-500 leading-relaxed border-t border-gray-100">
            <p className="mt-2">
              The Nagaland State Lottery is one of India's most popular government-authorized lotteries.
              Draws are held multiple times a day and prizes range from ₹7,000 to the jackpot of ₹1,00,00,000+.
            </p>
            <p className="mt-2">
              Tickets are sold officially and results are published on the official government website.
              Play responsibly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
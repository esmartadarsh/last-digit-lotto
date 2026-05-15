import React from "react";

/* ── Per-combination ticket limits (mirrors server LIMITS) ── */
const LIMITS = { single: 1000, double: 100, triple: 100 };

/* How many of this combination are already in the cart */
function getCartQty(selections, type, position, digits) {
    return selections.reduce((sum, s) => {
        if (s.type !== type) return sum;
        let sPos = '';
        let sDig = '';
        if (type === 'single') { sPos = s.data.board; sDig = String(s.data.digit); }
        else if (type === 'double') { sPos = s.data.combo; sDig = `${s.data.a}${s.data.b}`; }
        else { sPos = 'ABC'; sDig = `${s.data.a}${s.data.b}${s.data.c}`; }
        return (sPos === position && sDig === digits) ? sum + (s.qty || 0) : sum;
    }, 0);
}

/* Remaining capacity for a specific combination */
function getRemaining(soldQty, selections, type, position, digits) {
    if (!digits || String(digits).trim() === '') return LIMITS[type];
    const key = `${type}|${position}|${digits}`;
    const sold = soldQty[key] || 0;
    const inCart = getCartQty(selections, type, position, digits);
    return Math.max(0, LIMITS[type] - sold - inCart);
}

/* Small badge showing remaining tickets for a filled combination */
function RemainingBadge({ remaining, type }) {
    const limit = LIMITS[type];
    const pct = remaining / limit;
    const color = remaining === 0 ? '#dc2626' : pct < 0.1 ? '#d97706' : '#16a34a';
    const bg = remaining === 0 ? '#fee2e2' : pct < 0.1 ? '#fef3c7' : '#f0fdf4';
    return (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ color, background: bg }}>
            {remaining === 0 ? '🚫 Sold Out' : `${remaining} left`}
        </span>
    );
}

/* ── Section header ── */
function SectionHeader({ title, perTicket, win, onQuickGuess }) {
    return (
        <div className="flex items-center justify-between mb-3">
            <div>
                <span className="font-black text-gray-900 text-[14px]">{title}</span>
                <br />
                <span className="text-red-500 font-bold text-[11px]">₹{perTicket}/Ticket</span>
            </div>
            <div className="flex items-center gap-2">
                <span
                    className="font-black text-[13px] px-2 py-0.5 rounded-lg"
                    style={{ color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a" }}
                >
                    WIN {win}
                </span>
                <button
                    onClick={onQuickGuess}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 active:scale-95 transition-all"
                    style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}
                >
                    Quick Guess
                </button>
            </div>
        </div>
    );
}

/* ── Lottery ball ── */
function Ball({ label, color }) {
    const colors = {
        red: "linear-gradient(135deg, #dc2626, #f87171)",
        orange: "linear-gradient(135deg, #d97706, #fbbf24)",
        blue: "linear-gradient(135deg, #2563eb, #60a5fa)",
    };
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-[15px] flex-shrink-0"
            style={{
                background: colors[color] || colors.red,
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
        >
            {label}
        </div>
    );
}

/* ── Number input box ── */
function NumBox({ value, onChange, placeholder = "-" }) {
    const handleChange = (e) => {
        let val = e.target.value;

        // allow only digits
        val = val.replace(/[^0-9]/g, "");

        // allow only 1 digit
        if (val.length > 1) return;

        onChange(val);
    };

    return (
        <input
            type="text"   // ✅ change from number → text
            inputMode="numeric" // ✅ mobile numeric keyboard
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="text-center font-bold text-gray-700 text-sm outline-none"
            style={{
                width: 36,
                height: 36,
                border: "1.5px solid #d1d5db",
                borderRadius: 8,
                background: "#fff",
            }}
        />
    );
}

/* ── Quantity stepper: − qty + ── */
function QuantityStepper({ qty, onChange, max }) {
    const [inputValue, setInputValue] = React.useState(qty);

    React.useEffect(() => {
        setInputValue(qty);
    }, [qty]);

    const clamp = (v) => Math.min(max !== undefined ? max : Infinity, Math.max(1, v));

    const handleInputChange = (e) => {
        let val = e.target.value.replace(/\D/g, "");
        const num = parseInt(val, 10);

        if (!isNaN(num) && num >= 1) {
            // Clamp immediately so the display NEVER shows a value above max.
            // Previously setInputValue(val) ran first — when clamp(num) === qty
            // React bailed on the re-render and useEffect never corrected the display,
            // leaving the raw typed value visible and bypassing the limit on ADD.
            const clamped = clamp(num);
            setInputValue(clamped);
            onChange(clamped);
        } else {
            // Allow empty / mid-delete state in the display only
            setInputValue(val);
        }
    };

    const handleBlur = () => {
        const num = parseInt(inputValue, 10);
        if (!num || num < 1) { setInputValue(1); onChange(1); }
        else if (max !== undefined && num > max) { setInputValue(max); onChange(max); }
    };

    const atMax = max !== undefined && (parseInt(qty) || 1) >= max;

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onChange(Math.max(1, (parseInt(qty) || 1) - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg font-black text-gray-600 active:scale-90 transition-all select-none flex-shrink-0"
                style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}
            >
                −
            </button>
            <input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="text-gray-800 font-black text-[13px] w-10 text-center outline-none bg-transparent"
                style={{ minWidth: "40px" }}
            />
            <button
                onClick={() => !atMax && onChange(clamp((parseInt(qty) || 1) + 1))}
                disabled={atMax}
                className="w-7 h-7 flex items-center justify-center rounded-lg font-black text-white active:scale-90 transition-all select-none flex-shrink-0"
                style={{ background: atMax ? "#d1d5db" : "linear-gradient(135deg, #66bb6a, #43a047)" }}
            >
                +
            </button>
        </div>
    );
}

/* ── ADD button ── */
function AddBtn({ onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="px-4 py-2 rounded-lg font-black text-white text-[12px] active:scale-95 transition-all ml-auto flex-shrink-0"
            style={{
                background: disabled
                    ? "#d1d5db"
                    : "linear-gradient(135deg, #66bb6a, #43a047)",
                boxShadow: disabled ? "none" : "0 4px 12px rgba(67,160,71,0.35)",
                minWidth: 52,
                color: disabled ? "#9ca3af" : "#fff",
            }}
        >
            ADD
        </button>
    );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function BuyingTab({
    single, setSingle,
    double, setDouble,
    triple, setTriple,
    singleQty, setSingleQty,
    doubleQty, setDoubleQty,
    tripleQty, setTripleQty,
    addSelection,
    quickGuess,
    prices,
    soldQty = {},
    selections = [],
}) {
    const isTripleFilled = triple.a && triple.b && triple.c;
    return (
        <div className="px-3 mt-3 pb-36 space-y-3">

            {/* ══ SINGLE DIGIT ══ */}
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                <SectionHeader
                    title="Single Digit"
                    perTicket={prices.single}
                    win="₹100"
                    onQuickGuess={() => quickGuess("single")}
                />

                {["A", "B", "C"].map((key, i) => {
                    const colors = ["red", "orange", "blue"];
                    const isFilled = single[key] !== "" && single[key] !== undefined;
                    const digits = isFilled ? String(single[key]) : '';
                    const remaining = getRemaining(soldQty, selections, 'single', key, digits);
                    const canAdd = isFilled && remaining > 0;
                    return (
                        <div key={key} className="flex flex-col mt-2.5 gap-1">
                            <div className="flex items-center gap-2">
                                <Ball label={key} color={colors[i]} />
                                <NumBox
                                    value={single[key]}
                                    onChange={(v) => setSingle((prev) => ({ ...prev, [key]: v }))}
                                />
                                <div className="flex-1" />
                                {isFilled && (
                                    <>
                                        <RemainingBadge remaining={remaining} type="single" />
                                        <QuantityStepper
                                            qty={singleQty[key]}
                                            max={remaining}
                                            onChange={(v) => setSingleQty((prev) => ({ ...prev, [key]: v }))}
                                        />
                                    </>
                                )}
                                <AddBtn
                                    disabled={!canAdd}
                                    onClick={() => {
                                        if (!canAdd) return;
                                        addSelection(
                                            "single",
                                            prices.single,
                                            { board: key, digit: single[key] },
                                            singleQty[key]
                                        );
                                        setSingle((prev) => ({ ...prev, [key]: "" }));
                                        setSingleQty((prev) => ({ ...prev, [key]: 1 }));
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ══ DOUBLE DIGIT ══ */}
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                <SectionHeader
                    title="Double Digit"
                    perTicket={prices.double}
                    win="₹1,000"
                    onQuickGuess={() => quickGuess("double")}
                />

                {[
                    { keys: ["A", "B"], stateKey: "AB" },
                    { keys: ["A", "C"], stateKey: "AC" },
                    { keys: ["B", "C"], stateKey: "BC" },
                ].map(({ keys, stateKey }) => {
                    const val = double[stateKey];
                    const isFilled = val.a?.toString().length > 0 && val.b?.toString().length > 0;
                    const digits = isFilled ? `${val.a}${val.b}` : '';
                    const remaining = getRemaining(soldQty, selections, 'double', stateKey, digits);
                    const canAdd = isFilled && remaining > 0;

                    return (
                        <div key={stateKey} className="flex flex-col mt-2.5 gap-1">
                            <div className="flex items-center gap-2">
                                {keys.map((k) => {
                                    const colors = { A: "red", B: "orange", C: "blue" };
                                    return <Ball key={k} label={k} color={colors[k]} />;
                                })}
                                <NumBox
                                    value={val.a}
                                    onChange={(v) =>
                                        setDouble((prev) => ({
                                            ...prev,
                                            [stateKey]: { ...prev[stateKey], a: v },
                                        }))
                                    }
                                />
                                <NumBox
                                    value={val.b}
                                    onChange={(v) =>
                                        setDouble((prev) => ({
                                            ...prev,
                                            [stateKey]: { ...prev[stateKey], b: v },
                                        }))
                                    }
                                />
                                <div className="flex-1" />
                                {isFilled && (
                                    <>
                                        {/* <RemainingBadge remaining={remaining} type="double" /> */}
                                        <QuantityStepper
                                            qty={doubleQty[stateKey]}
                                            max={remaining}
                                            onChange={(v) =>
                                                setDoubleQty((prev) => ({ ...prev, [stateKey]: v }))
                                            }
                                        />
                                    </>
                                )}
                                <AddBtn
                                    disabled={!canAdd}
                                    onClick={() => {
                                        if (!canAdd) return;
                                        addSelection(
                                            "double",
                                            prices.double,
                                            { combo: stateKey, a: val.a, b: val.b },
                                            doubleQty[stateKey]
                                        );
                                        setDouble((prev) => ({
                                            ...prev,
                                            [stateKey]: { a: "", b: "" },
                                        }));
                                        setDoubleQty((prev) => ({ ...prev, [stateKey]: 1 }));
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ══ TRIPLE DIGIT ══ */}
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm mt-3">
                <SectionHeader
                    title="Triple Digit"
                    perTicket={prices.triple}
                    win="₹5,000"
                    onQuickGuess={() => quickGuess("triple")}
                />

                {(() => {
                    const isTripleFilled = triple.a && triple.b && triple.c;
                    const digits = isTripleFilled ? `${triple.a}${triple.b}${triple.c}` : '';
                    const remaining = getRemaining(soldQty, selections, 'triple', 'ABC', digits);
                    const canAdd = isTripleFilled && remaining > 0;

                    return (
                        <div className="flex flex-row justify-between">
                            {/* Balls + digit boxes */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex flex-row gap-2">
                                    {["A", "B", "C"].map((k) => {
                                        const colors = { A: "red", B: "orange", C: "blue" };
                                        return <Ball key={k} label={k} color={colors[k]} />;
                                    })}
                                </div>

                                <div className="flex gap-3">
                                    {["a", "b", "c"].map((k) => (
                                        <NumBox
                                            key={k}
                                            value={triple[k]}
                                            onChange={(v) =>
                                                setTriple((prev) => ({
                                                    ...prev,
                                                    [k]: v,
                                                }))
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Quantity stepper + ADD */}
                            <div className={`flex flex-col items-center gap-2 ${isTripleFilled ? "justify-evenly" : "justify-end"}`}>
                                {isTripleFilled && (
                                    <>
                                        <RemainingBadge remaining={remaining} type="triple" />
                                        <QuantityStepper qty={tripleQty} max={remaining} onChange={setTripleQty} />
                                    </>
                                )}

                                <div className="flex gap-2">
                                    <AddBtn
                                        disabled={!canAdd}
                                        onClick={() => {
                                            if (!canAdd) return;
                                            addSelection("triple", prices.triple, triple, tripleQty);
                                            setTriple({ a: "", b: "", c: "" });
                                            setTripleQty(1);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

        </div>
    );
}

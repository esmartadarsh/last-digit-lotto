import React from "react";

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
function QuantityStepper({ qty, onChange }) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onChange(Math.max(1, qty - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg font-black text-gray-600 active:scale-90 transition-all select-none"
                style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}
            >
                −
            </button>
            <span className="text-gray-800 font-black text-[13px] w-6 text-center select-none">{qty}</span>
            <button
                onClick={() => onChange(qty + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg font-black text-white active:scale-90 transition-all select-none"
                style={{ background: "linear-gradient(135deg, #66bb6a, #43a047)" }}
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
                    return (
                        <div key={key} className="flex items-center gap-2 mt-2.5">
                            <Ball label={key} color={colors[i]} />
                            <NumBox
                                value={single[key]}
                                onChange={(v) => setSingle((prev) => ({ ...prev, [key]: v }))}
                            />
                            <div className="flex-1" />
                            {isFilled && (
                                <QuantityStepper
                                    qty={singleQty[key]}
                                    onChange={(v) => setSingleQty((prev) => ({ ...prev, [key]: v }))}
                                />
                            )}
                            <AddBtn
                                disabled={!isFilled}
                                onClick={() => {
                                    if (!isFilled) return;
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

                    return (
                        <div key={stateKey} className="flex items-center gap-2 mt-2.5">
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
                                <QuantityStepper
                                    qty={doubleQty[stateKey]}
                                    onChange={(v) =>
                                        setDoubleQty((prev) => ({ ...prev, [stateKey]: v }))
                                    }
                                />
                            )}
                            <AddBtn
                                disabled={!isFilled}
                                onClick={() => {
                                    if (!isFilled) return;
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
                    );
                })}
            </div>

            {/* ══ TRIPLE DIGIT ══ */}
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm mt-3">
                <SectionHeader
                    title="Triple Digit"
                    perTicket={prices.triple}
                    win="₹15,000"
                    onQuickGuess={() => quickGuess("triple")}
                />

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

                    {/* Quantity stepper + BOX + ADD */}
                    <div className={`flex flex-col items-center gap-2 ${isTripleFilled ? "justify-evenly" : "justify-end"}`}>
                        {isTripleFilled && (
                            <QuantityStepper qty={tripleQty} onChange={setTripleQty} />
                        )}

                        <div className="flex gap-2">
                            <button
                                className="px-5 py-2 rounded-lg font-black text-white text-[12px] active:scale-95 transition-all"
                                style={{
                                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                                    boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                                }}
                            >
                                BOX
                            </button>

                            <AddBtn
                                disabled={!triple.a || !triple.b || !triple.c}
                                onClick={() => {
                                    if (!triple.a || !triple.b || !triple.c) return;

                                    addSelection("triple", prices.triple, triple, tripleQty);

                                    setTriple({ a: "", b: "", c: "" });
                                    setTripleQty(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

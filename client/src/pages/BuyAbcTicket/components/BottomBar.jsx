import React from "react";

export default function BottomBar({
    totalNumbers = 0,
    totalCost = 0,
    balance = 0,
    onBuy,
    cartOpen = false,
    onToggleCart,
    selections = [],
    onRemoveSelection,
    isPurchasing = false,
}) {
    /* Build a human-readable label for each selection */
    const selectionLabel = (s) => {
        if (s.type === "single") {
            return `${s.data.board} = ${s.data.digit}`;
        } else if (s.type === "double") {
            return `${s.data.combo} = ${s.data.a}${s.data.b}`;
        } else {
            return `ABC = ${s.data.a}${s.data.b}${s.data.c}`;
        }
    };

    const typeLabel = (type) =>
        type === "single" ? "Single" : type === "double" ? "Double" : "Triple";

    const typeBadgeStyle = (type) => {
        if (type === "single") return { background: "#fef3c7", color: "#92400e" };
        if (type === "double") return { background: "#ede9fe", color: "#6d28d9" };
        return { background: "#dcfce7", color: "#166534" };
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-30 mx-auto"
            style={{ maxWidth: 430 }}
        >
            {/* ── Cart slide-up sheet ── */}
            <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                    maxHeight: cartOpen ? "58vh" : "0px",
                    opacity: cartOpen ? 1 : 0,
                }}
            >
                <div
                    className="overflow-y-auto"
                    style={{
                        background: "#fff",
                        maxHeight: "58vh",
                        boxShadow: "0 -8px 32px rgba(0,0,0,0.14)",
                        borderTop: "1px solid #e5e7eb",
                    }}
                >
                    {/* Cart header */}
                    <div
                        className="flex items-center justify-between px-5 py-3 sticky top-0 bg-white z-10"
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                        <span className="font-black text-[14px] text-gray-800">
                            My Selections
                            <span
                                className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-black"
                                style={{ background: "#dcfce7", color: "#166534" }}
                            >
                                {totalNumbers}
                            </span>
                        </span>
                        <button
                            onClick={onToggleCart}
                            className="w-7 h-7 flex items-center justify-center rounded-full active:scale-90 transition-all"
                            style={{ background: "#f3f4f6" }}
                        >
                            <span className="text-gray-600 font-black text-sm leading-none">✕</span>
                        </button>
                    </div>

                    {/* Cart items */}
                    {selections.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8 font-medium">
                            No selections yet. Add tickets above!
                        </p>
                    ) : (
                        <div className="px-4 py-3 flex flex-col gap-2">
                            {selections.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
                                >
                                    {/* Left: type badge + label */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                                            style={typeBadgeStyle(s.type)}
                                        >
                                            {typeLabel(s.type)}
                                        </span>
                                        <span className="font-black text-gray-800 text-[13px]">
                                            {selectionLabel(s)}
                                        </span>
                                    </div>

                                    {/* Right: qty + price + delete */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span
                                            className="text-[11px] font-black px-2 py-0.5 rounded-full"
                                            style={{ background: "#f0fdf4", color: "#16a34a" }}
                                        >
                                            ×{s.qty}
                                        </span>
                                        <span className="text-[13px] font-black text-gray-700">
                                            ₹{s.price % 1 === 0 ? s.price.toFixed(0) : s.price.toFixed(1)}
                                        </span>
                                        <button
                                            onClick={() => onRemoveSelection(s.id)}
                                            className="w-6 h-6 flex items-center justify-center rounded-full active:scale-90 transition-all flex-shrink-0"
                                            style={{ background: "#fee2e2" }}
                                        >
                                            <span className="text-red-500 font-black text-sm leading-none">−</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Top strip: summary + arrow ── */}
            <button
                onClick={onToggleCart}
                className="w-full flex items-center justify-between px-5 py-3 active:bg-gray-50 transition-all"
                style={{
                    background: "rgba(255,255,255,0.97)",
                    backdropFilter: "blur(16px)",
                    borderTop: "1px solid #e5e7eb",
                }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-700">
                        {totalNumbers} Number{totalNumbers !== 1 ? "s" : ""}
                    </span>
                    <span
                        className="text-green-600 text-[12px] font-black transition-transform duration-300"
                        style={{
                            display: "inline-block",
                            transform: cartOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                    >
                        ▲
                    </span>
                </div>
                <span className="text-[13px] font-bold text-gray-700">
                    ₹{totalCost % 1 === 0 ? totalCost.toFixed(0) : totalCost.toFixed(1)}
                </span>
            </button>

            {/* ── Bottom strip: balance + BUY NOW ── */}
            <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                    background: "rgba(255,255,255,0.97)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
                    borderTop: "1px solid #f3f4f6",
                }}
            >
                <div>
                    <span className="text-[14px] font-bold text-gray-700">Balance </span>
                    <span className="text-[14px] font-black" style={{ color: "#dc2626" }}>
                        ₹{balance}
                    </span>
                </div>
                <button
                    onClick={onBuy}
                    disabled={totalNumbers === 0 || isPurchasing}
                    className="flex justify-center items-center px-10 py-3 rounded-xl font-black text-white text-[14px] active:scale-95 transition-all"
                    style={{
                        background:
                            totalNumbers > 0
                                ? "linear-gradient(135deg, #2e7d32, #43a047)"
                                : "#d1d5db",
                        boxShadow:
                            totalNumbers > 0 ? "0 6px 20px rgba(46,125,50,0.4)" : "none",
                        color: totalNumbers > 0 ? "#fff" : "#9ca3af",
                        minWidth: 160,
                    }}
                >
                    {isPurchasing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        "BUY NOW"
                    )}
                </button>
            </div>
        </div>
    );
}
import React from "react";

export default function Header({ onBack, onTicket }) {
    return (
        <div
            className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
            style={{
                background: "linear-gradient(135deg, #2e7d32 0%, #388e3c 60%, #43a047 100%)",
            }}
        >
            <button
                onClick={onBack}
                className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition-all"
                style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.35)",
                }}
            >
                <span className="text-white font-black text-base leading-none">‹</span>
            </button>

            <h1 className="text-white font-black text-base tracking-wide">ABC Game</h1>

            <button
                onClick={onTicket}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black active:scale-95 transition-all"
                style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.45)",
                    color: "#fff",
                }}
            >
                🎟️ My Ticket
            </button>
        </div>
    );
}
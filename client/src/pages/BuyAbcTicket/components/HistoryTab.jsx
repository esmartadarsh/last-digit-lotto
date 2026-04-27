import React from "react";

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
                boxShadow: `0 4px 12px rgba(0,0,0,0.25)`,
            }}
        >
            {label}
        </div>
    );
}

export default function HistoryTab({ data = [] }) {
    return (
        <div className="px-3 mt-4 pb-28 space-y-3">
            {data.length === 0 && (
                 <div className="text-center text-gray-400 font-medium py-8">No results found.</div>
            )}
            {data.map((r, i) => {
                const fullDate = r.draw?.scheduled_at ? new Date(r.draw.scheduled_at) : new Date(r.announced_at);
                const dateStr = fullDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                });
                const timeSlot = r.draw?.time_slot || fullDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

                return (
                    <div
                        key={i}
                        className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm"
                    >
                        {/* Header */}
                        <div
                            className="px-4 py-2 flex justify-between items-center"
                            style={{
                                background: "linear-gradient(135deg, #2e7d32, #43a047)",
                            }}
                        >
                            <span className="text-white font-black text-[12px]">
                                {dateStr}
                            </span>
                            <span className="text-white text-[11px] font-bold">
                                {timeSlot}
                            </span>
                        </div>

                        {/* Balls */}
                        <div className="flex items-center gap-3 px-4 py-3">
                            <Ball label={r.a} color="red" />
                            <Ball label={r.b} color="orange" />
                            <Ball label={r.c} color="blue" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
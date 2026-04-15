export default function DrawBanner({ title, date, digits = [], balls = [], onHowToPlay }) {
    return (
        <div
            className="mx-3 mt-2 rounded-xl overflow-hidden relative"
            style={{
                background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 55%, #388e3c 100%)",
                boxShadow: "0 8px 24px rgba(46,125,50,0.35)",
            }}
        >
            {/* Decorative glow circle */}
            <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(167,243,208,0.18), transparent 70%)" }}
            />

            {/* ── Top row: title + date + pill ── */}
            <div className="relative px-4 pt-3 pb-2 flex items-start justify-between gap-3">
                {/* Left */}
                <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-[13px] leading-tight truncate">{title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-yellow-300 font-bold text-[11px]">📅 {date}</span>
                        <button
                            onClick={onHowToPlay}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white active:scale-95 transition-all flex-shrink-0"
                            style={{
                                background: "rgba(255,255,255,0.2)",
                                border: "1px solid rgba(255,255,255,0.35)",
                            }}
                        >
                            ❓ How to play
                        </button>
                    </div>
                </div>

                {/* Right: countdown */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-green-300 text-[9px] font-bold uppercase tracking-wider">
                        Time Remaining
                    </p>
                    {/* Digit tiles */}
                    <div className="flex items-center gap-[3px]">
                        {digits.map((d, i) => {
                            const separators = [2, 4, 6];
                            return (
                                <span key={i} className="flex items-center gap-[3px]">
                                    {separators.includes(i) && (
                                        <span className="text-white font-black text-[14px] leading-none" style={{ marginBottom: 1 }}>
                                            :
                                        </span>
                                    )}
                                    <div
                                        className="flex items-center justify-center font-black text-white text-[13px] rounded-[5px]"
                                        style={{
                                            width: 22,
                                            height: 26,
                                            background: "linear-gradient(180deg, #2d2d2d 50%, #1a1a1a 50%)",
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        {d}
                                    </div>
                                </span>
                            );
                        })}
                    </div>
                    {/* DD HH MM SS labels */}
                    <div className="flex items-center" style={{ gap: "3px" }}>
                        {["D", "D", "H", "H", "M", "M", "S", "S"].map((l, i) => (
                            <span key={i} className="flex items-center">
                                {[2, 4, 6].includes(i) && <span style={{ width: 9 }} />}
                                <span
                                    className="text-green-400 font-bold"
                                    style={{ fontSize: 8, width: 22, textAlign: "center", display: "inline-block" }}
                                >
                                    {l}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom row: result balls ── */}
            <div
                className="relative px-4 pb-3 flex justify-between items-center gap-2"
                style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
            >
                <p className="text-green-300 font-bold text-[10px] uppercase tracking-wider mr-1">
                    Last Result
                </p>

                <div className="flex justify-evenly">
                    {balls.map((b, i) => (
                        <div
                            key={i}
                            className="w-9 h-9 mx-1 rounded-full flex items-center justify-center font-black text-white text-[14px]"
                            style={{
                                background: b.color,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            }}
                        >
                            {b.label}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
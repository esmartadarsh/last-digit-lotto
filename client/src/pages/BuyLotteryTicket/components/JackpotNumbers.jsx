export default function JackpotNumbers({ balls = [], title = "Last Jackpot" }) {
    return (
        <div
            className="mx-4 mt-3 rounded-2xl px-4 py-3"
            style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "2px solid #fde68a" }}
        >
            <p
                className="text-[10px] font-black uppercase tracking-widest mb-3"
                style={{ color: "#dc2626" }}
            >
                {title}
            </p>
            <div className="flex gap-2 flex-wrap">
                {balls.map((ball, i) => (
                    <div
                        key={i}
                        className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                        style={{
                            background:
                                i % 2 === 0
                                    ? "linear-gradient(135deg, #dc2626, #f87171)"
                                    : "linear-gradient(135deg, #b91c1c, #ef4444)",
                            boxShadow: "0 4px 10px rgba(220,38,38,0.35)",
                        }}
                    >
                        {ball}
                    </div>
                ))}
            </div>
        </div>
    );
}
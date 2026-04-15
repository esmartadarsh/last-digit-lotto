import { useNavigate } from "react-router-dom";

export default function Header({ title = "Nagaland" }) {
    const navigate = useNavigate();

    return (
        <div className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 60%, #991b1b 100%)" }} >
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition-all"
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)" }}
            >
                <span className="text-white font-black text-base leading-none">‹</span>
            </button>

            <h1 className="text-white font-black text-base tracking-wide">{title}</h1>

            {/* My Ticket pill */}
            <button
                onClick={() => navigate("/tickets")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black active:scale-95 transition-all"
                style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color: "#fff",
                }}
            >
                🎟️ My Ticket
            </button>
        </div>
    );
}
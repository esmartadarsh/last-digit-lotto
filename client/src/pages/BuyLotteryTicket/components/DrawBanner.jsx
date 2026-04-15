export default function DrawBanner({ username = "Somu Singh", drawNumber = "NO.03-04-2026", drawTime = "03-04-2026 13:00:00",
}) {
    return (
        <div
            className="mx-4 mt-3 rounded-2xl px-4 py-3 relative overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)",
                boxShadow: "0 8px 24px rgba(109,40,217,0.3)",
            }}
        >
            {/* decorative circles */}
            <div
                className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
            />
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-yellow-300 font-black text-[13px]">{username}</p>
                    <p className="text-purple-200 font-bold text-[11px] mt-0.5">{drawNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-purple-200 text-[10px] font-bold uppercase tracking-wider">Draw Time</p>
                    <p className="text-white font-black text-[12px]">{drawTime}</p>
                </div>
            </div>
        </div>
    );
}
export default function DrawBanner({ username = "Somu Singh", drawNumber = "NO.03-04-2026", drawTime = "03-04-2026 13:00:00", bannerUrl }) {
    return (
        <div
            className="mx-4 mt-3 rounded-2xl relative overflow-hidden"
            style={{
                background: bannerUrl
                    ? "transparent"
                    : "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)",
                boxShadow: "0 8px 24px rgba(109,40,217,0.3)",
                minHeight: 80,
            }}
        >
            {/* Banner image background */}
            {bannerUrl && (
                <img
                    src={bannerUrl}
                    alt="draw banner"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* Dark overlay for readability */}
            <div
                className="absolute inset-0"
                style={{
                    background: bannerUrl
                        ? "linear-gradient(135deg, rgba(76,29,149,0.72) 0%, rgba(109,40,217,0.55) 100%)"
                        : "transparent",
                }}
            />

            {/* Decorative glow circle */}
            <div
                className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
            />

            {/* Content */}
            <div className="relative z-10 flex justify-between items-start px-4 py-3">
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

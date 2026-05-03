export default function BottomBar({ ticketsCount, totalCost, balance, onPurchase, isPurchasing }) {
    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-30 mx-auto px-5 py-4 flex items-center justify-between"
            style={{ maxWidth: '430px', background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderTop: "1px solid #f3f4f6", boxShadow: "0 -8px 32px rgba(0,0,0,0.08)" }}
        >
            {/* Left: ticket count + balance */}
            <div>
                <p className="text-[11px] text-gray-500 font-medium">
                    Tickets:{" "}
                    <span className="font-black text-gray-800">{ticketsCount}</span>
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Balance{" "}
                    <span className="font-black" style={{ color: "#dc2626" }}>
                        ₹{balance}
                    </span>
                </p>
            </div>

            {/* Centre: total cost */}
            <div className="text-right">
                <p className="text-[11px] text-gray-500 font-medium">
                    Total:{" "}
                    <span className="font-black text-gray-800">₹{totalCost}</span>
                </p>
            </div>

            {/* Right: CTA */}
            <button
                onClick={onPurchase}
                disabled={ticketsCount === 0 || isPurchasing}
                className="px-8 py-3 rounded-2xl font-black text-white text-sm active:scale-95 transition-all text-center flex items-center justify-center"
                style={{
                    background: ticketsCount > 0
                        ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                        : "#e5e7eb",
                    boxShadow: ticketsCount > 0
                        ? "0 8px 24px rgba(220,38,38,0.4)"
                        : "none",
                    color: ticketsCount > 0 ? "#fff" : "#9ca3af",
                    minWidth: "130px",
                }}
            >
                {isPurchasing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    "BUY NOW"
                )}
            </button>
        </div>
    );
}
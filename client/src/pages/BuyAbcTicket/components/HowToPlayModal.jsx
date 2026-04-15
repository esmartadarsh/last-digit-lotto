export default function HowToPlayModal({ onClose }) {
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-2xl overflow-hidden flex flex-col"
                style={{ maxWidth: 380, maxHeight: "82vh", background: "#fff" }}
            >
                {/* ── Header ── */}
                <div
                    className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}
                >
                    <h2 className="font-black text-[17px]" style={{ color: "#166534" }}>
                        How to play
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full border-2 active:scale-90 transition-all"
                        style={{ borderColor: "#16a34a", color: "#16a34a", background: "#fff" }}
                    >
                        <span className="font-black text-sm leading-none">✕</span>
                    </button>
                </div>

                {/* ── Content ── */}
                <div className="overflow-y-auto px-5 py-4 flex flex-col gap-3 text-[13px] text-gray-700 leading-relaxed">
                    <p>
                        This ABC game is based on daily result of Kerala &amp; DearLottery&amp;Sikkim &amp;
                        Mizoram lottery &amp;More lottery first prize result last three digit.
                    </p>

                    <p>An example of a first ticket price is <strong>AB 123456</strong></p>

                    <p>
                        A=4 B=5 C=6, AB=45 BC=56 AC=46, ABC=456
                    </p>

                    <div className="h-px bg-gray-100" />

                    {/* Single Digit */}
                    <div>
                        <p className="font-black text-gray-900 text-[14px]">Single Digit Game — A, B, C Board</p>
                        <p className="mt-1">
                            Single digit games can be played on any board between A, B and C.
                        </p>
                        <div className="mt-2 rounded-xl p-3 flex gap-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <div>
                                <p className="text-[11px] text-gray-500 font-medium">Ticket Price</p>
                                <p className="font-black text-green-700 text-[15px]">Rs 10.4</p>
                            </div>
                            <div className="w-px bg-green-200" />
                            <div>
                                <p className="text-[11px] text-gray-500 font-medium">Winning Amount</p>
                                <p className="font-black text-green-700 text-[15px]">Rs 100</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Two Digit */}
                    <div>
                        <p className="font-black text-gray-900 text-[14px]">Two Digit Game — AB, BC, AC</p>
                        <p className="mt-1">
                            In a two-digit game, players can pick two numbers in the last three digits of the
                            result in the combination of AB, BC and AC.
                        </p>
                        <div className="mt-2 rounded-xl p-3 flex gap-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <div>
                                <p className="text-[11px] text-gray-500 font-medium">Ticket Price</p>
                                <p className="font-black text-green-700 text-[15px]">RS 12</p>
                            </div>
                            <div className="w-px bg-green-200" />
                            <div>
                                <p className="text-[11px] text-gray-500 font-medium">Winning Amount</p>
                                <p className="font-black text-green-700 text-[15px]">Rs 1,000</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Three Digit */}
                    <div>
                        <p className="font-black text-gray-900 text-[14px]">Three Digit Game: ABC</p>
                        <p className="mt-1">
                            If a player places a bet on an ABC 3-digit game in a particular lottery there is a
                            three chance of winning.
                        </p>
                        <div className="mt-2 rounded-xl p-3 flex gap-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <div>
                                <p className="text-[11px] text-gray-500 font-medium">Ticket Price</p>
                                <p className="font-black text-green-700 text-[15px]">Rs 30</p>
                            </div>
                            <div className="w-px bg-green-200" />
                            <div>
                                <p className="text-[11px] text-gray-500 font-medium">Winning Amount</p>
                                <p className="font-black text-green-700 text-[15px]">Rs 15,000</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-400 text-center pt-1">Play responsibly. 18+ only.</p>
                </div>
            </div>
        </div>
    );
}

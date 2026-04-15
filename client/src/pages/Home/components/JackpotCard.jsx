export default function JackpotCard() {
    return (
        <div className="px-4 -mt-3">
            <div
                className="relative rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #6d28d9 100%)',
                    boxShadow: '0 16px 48px rgba(109,40,217,0.35)',
                }}
            >
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', filter: 'blur(16px)' }} />

                <div className="relative z-10 p-5">
                    {/* Live badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
                            LIVE MEGA DRAW
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-purple-300 text-[10px] font-bold uppercase tracking-widest mb-1">Jackpot Prize</p>
                            <div className="shimmer-gold text-[44px] font-black tracking-tighter leading-none mb-1">
                                ₹50,000
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-purple-300 text-xs">⏱ Ends in</span>
                                <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs text-white"
                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                    03:45:12
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                                <p className="text-purple-300 text-[10px] font-bold">TICKET</p>
                                <p className="text-white font-black text-lg">₹50</p>
                            </div>
                            <button
                                className="px-5 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                    color: '#fff',
                                    boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
                                }}
                            >
                                🎯 Play
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
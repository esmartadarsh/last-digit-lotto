export default function RecentWinners({ data }) {
    return (
        <div className="px-4 mt-6 mb-2">
            <h3 className="text-[17px] font-black text-gray-900 mb-3">🏆 Recent Winners</h3>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {data.map((w, i) => (
                    <div key={i} className="flex-shrink-0 w-[120px] p-3 rounded-2xl bg-white text-center"
                        style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
                        <div className="w-12 h-12 rounded-full mx-auto mb-2 overflow-hidden"
                            style={{ border: '2px solid #fde68a' }}>
                            <img src={`https://i.pravatar.cc/60?img=${w.img}`} className="w-full h-full object-cover" alt={w.name} />
                        </div>
                        <p className="text-[11px] font-bold text-gray-800 truncate">{w.name}</p>
                        <p className="text-green-600 font-black text-sm">{w.won}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{w.game}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
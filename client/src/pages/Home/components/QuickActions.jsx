export default function QuickActions() {
    
    const actions = [
        { emoji: '💎', label: 'VIP', color: '#f59e0b', bg: '#fffbeb' },
        { emoji: '🎟️', label: 'Coupons', color: '#10b981', bg: '#f0fdf4', isNew: true },
        { emoji: '📋', label: 'Tasks', color: '#6366f1', bg: '#eef2ff', isNew: true },
        { emoji: '🎱', label: 'Bingo', color: '#3b82f6', bg: '#eff6ff' },
    ];

    return (
        <div className="px-4 mt-5">
            <div className="grid grid-cols-4 gap-2">
                {actions.map((a, i) => (
                    <div
                        key={i}
                        className="relative  flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer active:scale-95 transition-all"
                        style={{ background: a.bg, border: `1px solid ${a.color}25` }}>

                        {a.isNew && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />
                        )}
                        <span className="text-2xl">{a.emoji}</span>
                        <span className="text-[10px] font-bold" style={{ color: a.color }}>{a.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
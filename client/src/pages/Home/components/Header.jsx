
export default function Header({ user }) {
    return (

        <div
            className="px-5 pt-5 pb-4"
            style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 60%, #991b1b 100%)',
            }}
        >
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-red-100 text-xs font-semibold mb-0.5 tracking-wide">Welcome back 👋</p>
                    <h1 className="text-[22px] font-black text-white tracking-tight leading-tight">
                        {user.name}
                    </h1>
                </div>

                {/* Avatar + balance pill */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                    >
                        💰 {user.balance}
                    </div>
                    <div
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        style={{ border: '2px solid rgba(255,255,255,0.5)', overflow: 'hidden' }}
                    >
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>

            {/* Search bar style promo strip */}
            <div
                className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
                <span className="text-yellow-300 text-base">🎁</span>
                <p className="text-white text-xs font-semibold flex-1">
                    Refer a friend & earn <span className="text-yellow-300 font-black">₹200 bonus!</span>
                </p>
                <span className="text-white text-xs font-bold opacity-70">›</span>
            </div>
        </div>
    );
}

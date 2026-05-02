import React from 'react'

export default function GamesList({ games }) {
    return (
        <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span> Lottery Games ({games.length})
            </h2>
            {games.length === 0 ? (
                <div className="bg-[#1e293b]/60 border border-slate-700 rounded-2xl p-8 text-center text-slate-500">
                    No lottery games yet. Click <strong>"New Game"</strong> to create one.
                </div>
            ) : (
                <div className="flex flex-wrap gap-3">
                    {games.map(g => (
                        <div key={g.id} className="bg-[#1e293b] border border-indigo-500/20 rounded-xl px-5 py-3 flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                                <div>
                                    <p className="text-white font-semibold text-sm">{g.name}</p>
                                    <p className="text-slate-500 text-xs font-mono">/{g.slug}</p>
                                </div>
                            </div>
                            {/* Toggle active/inactive button commented out */}
                            {/* <button onClick={() => handleToggleGame(g.id, g.is_active)} className="text-xs text-slate-400 hover:text-white underline shrink-0 whitespace-nowrap">
                            {g.is_active ? 'Set Inactive' : 'Set Active'}
                            </button> */}
                            {/* <button onClick={() => handleDeleteGame(g.id)} className="text-xs text-red-400 hover:text-red-300 underline shrink-0 whitespace-nowrap">
                  Delete Game
                </button> */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

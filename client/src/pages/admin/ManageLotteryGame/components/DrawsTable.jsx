import React from 'react'
import { STATUS_COLORS } from '@/data.js';
export default function DrawsTable({ draws, loading, onCloseDraw, onDeleteDraw, onAnnounce }) {
    return (
        <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span> Lottery Draws
            </h2>
            <div className="bg-[#1e293b]/80 backdrop-blur border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#0f172a] text-slate-400 font-semibold uppercase text-xs">
                        <tr>
                            {/* <th className="px-4 py-4">Banner</th> */}
                            <th className="px-6 py-4">Game</th>
                            <th className="px-6 py-4">Scheduled At</th>
                            <th className="px-6 py-4">Ticket Price</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-10 text-slate-500">Loading draws...</td></tr>
                        ) : draws.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-slate-500">No lottery draws found. Create one above.</td></tr>
                        ) : draws.map(draw => (
                            <tr key={draw.id} className="hover:bg-slate-800/40 transition-colors">
                                {/* <td className="px-4 py-3">
                    {draw.banner_url ? (
                      <img
                        src={draw.banner_url}
                        alt="banner"
                        className="w-20 h-11 object-cover rounded-lg border border-slate-700"
                      />
                    ) : (
                      <div className="w-20 h-11 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-600 text-xs">No img</div>
                    )}
                  </td> */}
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-white">{draw.game?.name}</span>
                                    <span className="text-xs text-slate-500 font-mono block">/{draw.game?.slug}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-white">
                                        {new Date(draw.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono font-bold text-emerald-400">₹{parseFloat(draw.ticket_price).toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[draw.status]}`}>
                                        {draw.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {draw.status === 'open' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => onCloseDraw(draw.id)}
                                                    className="text-amber-400 font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-xs">
                                                    Close Draw
                                                </button>
                                                <button onClick={() => onDeleteDraw(draw.id)}
                                                    className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                        {draw.status === 'closed' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => onAnnounce(draw)}
                                                    className="text-emerald-400 font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-xs">
                                                    Announce Result
                                                </button>
                                                <button onClick={() => onDeleteDraw(draw.id)}
                                                    className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                        {draw.status === 'completed' && (
                                            <span className="text-slate-500 italic text-xs">Completed</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

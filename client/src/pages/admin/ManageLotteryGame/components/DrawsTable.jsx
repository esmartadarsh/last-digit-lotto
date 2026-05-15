import React from 'react'
import { STATUS_COLORS } from '@/data.js';

export default function DrawsTable({
  draws, loading, onCloseDraw, onDeleteDraw, onAnnounce, onEditAnnounce, isSuperAdmin,
  page, totalPages, total, limit, statusFilter,
  onStatusChange, onLimitChange, onGoTo, pageNumbers,
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span> Lottery Draws
      </h2>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1 bg-[#0f172a] border border-[#334155] rounded-xl p-1">
          {[{v:'',l:'All'},{v:'open',l:'Open'},{v:'closed',l:'Closed'},{v:'completed',l:'Completed'}].map(opt => (
            <button key={opt.v} onClick={() => onStatusChange(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === opt.v ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              {opt.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Rows per page:</span>
          <select value={limit} onChange={e => onLimitChange(e.target.value)}
            className="bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors">
            {[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-slate-500">
            {total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit,total)} of ${total}` : '0 results'}
          </span>
        </div>
      </div>

      <div className="bg-[#1e293b]/80 backdrop-blur border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0f172a] text-slate-400 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Game</th>
              <th className="px-6 py-4">Scheduled At</th>
              <th className="px-6 py-4">Ticket Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <svg className="w-5 h-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span className="text-sm">Loading draws…</span>
                </div>
              </td></tr>
            ) : draws.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-10 text-slate-500 text-sm">
                No lottery draws found{statusFilter ? ` with status "${statusFilter}"` : ''}. Create one above.
              </td></tr>
            ) : draws.map(draw => (
              <tr key={draw.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-white">{draw.game?.name}</span>
                  <span className="text-xs text-slate-500 font-mono block">/{draw.game?.slug}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-white">{new Date(draw.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-emerald-400">₹{parseFloat(draw.ticket_price).toFixed(2)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[draw.status]}`}>{draw.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {draw.status === 'open' && (
                      <div className="flex gap-2">
                        <button onClick={() => onCloseDraw(draw.id)} className="text-amber-400 font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-xs">Close Draw</button>
                        {isSuperAdmin && <button onClick={() => onDeleteDraw(draw.id)} className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">Delete</button>}
                      </div>
                    )}
                    {draw.status === 'closed' && (
                      <div className="flex gap-2">
                        <button onClick={() => onAnnounce(draw)} className="text-emerald-400 font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-xs">Announce Result</button>
                        {isSuperAdmin && <button onClick={() => onDeleteDraw(draw.id)} className="text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs">Delete</button>}
                      </div>
                    )}
                    {draw.status === 'completed' && (
                      <div className="flex gap-2 items-center">
                        <span className="text-slate-500 italic text-xs">Completed</span>
                        <button onClick={() => onEditAnnounce(draw)} className="text-indigo-400 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors text-xs">Edit Result</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginator */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#334155] flex items-center justify-center gap-1.5 bg-[#0f172a]">
            <button onClick={() => onGoTo(page - 1)} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            {pageNumbers()[0] > 1 && (<><button onClick={() => onGoTo(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">1</button>{pageNumbers()[0] > 2 && <span className="text-slate-600 text-xs px-1">…</span>}</>)}
            {pageNumbers().map(pg => (
              <button key={pg} onClick={() => onGoTo(pg)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all ${pg === page ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'bg-[#1e293b] border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500'}`}>{pg}</button>
            ))}
            {pageNumbers()[pageNumbers().length - 1] < totalPages && (<>{pageNumbers()[pageNumbers().length - 1] < totalPages - 1 && <span className="text-slate-600 text-xs px-1">…</span>}<button onClick={() => onGoTo(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">{totalPages}</button></>)}
            <button onClick={() => onGoTo(page + 1)} disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

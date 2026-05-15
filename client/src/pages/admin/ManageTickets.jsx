import { useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle, FiXCircle, FiClock, FiSearch,
  FiRefreshCw, FiUser, FiTag
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../config/api';
import formatDate12Hour from '@/utils/formatDate12Hour';

const STATUS_BADGE = {
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  active: { label: 'Active', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  won: { label: 'Won', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  lost: { label: 'Lost', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' }
};

export default function ManageTickets() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('lottery'); // 'lottery' or 'abc'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const goTo = (pg) => setPage(Math.min(Math.max(1, pg), totalPages));
  const handleLimitChange = (v) => { setLimit(Number(v)); setPage(1); };
  const pageNumbers = () => {
    const range = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) range.push(i);
    return range;
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, type });
      const res = await api.get(`/admin/tickets?${params}`);
      if (res.data.success) {
        setTickets(res.data.tickets);
        setTotal(res.data.total);
      }
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [type, page, limit]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = tickets.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const ticketStr = type === 'lottery' ? t.ticket_number : t.digits;
    return (
      t.user?.name?.toLowerCase().includes(s) ||
      t.user?.email?.toLowerCase().includes(s) ||
      ticketStr?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-[1200px] w-full mx-auto">

      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">View all user purchased tickets across all games</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-slate-300 transition-colors"
        >
          <FiRefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        {[
          { label: 'Total Tickets', value: total, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Showing Page', value: `${page} / ${totalPages || 1}`, color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border px-5 py-4 ${s.bg}`}>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Rows-per-page + record count */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Rows per page:</span>
        <select value={limit} onChange={e => handleLimitChange(e.target.value)}
          className="bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors">
          {[20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-slate-500">
          {total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit, total)} of ${total}` : '0 results'}
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'lottery', label: 'Lottery Tickets' },
          { key: 'abc', label: 'ABC Tickets' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setType(tab.key); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${type === tab.key
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or ticket info..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-2 text-slate-500">
            <svg className="w-6 h-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span className="text-sm font-medium">Loading tickets…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FiTag size={36} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 font-medium">No tickets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-4 font-semibold">User</th>
                  <th className="text-left px-5 py-4 font-semibold">Game / Draw</th>
                  {type === 'lottery' ? (
                    <th className="text-left px-5 py-4 font-semibold">Ticket No.</th>
                  ) : (
                    <th className="text-left px-5 py-4 font-semibold">Selection</th>
                  )}
                  <th className="text-right px-5 py-4 font-semibold">Price</th>
                  <th className="text-center px-5 py-4 font-semibold">Status</th>
                  <th className="text-left px-5 py-4 font-semibold">Purchased</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((t) => {
                  const badge = STATUS_BADGE[t.status] || STATUS_BADGE.pending;
                  const price = type === 'lottery' ? parseFloat(t.price) : parseFloat(t.total_price);
                  const drawTime = t.draw?.scheduled_at ? formatDate12Hour(t.draw.scheduled_at) : 'N/A';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <FiUser size={15} className="text-orange-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold leading-tight truncate max-w-[130px]">
                              {t.user?.name || 'Unknown'}
                            </p>
                            <p className="text-slate-500 text-xs truncate max-w-[130px]">{t.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Draw/Game */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-slate-300 font-semibold truncate max-w-[150px]">
                            {t.draw?.game?.name || 'Unknown Game'}
                          </p>
                          <p className="text-slate-500 text-xs truncate max-w-[150px]">{drawTime}</p>
                        </div>
                      </td>

                      {/* Ticket Info */}
                      <td className="px-5 py-4">
                        {type === 'lottery' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg">
                              {t.ticket_number}
                            </span>
                            {t.kind === 'sameSet' && (
                              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">Set</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg">
                              {t.position}: {t.digits}
                            </span>
                            <span className="text-slate-500 text-xs ml-2">x{t.qty}</span>
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-black text-white text-base">
                          ₹{price.toFixed(0)}
                        </span>
                        {t.win_amount && t.status === 'won' && (
                          <div className="text-emerald-400 text-xs font-bold mt-1">
                            + ₹{parseFloat(t.win_amount).toFixed(0)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {t.status === 'won' && <FiCheckCircle size={11} />}
                          {t.status === 'lost' && <FiXCircle size={11} />}
                          {(t.status === 'pending' || t.status === 'active') && <FiClock size={11} />}
                          {badge.label}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4">
                        <span className="text-slate-400 text-xs">{formatDate12Hour(t.purchased_at)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {/* Prev */}
          <button onClick={() => goTo(page - 1)} disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>

          {/* First + ellipsis */}
          {pageNumbers()[0] > 1 && (<><button onClick={() => goTo(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">1</button>{pageNumbers()[0] > 2 && <span className="text-slate-600 text-xs px-1">…</span>}</>)}

          {/* Page buttons */}
          {pageNumbers().map(pg => (
            <button key={pg} onClick={() => goTo(pg)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                pg === page ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'bg-[#1e293b] border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500'
              }`}>{pg}</button>
          ))}

          {/* Last + ellipsis */}
          {pageNumbers()[pageNumbers().length - 1] < totalPages && (<>{pageNumbers()[pageNumbers().length - 1] < totalPages - 1 && <span className="text-slate-600 text-xs px-1">…</span>}<button onClick={() => goTo(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 transition-all text-xs font-semibold">{totalPages}</button></>)}

          {/* Next */}
          <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      )}

    </div>
  );
}
